import { getPaymentLink } from "@/app/actions/payment-links";
import { getUserOrganizationSlug } from "@/lib/auth/org";
import { EditPaymentLinkForm } from "@/components/payment-links/EditPaymentLinkForm";
import { notFound } from "next/navigation";

export const metadata = { title: "Edit payment link — Kivaro" };

export default async function EditPaymentLinkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [link, orgSlug] = await Promise.all([getPaymentLink(id), getUserOrganizationSlug()]);

  // getPaymentLink is already scoped to the caller's organization, so a
  // cross-tenant id is indistinguishable from a missing one.
  if (!link) notFound();

  const publicBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <EditPaymentLinkForm
      linkId={link.id}
      initial={{
        name: link.name,
        description: link.description,
        amounts: link.amounts ?? [],
        oneTimeEnabled: Boolean(link.oneTimeEnabled),
        recurringEnabled: Boolean(link.recurringEnabled),
        frequencies: link.frequencies ?? [],
      }}
      publicUrl={`${publicBaseUrl}/give/${orgSlug}/link/${link.slug}`}
    />
  );
}
