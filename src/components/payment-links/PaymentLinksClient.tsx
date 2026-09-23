"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { togglePaymentLink, deletePaymentLink } from "@/app/actions/payment-links";
import { ShareModal } from "@/components/share/ShareModal";
import { CopyButton } from "@/components/ui/CopyButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ShareIcon, PauseIcon, TrashIcon, CheckIcon } from "@/components/ui/icons";
import { formatCurrencyFromMinor, errorMessage } from "@/lib/utils";

type LinkRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  amounts: number[];
  oneTimeEnabled: boolean;
  recurringEnabled: boolean;
  frequencies: string[];
  isActive: boolean;
  createdAt: string | Date;
};

export function PaymentLinksClient({
  links,
  publicBaseUrl,
  orgSlug,
}: {
  links: LinkRow[];
  publicBaseUrl: string;
  orgSlug: string;
}) {
  const router = useRouter();
  const [shareFor, setShareFor] = useState<LinkRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const urlFor = (slug: string) => `${publicBaseUrl}/give/${orgSlug}/link/${slug}`;

  async function run(id: string, action: () => Promise<unknown>) {
    setBusyId(id);
    setError("");
    try {
      await action();
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {links.length === 0 ? (
        <div className="bg-surface border border-border p-12 rounded-2xl text-center">
          <h3 className="text-lg font-medium mb-2">No payment links yet</h3>
          <p className="text-ink-muted mb-6">
            Create a link, share it anywhere, and supporters can give in two taps.
          </p>
          <a href="/dashboard/payment-links/new" className="btn-primary">
            Create payment link
          </a>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {links.map((link) => (
            <div key={link.id} className="bg-surface border border-border p-5 sm:p-6 rounded-2xl">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-lg leading-tight">{link.name}</h3>
                    <StatusBadge status={link.isActive ? "active" : "off"} />
                  </div>
                  {link.description && (
                    <p className="text-sm text-ink-muted mt-1 line-clamp-2">{link.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setShareFor(link)}
                    className="w-9 h-9 rounded-xl border border-border hover:bg-cream transition-colors flex items-center justify-center text-ink"
                    aria-label={`Share ${link.name}`}
                    title="Share"
                  >
                    <ShareIcon size={16} />
                  </button>
                  <button
                    onClick={() => run(link.id, () => togglePaymentLink(link.id))}
                    disabled={busyId === link.id}
                    className="w-9 h-9 rounded-xl border border-border hover:bg-cream transition-colors flex items-center justify-center text-ink disabled:opacity-50"
                    aria-label={link.isActive ? "Pause link" : "Activate link"}
                    title={link.isActive ? "Pause" : "Activate"}
                  >
                    {busyId === link.id ? (
                      <span className="w-3.5 h-3.5 border-2 border-ink/30 border-t-ink rounded-full animate-spin" />
                    ) : link.isActive ? (
                      <PauseIcon size={16} />
                    ) : (
                      <CheckIcon size={16} />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete "${link.name}"? Linked campaigns will stop using it.`)) {
                        run(link.id, () => deletePaymentLink(link.id));
                      }
                    }}
                    disabled={busyId === link.id}
                    className="w-9 h-9 rounded-xl border border-border hover:bg-red-50 hover:text-red-600 transition-colors flex items-center justify-center text-ink-muted disabled:opacity-50"
                    aria-label={`Delete ${link.name}`}
                    title="Delete"
                  >
                    <TrashIcon size={16} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm">
                {link.amounts.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {link.amounts.slice(0, 6).map((a) => (
                      <span key={a} className="px-2.5 py-1 rounded-lg bg-cream border border-border text-ink-muted text-xs font-medium">
                        {formatCurrencyFromMinor(a, "GHS")}
                      </span>
                    ))}
                  </div>
                )}
                <span className="text-xs text-ink-muted">
                  {[
                    link.oneTimeEnabled && "one-time",
                    link.recurringEnabled && `recurring (${link.frequencies.join(", ")})`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-border flex items-center gap-3">
                <code className="text-xs text-ink-muted bg-cream border border-border px-3 py-2 rounded-lg truncate flex-1 min-w-0">
                  {urlFor(link.slug)}
                </code>
                <CopyButton text={urlFor(link.slug)} label="Link" />
              </div>
            </div>
          ))}
        </div>
      )}

      {shareFor && (
        <ShareModal
          url={urlFor(shareFor.slug)}
          title={shareFor.name}
          onClose={() => setShareFor(null)}
        />
      )}
    </div>
  );
}