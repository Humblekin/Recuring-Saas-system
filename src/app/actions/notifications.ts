"use server";

import { requireOrgContext } from "@/lib/auth/org";
import { getUnreadCount, listNotifications, markNotificationsRead } from "@/lib/notifications";

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