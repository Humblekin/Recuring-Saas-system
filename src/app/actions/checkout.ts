"use server";

import crypto from "node:crypto";
import { db } from "@/lib/db";
import {
  organizations,
  campaigns,
  payments,
  supporters,
  paymentLinks,
  subscriptions,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { addInterval } from "@/lib/utils";
import {
  createPreApproval,
  getPreApprovalStatus,
  getTransactionStatus,
  isValidMsisdn,
  mtnConfigMissing,
  mtnStatusToLocal,
  normalizeMsisdn,
  requestToPay,
} from "@/lib/mtn";
import { createNotification } from "@/lib/notifications";
import { cleanEmail, cleanText, MAX_NAME } from "@/lib/security/sanitize";
import { getClientIp, isRateLimited } from "@/lib/security/rate-limit";

// =============================================================================
// CHECKOUT (PUBLIC) — start an MTN MoMo payment for a one-time or recurring
// contribution against a payment link and/or campaign.
// =============================================================================
// - Validates the requested amount/type against the payment link configuration
// - Creates the pending payment record (source of truth, idempotency key = reference)
// - One-time:  POST /collection/v1_0/requesttopay   (payer approves on their phone)
// - Recurring: POST /collection/v1_0/preapproval    (payer authorizes auto-debits)
// Both flows are ASYNC: MTN returns 202 and the payer must approve the prompt in
// their MoMo app. The client polls getMomoStatus(); the webhook is the fallback
// authority for settlement events.
// =============================================================================

const MAX_AMOUNT_MAJOR = 100000; // GHS 100,000 cap

// MTN's maximum pre-approval validity (capped at 32768 hours ≈ 3.7 years);
// 5-year intent is capped here by the platform.
const PRE_APPROVAL_VALIDITY_SECONDS = 32768 * 60 * 60;

export type CheckoutResult =
  | {
      kind: "one-time";
      referenceId: string;
      paymentReference: string;
      receiptPath: string;
    }
  | {
      kind: "recurring";
      preApprovalId: string;
      subscriptionId: string;
      paymentReference: string;
      receiptPath: string;
    };

export async function processCheckout(data: {
  orgSlug: string;
  linkSlug?: string;
  campaignSlug?: string;
  amount: number; // GHS major units
  email: string;
  name: string;
  phone: string;
  mode: "one-time" | "recurring";
  frequency?: "weekly" | "monthly" | "yearly";
}): Promise<CheckoutResult> {
  // 1. Guard against courtesy spam / abuse of the public endpoint.
  if (isRateLimited({ bucket: "checkout", clientKey: await getClientIp(), limit: 10, windowMs: 60_000 })) {
    throw new Error("Too many attempts. Please wait a moment and try again.");
  }

  // 1b. Sanitize + normalize input
  const email = cleanEmail(data.email);
  const name = cleanText(data.name, MAX_NAME);
  if (!email.includes("@")) {
    throw new Error("Please provide a valid email address.");
  }
  if (!Number.isFinite(data.amount) || data.amount <= 0) {
    throw new Error("Please select or enter a valid amount.");
  }
  if (data.amount > MAX_AMOUNT_MAJOR) {
    throw new Error("That amount is too large to process.");
  }
  if (!data.phone || !isValidMsisdn(data.phone)) {
    throw new Error("Please provide a valid MTN MoMo phone number (e.g. 024…).");
  }

  // 2. Resolve the organization
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, data.orgSlug),
  });
  if (!org) throw new Error("Organization not found.");

  // 3. Resolve the payment link (optional)
  let link = null;
  if (data.linkSlug) {
    link = await db.query.paymentLinks.findFirst({
      where: and(
        eq(paymentLinks.organizationId, org.id),
        eq(paymentLinks.slug, data.linkSlug),
        eq(paymentLinks.isActive, true)
      ),
    });
    if (!link) throw new Error("This payment link is no longer active.");
  }

  // 4. Resolve the campaign (optional) — must belong to the same org + link
  let campaignId: string | null = null;
  if (data.campaignSlug) {
    const camp = await db.query.campaigns.findFirst({
      where: and(eq(campaigns.organizationId, org.id), eq(campaigns.slug, data.campaignSlug), eq(campaigns.isActive, true)),
    });
    if (!camp) throw new Error("Campaign not found or no longer active.");
    campaignId = camp.id;
    if (link && camp.paymentLinkId && link.id !== camp.paymentLinkId) {
      throw new Error("This campaign is not associated with the selected payment link.");
    }
  }

  // 5. Validate recurring options
  const isRecurring = data.mode === "recurring";
  if (isRecurring) {
    if (link && !link.recurringEnabled) {
      throw new Error("Recurring contributions are not enabled for this link.");
    }
    if (!data.frequency || !["weekly", "monthly", "yearly"].includes(data.frequency)) {
      throw new Error("Please choose a recurring frequency.");
    }
    if (link && link.frequencies && !link.frequencies.includes(data.frequency)) {
      throw new Error("That frequency is not available for this link.");
    }
  }

  // 6. MTN configuration sanity check (friendly error before hitting a wall later)
  const missing = mtnConfigMissing();
  if (missing.length > 0) {
    throw new Error("Payments are not configured yet. Please try again later.");
  }

  // 7. Find or create the supporter (race-safe: unique email constraint)
  let supporter = await db.query.supporters.findFirst({
    where: eq(supporters.email, email),
  });

  if (!supporter) {
    const inserted = await db
      .insert(supporters)
      .values({ email, name: name || null, phone: normalizeMsisdn(data.phone) })
      .onConflictDoNothing()
      .returning();
    supporter =
      inserted[0] ??
      (await db.query.supporters.findFirst({ where: eq(supporters.email, email) }));
    if (!supporter) throw new Error("Could not create supporter record.");
  }

  // 8. Build the payment + provider references (amount stored in pesewas)
  const reference = `cowrie_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`.toLowerCase();
  const amountInPesewas = Math.round(data.amount * 100);
  const payerMsisdn = normalizeMsisdn(data.phone);

  await db.insert(payments).values({
    reference,
    organizationId: org.id,
    paymentLinkId: link?.id ?? null,
    campaignId,
    supporterId: supporter.id,
    amount: amountInPesewas,
    status: "pending",
    isRecurring,
    paymentMethod: "mtn_momo",
  });

  const receiptPath = `/give/${org.slug}/callback`;

  try {
    if (!isRecurring) {
      // 9a. ONE-TIME — request a payment from the payer's MoMo wallet.
      const referenceId = crypto.randomUUID();
      await requestToPay(
        {
          amountMinor: amountInPesewas,
          externalId: reference,
          payerMsisdn,
          payerMessage: "Your contribution to " + org.name,
          payeeNote: "Cowrie contribution to " + org.name,
        },
        referenceId
      );
      await db
        .update(payments)
        .set({ mtnTransactionId: referenceId })
        .where(eq(payments.reference, reference));

      return {
        kind: "one-time",
        referenceId,
        paymentReference: reference,
        receiptPath: `${receiptPath}?kind=one-time&referenceId=${referenceId}`,
      };
    }

    // 9b. RECURRING — ask the payer to authorize a pre-approval.
    const preApprovalId = crypto.randomUUID();
    await createPreApproval(
      {
        amountMinor: amountInPesewas,
        externalId: reference,
        payerMsisdn,
        validityTimeSeconds: PRE_APPROVAL_VALIDITY_SECONDS,
        payerMessage: "Authorize recurring contributions to " + org.name,
        payeeNote: "Recurring contributions to " + org.name,
      },
      preApprovalId
    );

    const inserted = await db
      .insert(subscriptions)
      .values({
        organizationId: org.id,
        supporterId: supporter.id,
        paymentLinkId: link?.id ?? null,
        campaignId,
        mtnPreApprovalId: preApprovalId,
        payerMsisdn,
        amount: amountInPesewas,
        interval: data.frequency!,
        status: "pending_authorization",
      })
      .returning();

    const subscription = inserted[0];
    await db
      .update(payments)
      .set({ subscriptionId: subscription.id })
      .where(eq(payments.reference, reference));

    return {
      kind: "recurring",
      preApprovalId,
      subscriptionId: subscription.id,
      paymentReference: reference,
      receiptPath: `${receiptPath}?kind=recurring&referenceId=${preApprovalId}`,
    };
  } catch (err) {
    // Provider could not be reached — the pending record must not look usable.
    await db
      .update(payments)
      .set({ status: "failed" })
      .where(eq(payments.reference, reference));
    throw err;
  }
}

// =============================================================================
// STATUS CHECK (POLLING) — used by the giving form while the payer approves the
// MoMo prompt, and as the receipt-page trust anchor.
// =============================================================================

export type MomoStatusResult =
  | { status: "pending"; paymentReference: string }
  | { status: "success"; paymentReference: string }
  | { status: "failed"; paymentReference: string; reason?: string };

export async function getMomoStatus(data: {
  kind: "one-time" | "recurring";
  referenceId: string;
}): Promise<MomoStatusResult> {
  if (data.kind === "one-time") return checkOneTimeStatus(data.referenceId);
  return checkRecurringStatus(data.referenceId);
}

async function checkOneTimeStatus(referenceId: string): Promise<MomoStatusResult> {
  const payment = await db.query.payments.findFirst({
    where: eq(payments.mtnTransactionId, referenceId),
  });
  if (!payment) {
    return { status: "pending", paymentReference: referenceId };
  }

  const tx = await getTransactionStatus(referenceId);
  const local = mtnStatusToLocal(tx.status);

  if (local !== "pending" && payment.status !== local) {
    await db
      .update(payments)
      .set({
        status: local,
        metadata: { ...(payment.metadata || {}), mtnReason: tx.reason || null, financialTransactionId: tx.financialTransactionId || null },
      })
      .where(eq(payments.id, payment.id));

    if (local === "success") {
      await createNotification({
        organizationId: payment.organizationId,
        type: "payment_success",
        title: "Payment received",
        message: `A contribution of GHS ${(payment.amount / 100).toLocaleString()} was received.`,
        payload: { paymentId: payment.id, reference: payment.reference },
      });
    } else {
      await createNotification({
        organizationId: payment.organizationId,
        type: "payment_failed",
        title: "Payment failed",
        message: tx.reason || "A supporter's contribution could not be completed.",
        payload: { paymentId: payment.id, reference: payment.reference },
      });
    }
  }

  return {
    status: local,
    paymentReference: payment.reference,
    reason: tx.reason ?? undefined,
  };
}

async function checkRecurringStatus(preApprovalId: string): Promise<MomoStatusResult> {
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.mtnPreApprovalId, preApprovalId),
    with: { payments: true },
  });
  if (!subscription) {
    return { status: "pending", paymentReference: preApprovalId };
  }

  const ps = await getPreApprovalStatus(preApprovalId);
  const local = mtnStatusToLocal(ps.status);
  const pendingPayment = subscription.payments.find((p) => p.status === "pending");

  if (local === "success" && subscription.status === "pending_authorization") {
    const now = new Date();
    await db
      .update(subscriptions)
      .set({ status: "active", nextBillingDate: addInterval(now, subscription.interval) })
      .where(eq(subscriptions.id, subscription.id));

    if (pendingPayment) {
      await db
        .update(payments)
        .set({ status: "success" })
        .where(eq(payments.id, pendingPayment.id));
    }

    await createNotification({
      organizationId: subscription.organizationId,
      type: "subscription_active",
      title: "Recurring subscription started",
      message: `A supporter set up ${subscription.interval} giving of GHS ${(subscription.amount / 100).toLocaleString()}.`,
      payload: { subscriptionId: subscription.id },
    });
    if (pendingPayment) {
      await createNotification({
        organizationId: subscription.organizationId,
        type: "payment_success",
        title: "Payment received",
        message: `A contribution of GHS ${(subscription.amount / 100).toLocaleString()} was received.`,
        payload: { subscriptionId: subscription.id },
      });
    }
  }

  if (local === "failed" && pendingPayment && pendingPayment.status === "pending") {
    await db
      .update(payments)
      .set({ status: "failed" })
      .where(eq(payments.id, pendingPayment.id));
    await createNotification({
      organizationId: subscription.organizationId,
      type: "subscription_failed",
      title: "Authorization declined",
      message: "A supporter declined the recurring payment authorization.",
      payload: { subscriptionId: subscription.id },
    });
  }

  return {
    status: local,
    paymentReference: pendingPayment?.reference ?? subscription.id,
    reason: local === "failed" ? ps.status : undefined,
  };
}