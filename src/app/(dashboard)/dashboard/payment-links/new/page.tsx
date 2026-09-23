import { getUserOrganizationSlug } from "@/lib/auth/org";
import { NewPaymentLinkForm } from "@/components/payment-links/NewPaymentLinkForm";

export const metadata = { title: "Create payment link — Cowrie" };

export default async function NewPaymentLinkPage() {
  const orgSlug = await getUserOrganizationSlug();
  const publicBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return <NewPaymentLinkForm orgSlug={orgSlug} publicBaseUrl={publicBaseUrl} />;
}