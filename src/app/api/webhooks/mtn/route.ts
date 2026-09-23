import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { payments, subscriptions, webhookEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { addInterval } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";
import { mtnStatusToLocal } from "@/lib/mtn";
import { getClientIp, isRateLimited } from "@/lib/security/rate-limit";

// =============================================================================
// MTN MOMO WEBHOOK — authority for settlement events.
// =============================================================================
// MTN delivers async outcomes for requesttopay / preapproval to the registered
// callback URL. Events are NOT cryptographically signed by MTN — keep this URL
// secret. Replays are deduped via the `webhook_events` table so a re-delivered
// callback never creates duplicate contribution records.
//
// Register this URL as the collection callback (RequestToPay + PreApproval):
//   https://<your-domain>/api/webhooks/mtn
// =============================================================================

export const dynamic = "force-dynamic";

// MTN probes the callback URL with a GET request during provisioning.
export async function GET() {
  return NextResponse.json({ ok: true });
}

type MtnCallback = {
  referenceId?: string;
  preApprovalId?: string;
  externalId?: string;
  status?: string;
  reason?: string;
};

// MTN delivers callbacks with PUT ("The PUT method is used by the Open API
// when sending callbacks") — accept both PUT and POST.
export async function PUT(req: Request) {
  return handleCallback(req);
}

export async function POST(req: Request) {
  return handleCallback(req);
}

async function handleCallback(req: Request): Promise<NextResponse> {
  try {
    // Abuse guard — the URL is public (MTN does not sign callbacks). The
    // dedupe table + terminal-success logic below make replay harmless, but
    // throttle floods anyway.
    if (isRateLimited({ bucket: "mtn-webhook", clientKey: await getClientIp(), limit: 120, windowMs: 60_000 })) {
      return NextResponse.json({ ok: true, dropped: true });
    }

    const bodyBuf = await req.arrayBuffer();
    if (bodyBuf.byteLength > 64 * 1024) {
      return NextResponse.json({ ok: true, dropped: true });
    }
    const raw = Buffer.from(bodyBuf).toString("utf8");
    let event: MtnCallback = {};
    if (raw) {
      event = JSON.parse(raw) as MtnCallback;
    } else {
      return NextResponse.json({ ok: true });
    }

    const status = event.status || "PENDING";
    const accepted = ["SUCCESSFUL", "PENDING", "FAILED", "REJECTED"];
    if (!accepted.includes(status.toUpperCase())) {
      return NextResponse.json({ ok: true, dropped: true });
    }

    // 1. Idempotency — dedupe re-delivered events.
    const eventId = `mtn:${event.preApprovalId || event.referenceId || "unknown"}:${status}`;
    const deduped = await db
      .insert(webhookEvents)
      .values({ eventId, eventType: status })
      .onConflictDoNothing()
      .returning({ id: webhookEvents.id });
    if (deduped.length === 0) {
      return NextResponse.json({ ok: true, deduped: true });
    }

    // 2. Route by payload shape.
    if (event.preApprovalId) {
      await handlePreApprovalCallback(event.preApprovalId, status, event);
    } else if (event.referenceId) {
      await handlePaymentCallback(event.referenceId, status, event);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("MTN webhook error:", err);
    // Ack regardless so MTN stops retrying — reconciliation happens via polling.
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}

async function handlePreApprovalCallback(preApprovalId: string, status: string, event: MtnCallback) {
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.mtnPreApprovalId, preApprovalId),
    with: { payments: true },
  });
  if (!sub) {
    console.warn("MTN webhook: no subscription for pre-approval", preApprovalId);
    return;
  }

  const local = mtnStatusToLocal(status);
  const pendingPayment = sub.payments.find((p) => p.status === "pending");

  // Once active (settled), ignore any later/lower-status callback.
  if (sub.status === "active") return;

  if (local === "success" && sub.status === "pending_authorization") {
    await db
      .update(subscriptions)
      .set({ status: "active", nextBillingDate: addInterval(new Date(), sub.interval) })
      .where(eq(subscriptions.id, sub.id));

    if (pendingPayment) {
      await db
        .update(payments)
        .set({ status: "success" })
        .where(eq(payments.id, pendingPayment.id));
    }

    await createNotification({
      organizationId: sub.organizationId,
      type: "subscription_active",
      title: "Recurring subscription started",
      message: `A supporter set up ${sub.interval} giving of GHS ${(sub.amount / 100).toLocaleString()}.`,
      payload: { subscriptionId: sub.id, mtnPreApprovalId: preApprovalId },
    });
    if (pendingPayment) {
      await createNotification({
        organizationId: sub.organizationId,
        type: "payment_success",
        title: "Payment received",
        message: `A contribution of GHS ${(pendingPayment.amount / 100).toLocaleString()} was received.`,
        payload: { paymentId: pendingPayment.id },
      });
    }
  } else if (local === "failed" && pendingPayment?.status === "pending") {
    await db
      .update(payments)
      .set({ status: "failed" })
      .where(eq(payments.id, pendingPayment.id));
    await createNotification({
      organizationId: sub.organizationId,
      type: "subscription_failed",
      title: "Authorization declined",
      message: event.reason || "A supporter declined the recurring payment authorization.",
      payload: { subscriptionId: sub.id },
    });
  }
}

async function handlePaymentCallback(referenceId: string, status: string, event: MtnCallback) {
  // Match by MTN transaction id first, then by our external reference.
  let payment = await db.query.payments.findFirst({
    where: eq(payments.mtnTransactionId, referenceId),
  });
  if (!payment && event.externalId) {
    payment = await db.query.payments.findFirst({
      where: eq(payments.reference, event.externalId),
    });
  }
  if (!payment) {
    console.warn("MTN webhook: no payment for reference", referenceId, event.externalId);
    return;
  }

  const local = mtnStatusToLocal(status);
  if (payment.status === local) return;
  // Success is terminal — a squashed/late FAILED callback must never regress
  // a payment that already settled.
  if (payment.status === "success") return;
  if (payment.status === "failed" && local === "pending") return;

  const updates: Partial<typeof payments.$inferInsert> = {
    status: local,
    metadata: {
      ...(payment.metadata || {}),
      mtnReason: event.reason || null,
    },
  };
  await db.update(payments).set(updates).where(eq(payments.id, payment.id));

  if (local === "success") {
    await createNotification({
      organizationId: payment.organizationId,
      type: "payment_success",
      title: "Payment received",
      message: `A contribution of GHS ${(payment.amount / 100).toLocaleString()} was received.`,
      payload: { paymentId: payment.id, reference: payment.reference },
    });
  } else if (local === "failed") {
    await createNotification({
      organizationId: payment.organizationId,
      type: "payment_failed",
      title: "Payment failed",
      message: event.reason || "A supporter's contribution could not be completed.",
      payload: { paymentId: payment.id, reference: payment.reference },
    });
  }
}