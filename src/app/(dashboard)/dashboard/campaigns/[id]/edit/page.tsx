import { getCampaign } from "@/app/actions/campaigns";
import { getUserOrganizationSlug } from "@/lib/auth/org";
import { EditCampaignForm } from "@/components/campaigns/EditCampaignForm";
import { notFound } from "next/navigation";

export const metadata = { title: "Edit campaign — Kivaro" };

/** Date-only input value (yyyy-mm-dd) using UTC parts, matching how
 *  updateCampaign parses the string back with `new Date(value)`. */
function toDateInput(value: Date | null): string {
  if (!value) return "";
  const y = value.getUTCFullYear();
  const m = String(value.getUTCMonth() + 1).padStart(2, "0");
  const d = String(value.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orgSlug = await getUserOrganizationSlug();

  // getCampaign throws when the id is missing or owned by another org; both
  // are indistinguishable to the caller, so render a 404 rather than a 500.
  // Auth/org errors are rethrown so the dashboard guard reports them properly.
  const campaign = await getCampaign(id).catch((err: unknown) => {
    if (err instanceof Error && err.message === "Campaign not found.") return null;
    throw err;
  });

  if (!campaign) notFound();

  const publicBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <EditCampaignForm
      campaignId={campaign.id}
      initial={{
        title: campaign.title,
        description: campaign.description,
        goalAmount: campaign.goalAmount,
        startDate: toDateInput(campaign.startDate),
        endDate: toDateInput(campaign.endDate),
      }}
      publicUrl={`${publicBaseUrl}/give/${orgSlug}/${campaign.slug}`}
    />
  );
}
