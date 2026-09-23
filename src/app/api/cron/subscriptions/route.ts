import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { payments, subscriptions } from "@/lib/db/schema";
import { eq, lte, and, isNotNull } from "drizzle-orm";
import { addInterval } from "@/lib/utils";
import { mtnConfigMissing, requestToPayAgainstPreApproval } from "@/lib/mtn";

// =============================================================================
// RECURRING DEBIT RUNNER (cron job)
// =============================================================================
// Charges every active subscription whose nextBillingDate has arrived by
// calling MTN's "requestToPay against a pre-approval" endpoint — the payer is
// NOT prompted again. Outcomes settle via the /api/webhooks/mtn route.
//
// Protect with a secret. Example (Vercel Cron):
//   every 7 days → https://<your-domain>/api/cron/subscriptions
//   header: x-cron-secret: <CRON_SECRET>
// =============================================================================

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("x-cron-secret") !== secret) {
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

  for (const sub of due) {
    if (!sub.mtnPreApprovalId || !sub.payerMsisdn) {
      failed++;
      continue;
    }

    const reference = `cowrie_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`.toLowerCase();

    try {
      const { referenceId } = await requestToPayAgainstPreApproval(sub.mtnPreApprovalId, {
        amountMinor: sub.amount,
        externalId: reference,
        payerMsisdn: sub.payerMsisdn,
        payerMessage: "Your recurring contribution",
        payeeNote: "Recurring contribution via Cowrie",
      });

      await db.insert(payments).values({
        reference,
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

      await db
        .update(subscriptions)
        .set({ nextBillingDate: addInterval(new Date(), sub.interval) })
        .where(eq(subscriptions.id, sub.id));

      charged++;
    } catch (err) {
      console.error("Recurring debit failed for subscription", sub.id, err);
      failed++;
    }
  }

  return NextResponse.json({ processed: due.length, charged, failed });
}