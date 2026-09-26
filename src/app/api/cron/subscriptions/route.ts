import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { payments, subscriptions } from "@/lib/db/schema";
import { eq, lte, and, isNotNull } from "drizzle-orm";
import { addInterval } from "@/lib/utils";
import {
  mtnConfigMissing,
  requestToPayAgainstPreApproval,
  MtnApiError,
} from "@/lib/mtn";

// =============================================================================
// RECURRING DEBIT RUNNER (cron job)
// =============================================================================
// Charges every active subscription whose nextBillingDate has arrived by
// calling MTN's "requestToPay against a pre-approval" endpoint — the payer is
// NOT prompted again. Outcomes settle via the /api/webhooks/mtn route.
//
// Protect with a secret. Scheduled daily via vercel.json. Example (manual run):
//   curl -H "Authorization: Bearer $CRON_SECRET" \
//     https://<your-domain>/api/cron/subscriptions
// =============================================================================
//
// DOUBLE-CHARGE SAFETY
// The MTN call is an irreversible, out-of-transaction side effect, so it must
// never sit between "read who is due" and "record that we billed them". This
// runner therefore uses claim-then-charge:
//
//   1. CLAIM  — a single compare-and-swap UPDATE moves nextBillingDate forward
//               and stamps the claim. Its WHERE clause pins the exact
//               nextBillingDate that was read, so if a second worker (overlapping
//               cron trigger, retry, concurrent invocation) already claimed this
//               billing slot, rowCount is 0 and we skip. The claim is committed
//               BEFORE the charge, so a crash mid-charge consumes a billing slot
//               but can never bill a supporter twice.
//   2. CHARGE — call MTN, then record the payment.
//
// A definitive MTN rejection (4xx) rolls the claim back so the slot retries on
// the next run. A transient/unknown failure (timeout, 5xx) deliberately does
// NOT roll back: we cannot prove the money did not move, and re-charging is far
// worse than skipping one cycle, so the slot is left consumed and surfaced in
// the response for reconciliation.
//
// SCHEDULE DRIFT
// The next date is computed from the PREVIOUS nextBillingDate, not from "now".
// Computing it from "now" made every late run push the schedule permanently
// forward, so a monthly supporter billed a day late stayed a day late forever.

export const dynamic = "force-dynamic";

/**
 * Constant-time secret comparison. A plain `!==` on a shared secret leaks its
 * value byte-by-byte through response timing.
 */
function secretMatches(provided: string, expected: string): boolean {
  if (provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < provided.length; i++) {
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Accept the shared secret under either header.
 *
 * Vercel Cron does NOT send `x-cron-secret` — it sends
 * `Authorization: Bearer <CRON_SECRET>`. Checking only the custom header meant a
 * real Vercel Cron schedule got 401 on every run, so recurring debits would
 * silently never fire while looking correctly configured. The custom header is
 * still accepted for manual runs and other schedulers.
 */
function isAuthorized(req: Request, secret: string): boolean {
  const auth = req.headers.get("authorization");
  if (auth && /^Bearer\s+/i.test(auth)) {
    if (secretMatches(auth.replace(/^Bearer\s+/i, "").trim(), secret)) return true;
  }
  const custom = req.headers.get("x-cron-secret");
  return custom ? secretMatches(custom, secret) : false;
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !isAuthorized(req, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (mtnConfigMissing().length > 0) {
    return NextResponse.json({ error: "MTN MoMo is not configured." }, { status: 500 });
  }

  const due = await db.query.subscriptions.findMany({
    where: and(
      eq(subscriptions.status, "active"),
      isNotNull(subscriptions.nextBillingDate),
      lte(subscriptions.nextBillingDate, new Date())
    ),
  });

  let charged = 0;
  let failed = 0;
  let skipped = 0;
  const needsReconciliation: string[] = [];

  for (const sub of due) {
    if (!sub.mtnPreApprovalId || !sub.payerMsisdn || !sub.nextBillingDate) {
      failed++;
      continue;
    }

    const previousBillingDate = sub.nextBillingDate;
    // Drift-free: advance from the slot that was due, not from the current time.
    const claimedBillingDate = addInterval(previousBillingDate, sub.interval);

    // 1. CLAIM — compare-and-swap on the exact due date we read.
    const claimed = await db
      .update(subscriptions)
      .set({ nextBillingDate: claimedBillingDate })
      .where(
        and(
          eq(subscriptions.id, sub.id),
          eq(subscriptions.status, "active"),
          // Pins the row to the billing slot we selected: if anyone else already
          // advanced it, this matches nothing and we must not charge.
          eq(subscriptions.nextBillingDate, previousBillingDate)
        )
      )
      .returning({ id: subscriptions.id });

    if (claimed.length === 0) {
      skipped++;
      continue;
    }

    // 2. CHARGE — irreversible, now safely after the claim.
    try {
      const { referenceId } = await requestToPayAgainstPreApproval(sub.mtnPreApprovalId, {
        amountMinor: sub.amount,
        externalId: `kivaro_sub_${sub.id}_${previousBillingDate.getTime()}`,
        payerMsisdn: sub.payerMsisdn,
        payerMessage: "Your recurring contribution",
        payeeNote: "Recurring contribution via Kivaro",
      });

      await db.insert(payments).values({
        reference: `kivaro_sub_${sub.id}_${previousBillingDate.getTime()}`,
        organizationId: sub.organizationId,
        paymentLinkId: sub.paymentLinkId,
        campaignId: sub.campaignId,
        supporterId: sub.supporterId,
        subscriptionId: sub.id,
        amount: sub.amount,
        status: "pending",
        isRecurring: true,
        paymentMethod: "mtn_momo",
        mtnTransactionId: referenceId,
      });

      charged++;
    } catch (err) {
      console.error("Recurring debit failed for subscription", sub.id, err);
      failed++;

      const definitiveRejection = err instanceof MtnApiError && !err.transient;

      if (definitiveRejection) {
        // MTN refused outright, so no money moved: give the slot back and let the
        // next run retry. Guarded by another CAS so we cannot clobber a schedule
        // that something else has since moved.
        await db
          .update(subscriptions)
          .set({ nextBillingDate: previousBillingDate })
          .where(
            and(
              eq(subscriptions.id, sub.id),
              eq(subscriptions.nextBillingDate, claimedBillingDate)
            )
          );
      } else {
        // Unknown outcome (timeout / 5xx). Do NOT retry automatically: MTN may
        // have taken the money. Leave the slot consumed and report it.
        needsReconciliation.push(sub.id);
      }
    }
  }

  return NextResponse.json({
    processed: due.length,
    charged,
    failed,
    skipped,
    needsReconciliation,
  });
}
