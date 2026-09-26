"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleCampaign, deleteCampaign } from "@/app/actions/campaigns";
import { ShareModal } from "@/components/share/ShareModal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ShareIcon, PauseIcon, TrashIcon, CheckIcon, EditIcon } from "@/components/ui/icons";
import { formatCurrencyFromMinor, errorMessage } from "@/lib/utils";

type CampaignRow = {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  currency: string | null;
  goalAmount: number | null;
  raised: number;
  contributorCount: number;
  isActive: boolean;
  createdAt: string | Date;
};

export function CampaignsClient({
  campaigns,
  publicBaseUrl,
  orgSlug,
}: {
  campaigns: CampaignRow[];
  publicBaseUrl: string;
  orgSlug: string;
}) {
  const router = useRouter();
  const [shareFor, setShareFor] = useState<CampaignRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const urlFor = (slug: string) => `${publicBaseUrl}/give/${orgSlug}/${slug}`;

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
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
      )}

      {campaigns.length === 0 ? (
        <div className="bg-surface border border-border p-12 rounded-2xl text-center">
          <h3 className="text-lg font-medium mb-2">No campaigns yet</h3>
          <p className="text-ink-muted mb-6">Launch your first campaign to rally supporters around a goal.</p>
          <a href="/dashboard/campaigns/new" className="btn-primary">Start a campaign</a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {campaigns.map((campaign) => {
            const progress = campaign.goalAmount
              ? Math.min(100, Math.round((campaign.raised / campaign.goalAmount) * 100))
              : null;
            return (
              <div key={campaign.id} className="bg-surface border border-border p-6 rounded-2xl flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-lg leading-tight">{campaign.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={campaign.isActive ? "active" : "off"} />
                      <span className="text-xs text-ink-muted">
                        {campaign.contributorCount} contributor{campaign.contributorCount === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => setShareFor(campaign)}
                      className="w-8 h-8 rounded-lg border border-border hover:bg-cream transition-colors flex items-center justify-center text-ink"
                      aria-label="Share campaign"
                      title="Share"
                    >
                      <ShareIcon size={15} />
                    </button>
                    <a
                      href={`/dashboard/campaigns/${campaign.id}/edit`}
                      className="w-8 h-8 rounded-lg border border-border hover:bg-cream transition-colors flex items-center justify-center text-ink"
                      title="Edit"
                      aria-label={`Edit ${campaign.title}`}
                    >
                      <EditIcon size={15} />
                    </a>
                    <button
                      onClick={() => run(campaign.id, () => toggleCampaign(campaign.id))}
                      disabled={busyId === campaign.id}
                      className="w-8 h-8 rounded-lg border border-border hover:bg-cream transition-colors flex items-center justify-center text-ink disabled:opacity-50"
                      title={campaign.isActive ? "Pause" : "Activate"}
                      aria-label="Toggle campaign"
                    >
                      {busyId === campaign.id ? (
                        <span className="w-3 h-3 border-2 border-ink/30 border-t-ink rounded-full animate-spin" />
                      ) : campaign.isActive ? (
                        <PauseIcon size={15} />
                      ) : (
                        <CheckIcon size={15} />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete "${campaign.title}"?`)) run(campaign.id, () => deleteCampaign(campaign.id));
                      }}
                      disabled={busyId === campaign.id}
                      className="w-8 h-8 rounded-lg border border-border hover:bg-red-50 hover:text-red-600 transition-colors flex items-center justify-center text-ink-muted disabled:opacity-50"
                      title="Delete"
                      aria-label="Delete campaign"
                    >
                      <TrashIcon size={15} />
                    </button>
                  </div>
                </div>

                {campaign.description && (
                  <p className="text-sm text-ink-muted line-clamp-2">{campaign.description}</p>
                )}

                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-medium">
                      {formatCurrencyFromMinor(campaign.raised, campaign.currency || "GHS")}
                    </span>
                    {campaign.goalAmount && (
                      <span className="text-ink-muted">
                        of {formatCurrencyFromMinor(campaign.goalAmount, campaign.currency || "GHS")} · {progress}%
                      </span>
                    )}
                  </div>
                  <div className="h-2 bg-cream border border-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-ink rounded-full transition-all"
                      style={{ width: `${progress ?? 0}%` }}
                    />
                  </div>
                </div>

                <a
                  href={urlFor(campaign.slug)}
                  target="_blank"
                  className="text-terracotta text-sm font-medium hover:underline"
                >
                  View public page →
                </a>
              </div>
            );
          })}
        </div>
      )}

      {shareFor && (
        <ShareModal
          url={urlFor(shareFor.slug)}
          title={shareFor.title}
          onClose={() => setShareFor(null)}
        />
      )}
    </div>
  );
}