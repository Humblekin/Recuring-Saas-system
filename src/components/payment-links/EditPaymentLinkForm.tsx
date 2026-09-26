"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePaymentLink } from "@/app/actions/payment-links";
import { cn, errorMessage } from "@/lib/utils";
import type { RecurringFrequency } from "@/lib/constants";

const FREQ_OPTIONS = ["weekly", "monthly", "yearly"] as const;

export function EditPaymentLinkForm({
  linkId,
  initial,
  publicUrl,
}: {
  linkId: string;
  initial: {
    name: string;
    description: string | null;
    amounts: number[];
    oneTimeEnabled: boolean;
    recurringEnabled: boolean;
    frequencies: string[];
  };
  publicUrl: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description ?? "");
  // `amounts` is held in pesewas (minor); the action expects GHS majors.
  const [amounts, setAmounts] = useState<number[]>(initial.amounts);
  const [customAmount, setCustomAmount] = useState("");
  const [oneTime, setOneTime] = useState(initial.oneTimeEnabled);
  const [recurring, setRecurring] = useState(initial.recurringEnabled);
  const [frequencies, setFrequencies] = useState<RecurringFrequency[]>(
    initial.frequencies.filter((f): f is RecurringFrequency =>
      (FREQ_OPTIONS as readonly string[]).includes(f)
    )
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);

    if (!oneTime && !recurring) {
      setError("Enable one-time or recurring payments (at least one).");
      return;
    }
    if (recurring && frequencies.length === 0) {
      setError("Pick at least one recurring frequency.");
      return;
    }

    setBusy(true);
    try {
      await updatePaymentLink(linkId, {
        name,
        description,
        amounts: amounts.map((a) => a / 100),
        oneTimeEnabled: oneTime,
        recurringEnabled: recurring,
        frequencies,
      });
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, "Could not save the payment link."));
    } finally {
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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <a href="/dashboard/payment-links" className="text-sm text-ink-muted hover:text-ink mb-4 inline-block">
          ← Back to payment links
        </a>
        <h2 className="text-2xl font-medium" style={{ fontFamily: "var(--font-display)" }}>
          Edit payment link
        </h2>
        <p className="text-ink-muted mt-1">
          Changes apply immediately to the live giving page.
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
          <label htmlFor="pl-name" className="block text-sm font-medium mb-1.5">Link name</label>
          <input id="pl-name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>

        <div>
          <span className="block text-sm font-medium mb-1.5">Public link</span>
          <code className="block w-full p-3 rounded-xl border border-border bg-cream text-xs text-ink-muted truncate">
            {publicUrl}
          </code>
          <p className="text-xs text-ink-muted mt-1.5">
            This address never changes, so links you have already shared keep working after a rename.
          </p>
        </div>

        <div>
          <label htmlFor="pl-desc" className="block text-sm font-medium mb-1.5">Description</label>
          <textarea id="pl-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Help your supporters understand where their money goes…" className={`${inputClass} resize-none`} />
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <label className="flex items-center gap-3 p-4 rounded-xl border border-border bg-cream cursor-pointer">
            <input type="checkbox" checked={oneTime} onChange={(e) => setOneTime(e.target.checked)} className="w-4 h-4 accent-ink" />
            <span className="text-sm">Allow one-time payments</span>
          </label>
          <label className="flex items-center gap-3 p-4 rounded-xl border border-border bg-cream cursor-pointer">
            <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} className="w-4 h-4 accent-ink" />
            <span className="text-sm">Allow recurring payments</span>
          </label>
        </div>

        {recurring && (
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
          <a href="/dashboard/payment-links" className="px-6 py-3 rounded-xl border border-border text-ink hover:bg-cream transition-colors font-medium text-sm">Cancel</a>
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
