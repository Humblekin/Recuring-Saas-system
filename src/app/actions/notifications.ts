"use server";

import { requireOrgContext } from "@/lib/auth/org";
import {
  getUnreadCount,
  listNotifications,
  markNotificationsRead,
  deleteNotification,
  clearNotifications,
} from "@/lib/notifications";

// =============================================================================
// NOTIFICATIONS ACTIONS (called by the dashboard notifications bell)
// =============================================================================

export async function getUnreadNotificationCount() {
  const { organization } = await requireOrgContext();
  return getUnreadCount(organization.id);
}

export async function getNotificationsFeed() {
  const { organization } = await requireOrgContext();
  return listNotifications(organization.id);
}

export async function markAllNotificationsRead() {
  const { organization } = await requireOrgContext();
  await markNotificationsRead(organization.id);
  return { success: true };
}

/** Dismiss a single notification from the feed. */
export async function dismissNotification(id: string) {
  const { organization } = await requireOrgContext();
  // organizationId is part of the delete predicate, so a cross-tenant id
  // silently matches nothing instead of deleting another org's row.
  await deleteNotification(id, organization.id);
  return { success: true };
}

/** Empty the feed. Notifications are transient alerts, not a ledger, so this
 *  is a hard delete scoped to the caller's organization. */
export async function clearAllNotifications() {
  const { organization } = await requireOrgContext();
  await clearNotifications(organization.id);
  return { success: true };
}
