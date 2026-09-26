"use server";

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
  logPay,
  MtnApiError,
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

// Client-generated UUID that identifies one checkout attempt across retries.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// MTN rejects a repeated X-Reference-Id. That is NOT a failed payment: it means
// the first attempt already created the charge. The row must stay pending and
// the client must keep polling the same reference, otherwise a retry would
// overwrite a live transaction with a bogus "failed" status.
function isDuplicateReferenceError(err: unknown): boolean {
  if (!(err instanceof MtnApiError)) return false;
  if (err.status !== 400 && err.status !== 409) return false;
  const m = err.message.toLowerCase();
  return m.includes("reference") || m.includes("duplicate") || m.includes("already exist");
}

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
    }
  // Returned (not thrown) when the provider rejects the flow — thrown errors
  // are redacted in production and would surface as a cryptic "#441" message.
  | {
      kind: "unavailable";
      reason: string;
      paymentReference: string;
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
  // Stable across retries of the SAME checkout attempt. The browser generates
  // it once and reuses it if the request times out, so a supporter who retries
  // can never be charged twice.
  idempotencyKey: string;
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
  if (!data.idempotencyKey || !UUID_RE.test(data.idempotencyKey)) {
    throw new Error("Invalid checkout request. Please refresh the page and try again.");
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

  // 8. Build the payment record. The idempotency key doubles as MTN's
  //    X-Reference-Id, so a retry re-sends the IDENTICAL reference and MTN
  //    de-duplicates it: at most one charge can ever exist per key.
  const amountInPesewas = Math.round(data.amount * 100);
  const payerMsisdn = normalizeMsisdn(data.phone);
  const idempotencyKey = data.idempotencyKey.toLowerCase();
  const mtnReferenceId = idempotencyKey;
  const reference = `kivaro_${idempotencyKey.replace(/-/g, "").slice(0, 16)}`;

  const receiptPath = `/give/${org.slug}/callback`;

  const insertedRows = await db
    .insert(payments)
    .values({
      reference,
      idempotencyKey,
      organizationId: org.id,
      paymentLinkId: link?.id ?? null,
      campaignId,
      supporterId: supporter.id,
      amount: amountInPesewas,
      status: "pending",
      isRecurring,
      paymentMethod: "mtn_momo",
    })
    .onConflictDoNothing()
    .returning();

  // Lost the insert race (double submit, or a retry arriving while the first
  // attempt is still in flight) — adopt the row that actually won.
  const payment =
    insertedRows[0] ??
    (await db.query.payments.findFirst({ where: eq(payments.idempotencyKey, idempotencyKey) }));
  if (!payment) throw new Error("Could not create payment record.");

  // Replay guard: a key that already produced a provider reference must never
  // be charged again. Return the original result so the client can carry on
  // polling the same transaction.
  if (payment.mtnTransactionId) {
    logPay("checkout replay, returning existing charge:", {
      reference: payment.reference,
      org: org.slug,
      status: payment.status,
    });
    if (payment.status === "failed") {
      throw new Error("This payment attempt already failed. Please start a new payment.");
    }
    if (!isRecurring || !payment.subscriptionId) {
      return {
        kind: "one-time",
        referenceId: payment.mtnTransactionId,
        paymentReference: payment.reference,
        receiptPath: `${receiptPath}?kind=one-time&referenceId=${payment.mtnTransactionId}`,
      };
    }
    return {
      kind: "recurring",
      preApprovalId: payment.mtnTransactionId,
      subscriptionId: payment.subscriptionId,
      paymentReference: payment.reference,
      receiptPath: `${receiptPath}?kind=recurring&referenceId=${payment.mtnTransactionId}`,
    };
  }

  // No provider reference yet: either a fresh checkout, or a crash between the
  // insert and the MTN call. Re-driving below with the same X-Reference-Id is
  // safe in both cases.
  logPay("payment created pending:", { reference: payment.reference, org: org.slug, amountGHS: data.amount, type: data.mode, frequency: data.frequency || null });

  try {
    if (!isRecurring) {
      // 9a. ONE-TIME — request a payment from the payer's MoMo wallet.
      await requestToPay(
        {
          amountMinor: amountInPesewas,
          externalId: payment.reference,
          payerMsisdn,
          payerMessage: "Your contribution to " + org.name,
          payeeNote: "Kivaro contribution to " + org.name,
        },
        mtnReferenceId
      );
      await db
        .update(payments)
        .set({ mtnTransactionId: mtnReferenceId })
        .where(eq(payments.id, payment.id));

      return {
        kind: "one-time",
        referenceId: mtnReferenceId,
        paymentReference: payment.reference,
        receiptPath: `${receiptPath}?kind=one-time&referenceId=${mtnReferenceId}`,
      };
    }

    // 9b. RECURRING — ask the payer to authorize a pre-approval.
    const preApprovalId = mtnReferenceId;
    await createPreApproval(
      {
        amountMinor: amountInPesewas,
        externalId: payment.reference,
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
      .where(eq(payments.id, payment.id));

    return {
      kind: "recurring",
      preApprovalId,
      subscriptionId: subscription.id,
      paymentReference: payment.reference,
      receiptPath: `${receiptPath}?kind=recurring&referenceId=${preApprovalId}`,
    };
  } catch (err) {
    // A repeated reference means the charge already exists — recover instead of
    // failing a live payment.
    if (isDuplicateReferenceError(err)) {
      logPay("provider reported duplicate reference; keeping payment pending:", {
        reference: payment.reference,
        org: org.slug,
      });
      await db
        .update(payments)
        .set({ mtnTransactionId: mtnReferenceId })
        .where(eq(payments.id, payment.id));

      if (isRecurring) {
        const existingSub = await db.query.subscriptions.findFirst({
          where: eq(subscriptions.mtnPreApprovalId, mtnReferenceId),
        });
        if (existingSub) {
          return {
            kind: "recurring",
            preApprovalId: mtnReferenceId,
            subscriptionId: existingSub.id,
            paymentReference: payment.reference,
            receiptPath: `${receiptPath}?kind=recurring&referenceId=${mtnReferenceId}`,
          };
        }
        throw new Error("Your authorization is already in progress. Please check your MoMo wallet.");
      }

      return {
        kind: "one-time",
        referenceId: mtnReferenceId,
        paymentReference: payment.reference,
        receiptPath: `${receiptPath}?kind=one-time&referenceId=${mtnReferenceId}`,
      };
    }

    // Provider could not be reached — the pending record must not look usable.
    // Persist the real reason so the dashboard explains the failure instead of
    // showing a bare "failed" status.
    const msg = err instanceof Error ? err.message : String(err);
    logPay("provider request failed, payment marked failed:", { reference: payment.reference, org: org.slug, error: msg.slice(0, 160) });
    await db
      .update(payments)
      .set({
        status: "failed",
        metadata: { mtnReason: msg, failedAt: new Date().toISOString() },
      })
      .where(eq(payments.id, payment.id));

    // Recurring pre-approval is commonly not provisioned on an MTN account
    // (the sandbox returns 404 for /collection/v1_0/preapproval). Surface a
    // clear, actionable message instead of a raw API error.
    if (isRecurring && err instanceof MtnApiError && err.status === 404 && err.message.includes("preapproval")) {
      return {
        kind: "unavailable",
        reason: "Recurring giving is not available on this account yet. Please use one-time giving instead.",
        paymentReference: payment.reference,
      };
    }
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
  // This action is public and unauthenticated, takes no ownership proof, and
  // makes an outbound MTN call plus a DB write on every call — an unthrottled
  // amplification vector against both MTN and the database. The giving form
  // polls every 4s (15/min), so this leaves ample headroom for a real payer.
  if (isRateLimited({ bucket: "momo-status", clientKey: await getClientIp(), limit: 40, windowMs: 60_000 })) {
    throw new Error("Too many status checks. Please wait a moment and try again.");
  }
  if (!data.referenceId || !UUID_RE.test(data.referenceId)) {
    throw new Error("Invalid reference.");
  }

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

  // Success is terminal — mirror the webhook guard so a poll arriving late (or
  // an MTN status flip) can never regress an already-settled payment.
  if (payment.status === "success") {
    return { status: "success", paymentReference: payment.reference };
  }

  const tx = await getTransactionStatus(referenceId);
  const local = mtnStatusToLocal(tx.status);
  logPay("one-time status poll:", { referenceId, mtnStatus: tx.status, local, db: payment.status });

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
  logPay("recurring status poll:", { preApprovalId, mtnStatus: ps.status, local, db: subscription.status });
  const pendingPayment = subscription.payments.find((p) => p.status === "pending");

  // Active is terminal for the consent — return early so a transient PENDING
  // from MTN (or a replay) never flips an authorized subscription backwards.
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