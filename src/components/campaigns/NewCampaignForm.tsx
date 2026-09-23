"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCampaign } from "@/app/actions/campaigns";
import { cn, errorMessage } from "@/lib/utils";
import type { RecurringFrequency } from "@/lib/constants";

const FREQ_OPTIONS = ["weekly", "monthly", "yearly"] as const;

export function NewCampaignForm({
  orgSlug,
  publicBaseUrl,
}: {
  orgSlug: string;
  publicBaseUrl: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [recurringEnabled, setRecurringEnabled] = useState(true);
  const [frequencies, setFrequencies] = useState<RecurringFrequency[]>(["weekly", "monthly", "yearly"]);
  const [amounts, setAmounts] = useState<number[]>([1000, 2000, 5000, 10000]);
  const [customAmount, setCustomAmount] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [campaignSlug, setCampaignSlug] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const campaign = await createCampaign({
        title,
        description,
        goalAmount: Number(goalAmount) || 0,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        // `amounts` is held in pesewas (minor); the action expects GHS majors.
        amounts: amounts.map((a) => a / 100),
        recurringEnabled,
        frequencies,
      });
      setCampaignSlug(campaign.slug);
    } catch (err) {
      setError(errorMessage(err, "Could not create the campaign."));
      setBusy(false);
    }
  }

  function addCustomAmount() {
    const value = Number(customAmount);
    if (!Number.isFinite(value) || value <= 0) return;
    const pesewas = Math.round(value * 100);
    if (!amounts.includes(pesewas)) setAmounts([...amounts, pesewas]);
    setCustomAmount("");
  }

  function toggleFrequency(f: RecurringFrequency) {
    setFrequencies((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  }

  if (campaignSlug) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-surface border border-border p-8 sm:p-10 rounded-3xl text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h2 className="text-2xl font-medium mb-2" style={{ fontFamily: "var(--font-display)" }}>
            Campaign created
          </h2>
          <p className="text-ink-muted mb-8">Your campaign is live with its own public page.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={`${publicBaseUrl}/give/${orgSlug}/${campaignSlug}`} target="_blank" className="btn-primary no-underline">
              View public page
            </a>
            <button
              onClick={() => {
                router.push("/dashboard/campaigns");
                router.refresh();
              }}
              className="px-6 py-3 rounded-xl border border-border text-ink hover:bg-cream transition-colors font-medium text-sm"
            >
              Back to campaigns
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <a href="/dashboard/campaigns" className="text-sm text-ink-muted hover:text-ink mb-4 inline-block">← Back to campaigns</a>
        <h2 className="text-2xl font-medium" style={{ fontFamily: "var(--font-display)" }}>Start a campaign</h2>
        <p className="text-ink-muted mt-1">A campaign gets its own public page and progress bar.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-surface border border-border p-6 sm:p-8 rounded-2xl flex flex-col gap-6">
        <div>
          <label htmlFor="c-title" className="block text-sm font-medium mb-1.5">Campaign title</label>
          <input id="c-title" type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Raise GHS 500 for our tutoring program" className={inputClass} />
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

        <div>
          <span className="block text-sm font-medium mb-1.5">Suggested amounts (GHS)</span>
          <div className="flex flex-wrap items-center gap-2">
            {amounts.map((a) => (
              <span key={a} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cream border border-border text-sm font-medium">
                GHS {a / 100}
                <button type="button" onClick={() => setAmounts(amounts.filter((x) => x !== a))} className="text-ink-muted hover:text-red-500" aria-label="Remove">×</button>
              </span>
            ))}
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                step="1"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomAmount();
                  }
                }}
                placeholder="Custom"
                className="w-28 p-2.5 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:border-ink"
              />
              <button type="button" onClick={addCustomAmount} className="px-3 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-cream transition-colors">Add</button>
            </div>
          </div>
        </div>

        <label className="flex items-center gap-3 p-4 rounded-xl border border-border bg-cream cursor-pointer">
          <input type="checkbox" checked={recurringEnabled} onChange={(e) => setRecurringEnabled(e.target.checked)} className="w-4 h-4 accent-ink" />
          <span className="text-sm">Allow recurring donations</span>
        </label>

        {recurringEnabled && (
          <div>
            <span className="block text-sm font-medium mb-1.5">Recurring frequencies</span>
            <div className="flex flex-wrap gap-2">
              {FREQ_OPTIONS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleFrequency(f)}
                  className={cn(
                    "px-4 py-2 rounded-xl border text-sm font-medium transition-colors",
                    frequencies.includes(f) ? "border-ink bg-ink text-cream" : "border-border bg-surface hover:border-ink"
                  )}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-border flex justify-end gap-3">
          <a href="/dashboard/campaigns" className="px-6 py-3 rounded-xl border border-border text-ink hover:bg-cream transition-colors font-medium text-sm">Cancel</a>
          <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">
            {busy ? "Creating…" : "Launch campaign"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  "w-full p-3 rounded-xl border border-border bg-surface focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink transition-all text-sm";