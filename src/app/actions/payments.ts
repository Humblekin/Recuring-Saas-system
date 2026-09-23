"use server";

import { db } from "@/lib/db";
import { payments, subscriptions } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireOrgContext } from "@/lib/auth/org";

// =============================================================================
// PAYMENTS & DASHBOARD QUERIES
// =============================================================================
// All queries resolve the org from the caller's session (authz boundary).
// Amounts stored in pesewas; convert to major units for display.
// =============================================================================

export async function getOverviewData() {
  const { organization } = await requireOrgContext();

  const oneTime = await db
    .select({ total: sql<number>`coalesce(sum(${payments.amount}), 0)` })
    .from(payments)
    .where(and(eq(payments.organizationId, organization.id), eq(payments.status, "success")));

  const totalCollected = oneTime[0]?.total || 0;

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthResult = await db
    .select({ total: sql<number>`coalesce(sum(${payments.amount}), 0)` })
    .from(payments)
    .where(
      and(
        eq(payments.organizationId, organization.id),
        eq(payments.status, "success"),
        sql`${payments.createdAt} >= ${startOfMonth}`
      )
    );
  const thisMonthCollected = monthResult[0]?.total || 0;

  const activeSubs = await db
    .select({ count: sql<number>`count(*)` })
    .from(subscriptions)
    .where(
      and(eq(subscriptions.organizationId, organization.id), eq(subscriptions.status, "active"))
    );
  const activeSubscribers = activeSubs[0]?.count || 0;

  const supporterCount = await db
    .select({ count: sql<number>`count(distinct ${payments.supporterId})` })
    .from(payments)
    .where(and(eq(payments.organizationId, organization.id), eq(payments.status, "success")));
  const supporters = supporterCount[0]?.count || 0;

  // Last 6 months of successful collections for the overview chart.
  const seriesResult = await db
    .select({
      month: sql<string>`to_char(${payments.createdAt}, 'YYYY-MM')`,
      total: sql<number>`coalesce(sum(${payments.amount}), 0)`,
    })
    .from(payments)
    .where(
      and(
        eq(payments.organizationId, organization.id),
        eq(payments.status, "success"),
        sql`${payments.createdAt} >= ${new Date(
          new Date().getFullYear(),
          new Date().getMonth() - 5,
          1
        )}`
      )
    )
    .groupBy(sql`to_char(${payments.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${payments.createdAt}, 'YYYY-MM')`);

  // Fill gaps so the chart always renders 6 points.
  const labels: string[] = [];
  const values: number[] = [];
  const byMonth = new Map(seriesResult.map((r) => [r.month, r.total]));
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    labels.push(key);
    values.push((byMonth.get(key) || 0) / 100);
  }

  const recentContributions = await db.query.payments.findMany({
    where: eq(payments.organizationId, organization.id),
    orderBy: (payments, { desc }) => [desc(payments.createdAt)],
    limit: 6,
    with: { supporter: true, campaign: true, paymentLink: true, subscription: true },
  });

  return {
    totalCollected,
    thisMonthCollected,
    activeSubscribers,
    supporters,
    chart: { labels, values },
    recentContributions,
  };
}

export async function getContributions() {
  const { organization } = await requireOrgContext();

  const list = await db.query.payments.findMany({
    where: eq(payments.organizationId, organization.id),
    orderBy: (payments, { desc }) => [desc(payments.createdAt)],
    with: { supporter: true, campaign: true, paymentLink: true, subscription: true },
  });

  const summary = await db
    .select({
      status: payments.status,
      count: sql<number>`count(*)`,
      total: sql<number>`coalesce(sum(${payments.amount}), 0)`,
    })
    .from(payments)
    .where(eq(payments.organizationId, organization.id))
    .groupBy(payments.status);

  return { list, summary };
}

export async function getRecurringSubscriptions() {
  const { organization } = await requireOrgContext();

  const subscriptionsList = await db.query.subscriptions.findMany({
    where: eq(subscriptions.organizationId, organization.id),
    orderBy: (subscriptions, { desc }) => [desc(subscriptions.createdAt)],
    with: { supporter: true, paymentLink: true, campaign: true },
  });

  return subscriptionsList;
}