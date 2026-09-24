import { db } from "@/lib/db";
import { organizations, campaigns, payments, paymentLinks } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { GiveShell } from "@/components/give/GiveShell";
import { formatCurrencyFromMinor } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgSlug: string; campaignSlug: string }>;
}) {
  const { orgSlug, campaignSlug } = await params;
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, orgSlug),
    columns: { id: true, name: true },
  });
  const campaign = org
    ? await db.query.campaigns.findFirst({
        where: and(eq(campaigns.organizationId, org.id), eq(campaigns.slug, campaignSlug)),
        columns: { id: true, title: true, description: true },
      })
    : null;
  if (!org || !campaign) return { title: "Not found — Kivaro" };
  return {
    title: `${campaign.title} — ${org.name}`,
    description: campaign.description || `Support ${campaign.title}.`,
  };
}

export default async function GiveCampaignPage({
  params,
}: {
  params: Promise<{ orgSlug: string; campaignSlug: string }>;
}) {
  const { orgSlug, campaignSlug } = await params;

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, orgSlug),
  });
  if (!org) notFound();

  const campaign = await db.query.campaigns.findFirst({
    where: and(
      eq(campaigns.organizationId, org.id),
      eq(campaigns.slug, campaignSlug),
      eq(campaigns.isActive, true)
    ),
  });
  if (!campaign) notFound();

  // Campaign-scoped payment link (auto-created with the campaign).
  const campaignLink = campaign.paymentLinkId
    ? await db.query.paymentLinks.findFirst({
        where: and(eq(paymentLinks.id, campaign.paymentLinkId), eq(paymentLinks.isActive, true)),
      })
    : null;

  const links = await db.query.paymentLinks.findMany({
    where: and(
      eq(paymentLinks.organizationId, org.id),
      eq(paymentLinks.isActive, true)
    ),
    orderBy: (links, { asc }) => [asc(links.createdAt)],
  });

  const raisedResult = await db
    .select({ total: sql<number>`coalesce(sum(${payments.amount}), 0)` })
    .from(payments)
    .where(and(eq(payments.campaignId, campaign.id), eq(payments.status, "success")));
  const raised = raisedResult[0]?.total || 0;

  const subtitle = campaign.description || org.description || "";
  const progressNote =
    campaign.goalAmount
      ? `${formatCurrencyFromMinor(raised, campaign.currency || "GHS")} of ${formatCurrencyFromMinor(
          campaign.goalAmount,
          campaign.currency || "GHS"
        )} raised`
      : `${formatCurrencyFromMinor(raised, campaign.currency || "GHS")} raised so far`;

  return (
    <GiveShell
      org={org}
      links={links.map((l) => ({
        id: l.id,
        name: l.name,
        slug: l.slug,
        description: l.description,
        amounts: l.amounts ?? [],
        oneTimeEnabled: Boolean(l.oneTimeEnabled),
        recurringEnabled: Boolean(l.recurringEnabled),
        frequencies: l.frequencies ?? [],
      }))}
      defaultLinkId={campaignLink?.id || campaign.paymentLinkId || links[0]?.id}
      campaignSlug={campaign.slug}
      context={{
        title: campaign.title,
        subtitle,
        badge: progressNote,
      }}
    />
  );
}