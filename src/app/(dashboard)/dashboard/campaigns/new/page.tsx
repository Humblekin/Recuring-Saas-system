import { getUserOrganizationSlug } from "@/lib/auth/org";
import { NewCampaignForm } from "@/components/campaigns/NewCampaignForm";

export const metadata = { title: "Start a campaign — Cowrie" };

export default async function NewCampaignPage() {
  const orgSlug = await getUserOrganizationSlug();
  const publicBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return <NewCampaignForm orgSlug={orgSlug} publicBaseUrl={publicBaseUrl} />;
}