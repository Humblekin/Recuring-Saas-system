"use server";

import { db } from "@/lib/db";
import { payments, subscriptions, supporters, paymentLinks } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireOrgContext } from "@/lib/auth/org";

// =============================================================================
// REPORTS — summaries + CSV export for the org's finance lead
// =============================================================================

export type ReportRange = "30d" | "90d" | "1y" | "all";

function rangeStart(range: ReportRange): Date | null {
  if (range === "all") return null;
  const days = range === "30d" ? 30 : range === "90d" ? 90 : 365;
  return new Date(Date.now() - days * 86400000);
}

export async function getReportSummary(range: ReportRange = "30d") {
  const { organization } = await requireOrgContext();

  const start = rangeStart(range);
  const where = start
    ? and(
        eq(payments.organizationId, organization.id),
        eq(payments.status, "success"),
        sql`${payments.createdAt} >= ${start}`
      )
    : and(eq(payments.organizationId, organization.id), eq(payments.status, "success"));

  const totals = await db
    .select({ total: sql<number>`coalesce(sum(${payments.amount}), 0)` })
    .from(payments)
    .where(where);
  const totalCollected = totals[0]?.total || 0;

  const oneTime = await db
    .select({ total: sql<number>`coalesce(sum(${payments.amount}), 0)` })
    .from(payments)
    .where(
      and(where, eq(payments.isRecurring, false))
    );
  const oneTimeCollected = oneTime[0]?.total || 0;

  const recurring = await db
    .select({ total: sql<number>`coalesce(sum(${payments.amount}), 0)` })
    .from(payments)
    .where(and(where, eq(payments.isRecurring, true)));
  const recurringCollected = recurring[0]?.total || 0;

  const contributorCount = await db
    .select({ count: sql<number>`count(distinct ${payments.supporterId})` })
    .from(payments)
    .where(where);
  const contributors = contributorCount[0]?.count || 0;

  // By payment link (named) so the finance lead can see what performed.
  const byLink = await db
    .select({
      name: sql<string>`coalesce(${paymentLinks.name}, 'General')`,
      total: sql<number>`coalesce(sum(${payments.amount}), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(payments)
    .leftJoin(paymentLinks, eq(payments.paymentLinkId, paymentLinks.id))
    .where(where)
    .groupBy(payments.paymentLinkId, paymentLinks.name)
    .orderBy(sql`coalesce(sum(${payments.amount}), 0) desc`);

  return {
    totalCollected,
    oneTimeCollected,
    recurringCollected,
    contributors,
    byLink,
  };
}

export async function exportReportCsv(range: ReportRange = "all") {
  const { organization } = await requireOrgContext();

  const start = rangeStart(range);
  const where = start
    ? and(
        eq(payments.organizationId, organization.id),
        sql`${payments.createdAt} >= ${start}`
      )
    : eq(payments.organizationId, organization.id);

  const rows = await db
    .select({
      reference: payments.reference,
      amount: payments.amount,
      currency: payments.currency,
      status: payments.status,
      isRecurring: payments.isRecurring,
      paymentMethod: payments.paymentMethod,
      createdAt: payments.createdAt,
      supporterEmail: supporters.email,
      supporterName: supporters.name,
    })
    .from(payments)
    .leftJoin(supporters, eq(payments.supporterId, supporters.id))
    .where(where)
    .orderBy(sql`${payments.createdAt} desc`);

  const csv = [
    "Reference,Date,Amount (minor),Currency,Status,Type,Channel,Supporter",
    ...rows.map((r) => {
      const csvSafe = (v: string | null | undefined) => {
        let s = v || "";
        if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
        return `"${s.replace(/"/g, '""')}"`;
      };
      return [
        csvSafe(r.reference),
        r.createdAt ? new Date(r.createdAt).toISOString() : "",
        r.amount,
        csvSafe(r.currency || "GHS"),
        r.status,
        r.isRecurring ? "recurring" : "one-time",
        csvSafe(r.paymentMethod),
        csvSafe(r.supporterName || r.supporterEmail),
      ].join(",");
    }),
  ].join("\n");

  return {
    fileName: `kivaro-report-${organization.slug}-${Date.now()}.csv`,
    csv,
  };
}

/** Active subscriptions summary row for reports. */
export async function getSubscriptionReport() {
  const { organization } = await requireOrgContext();
  const res = await db
    .select({
      count: sql<number>`count(*)`,
      expectedMonthly: sql<number>`coalesce(sum(case when ${subscriptions.interval} = 'monthly' then ${subscriptions.amount} end), 0)`,
    })
    .from(subscriptions)
    .where(
      and(eq(subscriptions.organizationId, organization.id), eq(subscriptions.status, "active"))
    );
  return res[0] || { count: 0, expectedMonthly: 0 };
}