"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateCampaign } from "@/app/actions/campaigns";
import { errorMessage } from "@/lib/utils";

export function EditCampaignForm({
  campaignId,
  initial,
  publicUrl,
}: {
  campaignId: string;
  initial: {
    title: string;
    description: string | null;
    goalAmount: number | null;
    startDate: string | null;
    endDate: string | null;
  };
  publicUrl: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description ?? "");
  // `goalAmount` is held in pesewas (minor); the action expects GHS majors.
  const [goalAmount, setGoalAmount] = useState(
    initial.goalAmount != null ? String(initial.goalAmount / 100) : ""
  );
  const [startDate, setStartDate] = useState(initial.startDate ?? "");
  const [endDate, setEndDate] = useState(initial.endDate ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setBusy(true);
    try {
      await updateCampaign(campaignId, {
        title,
        description,
        goalAmount: Number(goalAmount) || 0,
        // An empty date field clears the existing value rather than freezing it.
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, "Could not save the campaign."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <a href="/dashboard/campaigns" className="text-sm text-ink-muted hover:text-ink mb-4 inline-block">
          ← Back to campaigns
        </a>
        <h2 className="text-2xl font-medium" style={{ fontFamily: "var(--font-display)" }}>
          Edit campaign
        </h2>
        <p className="text-ink-muted mt-1">
          Extend the goal or the dates without losing any contributions raised so far.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
      )}
      {saved && !error && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
          Saved.
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-surface border border-border p-6 sm:p-8 rounded-2xl flex flex-col gap-6">
        <div>
          <label htmlFor="c-title" className="block text-sm font-medium mb-1.5">Campaign title</label>
          <input id="c-title" type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </div>

        <div>
          <span className="block text-sm font-medium mb-1.5">Public page</span>
          <code className="block w-full p-3 rounded-xl border border-border bg-cream text-xs text-ink-muted truncate">
            {publicUrl}
          </code>
          <p className="text-xs text-ink-muted mt-1.5">
            This address never changes, so your campaign keeps its shared link.
          </p>
        </div>

        <div>
          <label htmlFor="c-desc" className="block text-sm font-medium mb-1.5">Description</label>
          <textarea id="c-desc" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell supporters what you are raising funds for…" className={`${inputClass} resize-none`} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label htmlFor="c-goal" className="block text-sm font-medium mb-1.5">Goal (GHS)</label>
            <input id="c-goal" type="number" min="1" step="1" value={goalAmount} onChange={(e) => setGoalAmount(e.target.value)} placeholder="e.g. 1000" className={inputClass} />
          </div>
          <div>
            <label htmlFor="c-start" className="block text-sm font-medium mb-1.5">Start date</label>
            <input id="c-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="c-end" className="block text-sm font-medium mb-1.5">End date</label>
            <input id="c-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
          </div>
        </div>

        <p className="text-xs text-ink-muted">
          Suggested amounts and recurring frequencies live on the campaign&rsquo;s payment link — edit those
          from the payment links page.
        </p>

        <div className="pt-4 border-t border-border flex justify-end gap-3">
          <a href="/dashboard/campaigns" className="px-6 py-3 rounded-xl border border-border text-ink hover:bg-cream transition-colors font-medium text-sm">Cancel</a>
          <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">
            {busy ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  "w-full p-3 rounded-xl border border-border bg-surface focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink transition-all text-sm";
