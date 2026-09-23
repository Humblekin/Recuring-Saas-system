import { GiveForm } from "@/components/give/GiveForm";
import { LogoMark } from "@/components/ui/icons";
import Link from "next/link";

type OrgShape = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  country: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  primaryColor: string | null;
};

type LinkShape = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  amounts: number[];
  oneTimeEnabled: boolean;
  recurringEnabled: boolean;
  frequencies: string[];
};

export function GiveShell({
  org,
  links,
  defaultLinkId,
  campaignSlug,
  context,
}: {
  org: OrgShape;
  links: LinkShape[];
  defaultLinkId?: string;
  campaignSlug?: string;
  context?: { title: string; subtitle?: string; badge?: string };
}) {
  const accent = org.primaryColor || "#1A1A1A";
  const title = context?.title || `Support ${org.name}`;
  const subtitle =
    context?.subtitle ||
    org.description ||
    "Every contribution helps us continue our work.";

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="h-16 border-b border-border bg-surface flex items-center px-6 shrink-0">
        <Link href="/" className="flex items-center gap-2 text-ink no-underline">
          <div className="w-7 h-7 bg-ink rounded-md flex items-center justify-center text-cream">
            <LogoMark size={14} />
          </div>
          <span className="text-lg tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Cowrie
          </span>
        </Link>
      </header>

      <main className="flex-1 flex items-start justify-center p-6">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-cream text-xl font-semibold mb-6"
              style={{ backgroundColor: accent }}
            >
              {org.name.charAt(0).toUpperCase()}
            </div>
            {context?.badge && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-terracotta/10 text-terracotta mb-4">
                {context.badge}
              </span>
            )}
            <h1
              className="text-3xl md:text-4xl font-medium leading-tight mb-4 text-ink"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {title}
            </h1>
            <p className="text-ink-muted leading-relaxed mb-6">{subtitle}</p>
            {(org.country || org.website || org.phone || org.email) && (
              <div className="flex flex-col gap-1.5 text-sm text-ink-muted">
                {org.country && <span>{org.country}</span>}
                {org.website && (
                  <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-terracotta hover:underline break-all">
                    {org.website}
                  </a>
                )}
                {org.phone && <span>{org.phone}</span>}
                {org.email && <span>{org.email}</span>}
              </div>
            )}
          </div>

          <div className="bg-cream border border-border rounded-3xl p-6 sm:p-8 shadow-sm">
            {links.length === 0 ? (
              <div className="text-center text-sm text-ink-muted py-10">
                This page is not accepting payments right now.
              </div>
            ) : (
              <GiveForm
                orgSlug={org.slug}
                links={links}
                campaignSlug={campaignSlug}
                defaultLinkId={defaultLinkId}
                accentColor={accent}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}