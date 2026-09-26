"use server";

import { db } from "@/lib/db";
import { campaigns, payments, paymentLinks, organizations } from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { requireOrgContext } from "@/lib/auth/org";
import { revalidatePath } from "next/cache";
import { cleanMultiline, cleanText, MAX_TITLE } from "@/lib/security/sanitize";

// =============================================================================
// CAMPAIGNS
// =============================================================================
// A campaign is a fundraising appeal. Creating one auto-creates a payment link
// (scoped to the campaign URL) so supporters can give directly to it.
// =============================================================================

function makeSlug(title: string, suffix = ""): string {
  const base =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 45) || "campaign";
  return `${base}${suffix}`;
}

/**
 * Ensure the generated slug is unique within the organization — campaigns and
 * payment links share one URL namespace (`/give/<org>/<slug>`), so a collision
 * in either table must be avoided. Appends a numeric suffix when needed.
 */
async function uniqueSlug(base: string, organizationId: string): Promise<string> {
  let candidate = base;
  let n = 2;
  for (;;) {
    const [linkHit, campaignHit] = await Promise.all([
      db.query.paymentLinks.findFirst({
        where: and(eq(paymentLinks.organizationId, organizationId), eq(paymentLinks.slug, candidate)),
        columns: { id: true },
      }),
      db.query.campaigns.findFirst({
        where: and(eq(campaigns.organizationId, organizationId), eq(campaigns.slug, candidate)),
        columns: { id: true },
      }),
    ]);
    if (!linkHit && !campaignHit) return candidate;
    candidate = `${base}-${n++}`;
  }
}

export async function getCampaigns() {
  const { organization } = await requireOrgContext();

  const campaignList = await db.query.campaigns.findMany({
    where: eq(campaigns.organizationId, organization.id),
    orderBy: [desc(campaigns.createdAt)],
    with: { paymentLink: true },
  });

  // Attach raised totals per campaign.
  const totals = await db
    .select({
      campaignId: payments.campaignId,
      total: sql<number>`coalesce(sum(${payments.amount}), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(payments)
    .where(
      and(
        eq(payments.organizationId, organization.id),
        eq(payments.status, "success"),
        sql`${payments.campaignId} is not null`
      )
    )
    .groupBy(payments.campaignId);

  const byCampaign = new Map(totals.map((t) => [t.campaignId, t]));

  return campaignList.map((c) => ({
    ...c,
    raised: byCampaign.get(c.id)?.total || 0,
    contributorCount: byCampaign.get(c.id)?.count || 0,
  }));
}

export async function getCampaign(id: string) {
  const { organization } = await requireOrgContext();
  const campaign = await db.query.campaigns.findFirst({
    where: and(eq(campaigns.id, id), eq(campaigns.organizationId, organization.id)),
    with: { paymentLink: true },
  });
  if (!campaign) throw new Error("Campaign not found.");
  return campaign;
}

export async function createCampaign(data: {
  title: string;
  description: string;
  goalAmount: number; // GHS major units
  startDate?: string;
  endDate?: string;
  amounts?: number[]; // GHS major units
  recurringEnabled?: boolean;
  frequencies?: string[];
}) {
  const { organization } = await requireOrgContext();

  const title = cleanText(data.title, MAX_TITLE);
  if (!title) throw new Error("Campaign title is required.");
  const description = data.description
    ? cleanMultiline(data.description) || null
    : null;

  const goalAmount = Math.round(Number(data.goalAmount || 0) * 100);
  const amounts = (data.amounts || [10, 20, 50, 100])
    .map((a) => Math.round(Number(a) * 100))
    .filter((a) => Number.isFinite(a) && a > 0);

  const frequencies = (data.frequencies || ["weekly", "monthly", "yearly"]).filter((f) =>
    ["weekly", "monthly", "yearly"].includes(f)
  );

  const startDate = data.startDate ? new Date(data.startDate) : null;
  const endDate = data.endDate ? new Date(data.endDate) : null;

  // 1. Create the scoped payment link for this campaign (slug must be unique).
  // uniqueSlug() is check-then-insert, so two concurrent creates can still pick
  // the same slug. The unique index on (organization_id, slug) turns that race
  // into a 23505 rather than a duplicate public URL, so resolve it by moving to
  // the next candidate instead of surfacing a raw constraint error.
  const linkBase = makeSlug(title, "-campaign");
  let link: { id: string } | undefined;
  for (let attempt = 0; attempt < 5 && !link; attempt++) {
    try {
      const inserted = await db
        .insert(paymentLinks)
        .values({
          organizationId: organization.id,
          name: title,
          slug: await uniqueSlug(linkBase, organization.id),
          description,
          amounts,
          oneTimeEnabled: true,
          recurringEnabled: Boolean(data.recurringEnabled),
          frequencies,
          isActive: true,
        })
        .returning({ id: paymentLinks.id });
      link = inserted[0];
    } catch (err) {
      if ((err as { code?: string })?.code !== "23505") throw err;
    }
  }
  if (!link) throw new Error("Could not allocate a unique payment link. Please try again.");

  // 2. Create the campaign record pointing at the link.
  const campaignSlug = await uniqueSlug(makeSlug(title), organization.id);
  const campaign = await db
    .insert(campaigns)
    .values({
      organizationId: organization.id,
      paymentLinkId: link.id,
      title,
      slug: campaignSlug,
      description,
      goalAmount: goalAmount > 0 ? goalAmount : null,
      startDate,
      endDate,
      isActive: true,
    })
    .returning();

  revalidatePath("/dashboard/campaigns");
  return campaign[0];
}

export async function updateCampaign(
  id: string,
  data: {
    title: string;
    description: string;
    goalAmount: number;
    isActive?: boolean;
    startDate?: string;
    endDate?: string;
  }
) {
  const { organization } = await requireOrgContext();

  const existing = await db.query.campaigns.findFirst({
    where: and(eq(campaigns.id, id), eq(campaigns.organizationId, organization.id)),
  });
  if (!existing) throw new Error("Campaign not found.");

  const title = cleanText(data.title, MAX_TITLE);
  if (!title) throw new Error("Campaign title is required.");
  const goalAmount = Math.round(Number(data.goalAmount || 0) * 100);

  await db
    .update(campaigns)
    .set({
      title,
      description: data.description ? cleanMultiline(data.description) || null : null,
      goalAmount: goalAmount > 0 ? goalAmount : null,
      isActive: data.isActive ?? existing.isActive,
      startDate: data.startDate ? new Date(data.startDate) : existing.startDate,
      endDate: data.endDate ? new Date(data.endDate) : existing.endDate,
    })
    .where(eq(campaigns.id, id));

  if (existing.paymentLinkId) {
    await db
      .update(paymentLinks)
      .set({ name: title, isActive: data.isActive ?? existing.isActive })
      .where(eq(paymentLinks.id, existing.paymentLinkId));
  }

  revalidatePath("/dashboard/campaigns");
  return { success: true };
}

export async function toggleCampaign(id: string) {
  const { organization } = await requireOrgContext();
  const existing = await db.query.campaigns.findFirst({
    where: and(eq(campaigns.id, id), eq(campaigns.organizationId, organization.id)),
  });
  if (!existing) throw new Error("Campaign not found.");

  await db
    .update(campaigns)
    .set({ isActive: !existing.isActive })
    .where(eq(campaigns.id, id));

  if (existing.paymentLinkId) {
    await db
      .update(paymentLinks)
      .set({ isActive: !existing.isActive })
      .where(eq(paymentLinks.id, existing.paymentLinkId));
  }

  revalidatePath("/dashboard/campaigns");
  return { success: true, isActive: !existing.isActive };
}

export async function deleteCampaign(id: string) {
  const { organization } = await requireOrgContext();
  const existing = await db.query.campaigns.findFirst({
    where: and(eq(campaigns.id, id), eq(campaigns.organizationId, organization.id)),
  });
  if (!existing) throw new Error("Campaign not found.");

  // Payments keep their campaign attribution; the payment link is removed.
  if (existing.paymentLinkId) {
    await db.delete(paymentLinks).where(eq(paymentLinks.id, existing.paymentLinkId));
  }
  await db.delete(campaigns).where(eq(campaigns.id, id));

  revalidatePath("/dashboard/campaigns");
  return { success: true };
}

/** Public lookup used by /give/[slug]/[campaignSlug]. */
export async function getPublicCampaign(orgSlug: string, campaignSlug: string) {
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, orgSlug),
  });
  if (!org) return null;

  const campaign = await db.query.campaigns.findFirst({
    where: and(
      eq(campaigns.organizationId, org.id),
      eq(campaigns.slug, campaignSlug)
    ),
    with: { paymentLink: true },
  });
  if (!campaign) return null;

  const raisedResult = await db
    .select({ total: sql<number>`coalesce(sum(${payments.amount}), 0)` })
    .from(payments)
    .where(
      and(eq(payments.campaignId, campaign.id), eq(payments.status, "success"))
    );

  return {
    campaign,
    org,
    raised: raisedResult[0]?.total || 0,
  };
}