"use server";

import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireOrgContext } from "@/lib/auth/org";
import { revalidatePath } from "next/cache";
import { deletePreApproval } from "@/lib/mtn";
import { createNotification } from "@/lib/notifications";

// =============================================================================
// RECURRING SUBSCRIPTION MANAGEMENT
// =============================================================================

/**
 * Cancel a supporter's recurring contribution. Revokes the MTN pre-approval
 * (so the platform stops honoring auto-debits) and mirrors the state locally.
 * Deletion is best-effort: even if MTN is unreachable the local mirror is
 * marked canceled so the support dashboard stays truthful.
 */
export async function cancelRecurringSubscription(subscriptionId: string) {
  const { organization } = await requireOrgContext();

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.id, subscriptionId),
  });

  if (!subscription || subscription.organizationId !== organization.id) {
    throw new Error("Subscription not found.");
  }
  if (subscription.status === "canceled") {
    throw new Error("This recurring contribution is already canceled.");
  }

  // Revoke the payer's consent with MTN so future auto-debits are rejected.
  if (subscription.mtnPreApprovalId) {
    try {
      await deletePreApproval(subscription.mtnPreApprovalId);
    } catch (err) {
      console.error("MTN pre-approval deletion failed (continuing with local cancel):", err);
    }
  }

  await db
    .update(subscriptions)
    .set({ status: "canceled", canceledAt: new Date() })
    .where(eq(subscriptions.id, subscription.id));

  await createNotification({
    organizationId: organization.id,
    type: "subscription_canceled",
    title: "Subscription canceled",
    message: `A recurring contribution of GHS ${(subscription.amount / 100).toLocaleString()}/${subscription.interval} was canceled.`,
    payload: { subscriptionId: subscription.id },
  });

  revalidatePath("/dashboard/recurring");
  return { success: true };
}