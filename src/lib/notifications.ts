import { db } from "@/lib/db";
import { notifications, organizations, users } from "@/lib/db/schema";
import { eq, and, isNull, desc, sql } from "drizzle-orm";

// =============================================================================
// IN-APP NOTIFICATIONS
// =============================================================================
// Minimal, DB-backed notification layer for organizations (paid/failed payments,
// recurring events). Supporter confirmations are handled by the public receipt
// page. No external email infrastructure in the MVP.

export type NotificationInput = {
  organizationId: string;
  type:
    | "payment_success"
    | "payment_failed"
    | "subscription_active"
    | "subscription_failed"
    | "subscription_canceled";
  title: string;
  message: string;
  payload?: Record<string, unknown>;
};

export async function createNotification(input: NotificationInput): Promise<void> {
  await db
    .insert(notifications)
    .values({
      organizationId: input.organizationId,
      type: input.type,
      title: input.title,
      message: input.message,
      payload: input.payload || {},
    })
    .onConflictDoNothing();
}

export async function getUnreadCount(organizationId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.organizationId, organizationId), isNull(notifications.readAt)));
  return result[0]?.count || 0;
}

export async function listNotifications(organizationId: string, limit = 12) {
  return db.query.notifications.findMany({
    where: eq(notifications.organizationId, organizationId),
    orderBy: [desc(notifications.createdAt)],
    limit,
  });
}

export async function markNotificationsRead(organizationId: string): Promise<void> {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.organizationId, organizationId), isNull(notifications.readAt)));
}

/** Resolve the organization id that owns a supporter's email/phone when needed. */
export async function orgIdForUser(userId: string): Promise<string | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.neonAuthId, userId),
    columns: { organizationId: true },
  });
  return user?.organizationId ?? null;
}

export async function orgById(id: string) {
  return db.query.organizations.findFirst({ where: eq(organizations.id, id) });
}