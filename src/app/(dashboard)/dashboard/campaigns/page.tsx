import { getCampaigns } from "@/app/actions/campaigns";
import { getUserOrganizationSlug } from "@/lib/auth/org";
import { CampaignsClient } from "@/components/campaigns/CampaignsClient";

export const metadata = { title: "Campaigns — Kivaro" };

export default async function CampaignsPage() {
  const [campaigns, orgSlug] = await Promise.all([getCampaigns(), getUserOrganizationSlug()]);
  const publicBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-medium" style={{ fontFamily: "var(--font-display)" }}>
            Campaigns
          </h2>
          <p className="text-ink-muted mt-1">Fundraise toward a specific goal with a public page.</p>
        </div>
        <a href="/dashboard/campaigns/new" className="btn-primary">Start a campaign</a>
      </div>

      <CampaignsClient
        campaigns={campaigns.map((c) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          slug: c.slug,
          currency: c.currency,
          goalAmount: c.goalAmount,
          raised: c.raised,
          contributorCount: c.contributorCount,
          isActive: Boolean(c.isActive),
          createdAt: c.createdAt,
        }))}
        publicBaseUrl={publicBaseUrl}
        orgSlug={orgSlug}
      />
    </div>
  );
}