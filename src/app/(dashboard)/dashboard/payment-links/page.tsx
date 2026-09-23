import { getPaymentLinks } from "@/app/actions/payment-links";
import { getUserOrganizationSlug } from "@/lib/auth/org";
import { PaymentLinksClient } from "@/components/payment-links/PaymentLinksClient";

export const metadata = { title: "Payment links — Cowrie" };

export default async function PaymentLinksPage() {
  const [links, orgSlug] = await Promise.all([getPaymentLinks(), getUserOrganizationSlug()]);
  const publicBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-medium" style={{ fontFamily: "var(--font-display)" }}>
            Payment links
          </h2>
          <p className="text-ink-muted mt-1">
            Create and share a link — supporters give in two taps.
          </p>
        </div>
        <a href="/dashboard/payment-links/new" className="btn-primary">
          Create Payment Link
        </a>
      </div>

      <PaymentLinksClient
        links={links.map((l) => ({
          id: l.id,
          name: l.name,
          slug: l.slug,
          description: l.description,
          amounts: l.amounts ?? [],
          oneTimeEnabled: Boolean(l.oneTimeEnabled),
          recurringEnabled: Boolean(l.recurringEnabled),
          frequencies: l.frequencies ?? [],
          isActive: Boolean(l.isActive),
          createdAt: l.createdAt,
        }))}
        publicBaseUrl={publicBaseUrl}
        orgSlug={orgSlug}
      />
    </div>
  );
}