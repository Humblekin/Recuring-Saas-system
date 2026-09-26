"use client";

import { useEffect, useRef, useState } from "react";
import { processCheckout, getMomoStatus } from "@/app/actions/checkout";
import { cn, errorMessage } from "@/lib/utils";
import type { RecurringFrequency } from "@/lib/constants";

type PublicLink = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  amounts: number[]; // pesewas
  oneTimeEnabled: boolean;
  recurringEnabled: boolean;
  frequencies: string[];
};

type PendingState = {
  kind: "one-time" | "recurring";
  referenceId: string;
  receiptPath: string;
};

const FREQ_LABELS: Record<string, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

const PHONE_RE = /^(\+?233|0)[1-9]\d{8}$/;

export function GiveForm({
  orgSlug,
  links,
  campaignSlug,
  defaultLinkId,
  accentColor,
}: {
  orgSlug: string;
  links: PublicLink[];
  campaignSlug?: string;
  defaultLinkId?: string;
  accentColor: string;
}) {
  const activeLink = links.find((l) => l.id === defaultLinkId) || links[0];

  const [linkId, setLinkId] = useState(activeLink?.id ?? "");
  const [amount, setAmount] = useState(0);
  const [chosenPreset, setChosenPreset] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [mode, setMode] = useState<"one-time" | "recurring">("one-time");
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [pending, setPending] = useState<PendingState | null>(null);
  const [pendingResult, setPendingResult] = useState<"pending" | "success" | "failed">("pending");

  // Idempotency key for the CURRENT checkout attempt. The server treats this as
  // "one charge, ever": if the request times out or the supporter presses Give
  // again, the retry replays this key instead of creating a second charge. It is
  // keyed to a fingerprint of the payment details, so editing the amount/phone
  // mints a genuinely new key rather than replaying a stale attempt.
  const attemptRef = useRef<{ key: string; fingerprint: string } | null>(null);

  const selected = links.find((l) => l.id === linkId) || activeLink;

  const clickableMode =
    mode === "one-time" ? (!selected?.oneTimeEnabled ? "recurring" : "one-time") : !selected?.recurringEnabled ? "one-time" : "recurring";

  // Poll MTN while the payer approves the request in their MoMo app.
  useEffect(() => {
    if (!pending) return;
    let cancelled = false;
    let tries = 0;

    const tick = async () => {
      if (cancelled) return;
      tries += 1;
      try {
        const result = await getMomoStatus({ kind: pending.kind, referenceId: pending.referenceId });
        if (cancelled) return;
        if (result.status === "success") {
          setPendingResult("success");
          return;
        }
        if (result.status === "failed") {
          setPendingResult("failed");
          return;
        }
      } catch {
        // Transient — keep polling.
      }
      if (tries < 25 && !cancelled) {
        setTimeout(tick, 4000);
      } else if (!cancelled) {
        setPendingResult("failed");
      }
    };

    tick();
    return () => {
      cancelled = true;
    };
  }, [pending]);

  function selectPreset(pesewas: number) {
    setAmount(pesewas);
    setChosenPreset(pesewas);
    setCustomAmount("");
  }

  function onCustom(e: React.ChangeEvent<HTMLInputElement>) {
    setCustomAmount(e.target.value);
    setAmount(Math.round(Number(e.target.value) * 100));
    setChosenPreset(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !email.includes("@")) {
      setError("Please provide a valid email so we can send your receipt.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Please choose an amount.");
      return;
    }
    if (!PHONE_RE.test(phone.trim())) {
      setError("Please provide a valid MTN MoMo phone number (e.g. 024 123 4567).");
      return;
    }
    if (clickableMode === "recurring" && !consent) {
      setError("Please authorize the recurring payment to continue.");
      return;
    }

    setSubmitting(true);
    try {
      const fingerprint = JSON.stringify([
        orgSlug,
        selected?.slug ?? null,
        campaignSlug ?? null,
        amount,
        email.trim().toLowerCase(),
        phone.trim(),
        clickableMode,
        frequency,
      ]);
      if (!attemptRef.current || attemptRef.current.fingerprint !== fingerprint) {
        attemptRef.current = { key: crypto.randomUUID(), fingerprint };
      }

      const result = await processCheckout({
        orgSlug,
        linkSlug: selected?.slug,
        campaignSlug,
        amount: amount / 100,
        email,
        name,
        phone,
        mode: clickableMode,
        frequency: clickableMode === "recurring" ? frequency : undefined,
        idempotencyKey: attemptRef.current.key,
      });
      if (result.kind === "unavailable") {
        attemptRef.current = null;
        setError(result.reason);
        setSubmitting(false);
        return;
      }
      // The charge exists now, so the next Give press is a new contribution.
      attemptRef.current = null;
      setPending({
        kind: result.kind,
        referenceId: result.kind === "one-time" ? result.referenceId : result.preApprovalId,
        receiptPath: result.receiptPath,
      });
      setPendingResult("pending");
    } catch (err) {
      const raw = errorMessage(err, "Something went wrong while starting the payment.");
      // Production redacts server-action error text to a cryptic "#441"-style
      // message — replace it with a clear fallback so the supporter isn't
      // shown an internal React error string.
      setError(
        /Minified React error|Server Components render|omitted in production/.test(raw)
          ? "Something went wrong while starting the payment. Please try again."
          : raw
      );
      setSubmitting(false);
    }
  }

  function resetPending() {
    attemptRef.current = null;
    setPending(null);
    setPendingResult("pending");
    setSubmitting(false);
  }

  if (!selected) {
    return (
      <div className="p-6 text-center text-sm text-ink-muted">
        This organization is not accepting payments right now.
      </div>
    );
  }

  // --- Async approval screen: waiting for the payer's MoMo prompt ---
  if (pending && pendingResult === "pending") {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-ink/20 border-t-ink animate-spin" />
        <h3 className="text-lg font-medium" style={{ fontFamily: "var(--font-display)" }}>
          Approve on your phone
        </h3>
        <p className="text-sm text-ink-muted max-w-xs">
          {pending.kind === "recurring"
            ? "We sent a recurring payment authorization to your MTN MoMo app. Approve it to start your contributions."
            : "We sent a payment request to your MTN MoMo app. Approve it to complete your contribution."}
        </p>
        <p className="text-xs text-ink-muted">Waiting for approval… this usually takes less than a minute.</p>
      </div>
    );
  }

  if (pending && pendingResult === "success") {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h3 className="text-lg font-medium" style={{ fontFamily: "var(--font-display)" }}>
          Thank you!
        </h3>
        <p className="text-sm text-ink-muted max-w-xs">
          {pending.kind === "recurring"
            ? "Your recurring contribution is set up. You will receive a receipt in your email."
            : "Your contribution was received. A receipt is on its way to your email."}
        </p>
        <a
          href={pending.receiptPath}
          className="text-sm font-medium text-terracotta hover:underline"
        >
          View receipt
        </a>
      </div>
    );
  }

  const presets = (selected.amounts || []).filter((a) => a > 0);
  const showOneTime = selected.oneTimeEnabled;
  const showRecurring = selected.recurringEnabled;
  const isRecurring = clickableMode === "recurring";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {links.length > 1 && (
        <div>
          <label htmlFor="giv-link" className="block text-sm font-medium mb-1.5">
            Where should your gift go?
          </label>
          <select
            id="giv-link"
            value={linkId}
            onChange={(e) => {
              setLinkId(e.target.value);
              setAmount(0);
              setChosenPreset(null);
            }}
            className="w-full p-3 rounded-xl border border-border bg-surface focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink transition-all text-sm"
          >
            {links.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          {selected.description && (
            <p className="text-xs text-ink-muted mt-1.5">{selected.description}</p>
          )}
        </div>
      )}

      {(showOneTime || showRecurring) && (
        <div>
          <span className="block text-sm font-medium mb-1.5">I want to give</span>
          <div className="inline-flex p-1 rounded-xl bg-cream border border-border">
            <button
              type="button"
              onClick={() => setMode("one-time")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                mode === "one-time" ? "bg-ink text-cream" : "text-ink-muted hover:text-ink"
              )}
            >
              One-time
            </button>
            <button
              type="button"
              onClick={() => setMode("recurring")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                mode === "recurring" ? "bg-ink text-cream" : "text-ink-muted hover:text-ink"
              )}
            >
              Monthly / More
            </button>
          </div>
        </div>
      )}

      {presets.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {presets.slice(0, 4).map((pesewas) => (
            <button
              key={pesewas}
              type="button"
              onClick={() => selectPreset(pesewas)}
              className={cn(
                "py-3 rounded-xl border text-sm font-medium transition-colors",
                chosenPreset === pesewas
                  ? "border-ink bg-ink text-cream"
                  : "border-border bg-surface hover:border-ink"
              )}
            >
              GHS {pesewas / 100}
            </button>
          ))}
        </div>
      )}

      <div>
        <label htmlFor="giv-custom" className="block text-sm font-medium mb-1.5">
          Or enter an amount
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted font-medium text-sm">
            GHS
          </span>
          <input
            id="giv-custom"
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            value={customAmount}
            onChange={onCustom}
            placeholder="10"
            className="w-full p-3 pl-14 rounded-xl border border-border bg-surface focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink transition-all text-sm"
          />
        </div>
      </div>

      {mode === "recurring" && showRecurring && selected.frequencies.length > 0 && (
        <div>
          <span className="block text-sm font-medium mb-1.5">Frequency</span>
          <div className="flex flex-wrap gap-2">
            {selected.frequencies.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFrequency(f as RecurringFrequency)}
                className={cn(
                  "px-4 py-2 rounded-xl border text-sm font-medium transition-colors",
                  frequency === f
                    ? "border-ink bg-ink text-cream"
                    : "border-border bg-surface hover:border-ink"
                )}
              >
                {FREQ_LABELS[f] || f}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="giv-name" className="block text-sm font-medium mb-1.5">
            Your name <span className="text-ink-muted">(optional)</span>
          </label>
          <input
            id="giv-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ama Doe"
            className="w-full p-3 rounded-xl border border-border bg-surface focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink transition-all text-sm"
          />
        </div>
        <div>
          <label htmlFor="giv-email" className="block text-sm font-medium mb-1.5">
            Email for your receipt
          </label>
          <input
            id="giv-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full p-3 rounded-xl border border-border bg-surface focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink transition-all text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="giv-phone" className="block text-sm font-medium mb-1.5">
            MTN MoMo phone number
          </label>
          <input
            id="giv-phone"
            type="tel"
            required
            autoComplete="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="024 123 4567"
            className="w-full p-3 rounded-xl border border-border bg-surface focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink transition-all text-sm"
          />
          <p className="text-xs text-ink-muted mt-1.5">
            You will approve the payment with your MTN MoMo PIN.
          </p>
        </div>
      </div>

      {isRecurring && (
        <label className="flex items-start gap-2.5 text-xs text-ink-muted leading-relaxed">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 accent-[#ffcb05]"
          />
          <span>
            I authorize {selected.name} to charge my MTN MoMo wallet automatically every{" "}
            {FREQ_LABELS[frequency]?.toLowerCase() || "monthly"} according to the schedule above.
            I understand I can cancel this authorization at any time.
          </span>
        </label>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
      )}

      {pending && pendingResult === "failed" && (
        <div className="flex flex-col gap-3">
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            We couldn&apos;t confirm your payment. If money was deducted, it may still settle — check your
            MTN MoMo history.
          </div>
          <button type="button" onClick={resetPending} className="text-sm font-medium text-terracotta hover:underline text-left">
            Try again
          </button>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3.5 rounded-xl text-white font-medium text-base transition-colors disabled:opacity-60"
        style={{ backgroundColor: accentColor }}
      >
        {submitting
          ? "Requesting payment…"
          : `${isRecurring ? "Start " : "Give "}${
              amount > 0 ? `GHS ${(amount / 100).toLocaleString()}` : ""
            }${isRecurring ? ` ${FREQ_LABELS[frequency] || ""}` : ""}`.trim()}
      </button>

      <p className="text-xs text-ink-muted text-center">
        Powered by MTN Mobile Money. You&apos;ll approve the payment on your phone.
      </p>
    </form>
  );
}