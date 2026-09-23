"use server";

import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
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

export async function countNotificationsFor(organizationId: string) {
  return db.query.notifications.findMany({
    where: eq(notifications.organizationId, organizationId),
    columns: { id: true },
  });
}