"use client";

import { useState } from "react";
import { verifyEmailOtp, sendVerificationOtp } from "@/lib/auth/client";

/**
 * Two-factor-style email verification step for the auth pages.
 * Better Auth emails a numeric code when the account's email isn't
 * verified yet; this collects that code and submits it. Callers pass
 * `onVerified` (e.g. finish sign-in) and `onBack` (return to the form).
 */
export function VerifyEmailStep({
  email,
  onVerified,
  onBack,
}: {
  email: string;
  onVerified: () => Promise<void>;
  onBack: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setVerifying(true);

    try {
      const result = await verifyEmailOtp({ email, otp: code.trim() });
      if (result.error) {
        setError(
          "That code didn't work. Check the email for the latest code and try again."
        );
        setVerifying(false);
        return;
      }
      await onVerified();
    } catch {
      setError("Something went wrong. Please try again.");
      setVerifying(false);
    }
  }

  async function resend() {
    setResending(true);
    setError("");
    setInfo("");
    try {
      const result = await sendVerificationOtp({
        email,
        type: "email-verification",
      });
      if (result.error) {
        setError(
          "Could not resend the email. Ask your administrator to enable verification emails in the Neon Auth console."
        );
      } else {
        setInfo("A new code is on its way. Check your inbox.");
      }
    } catch {
      setError("Could not resend the email.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl mb-2" style={{ fontFamily: "var(--font-display)" }}>
          Check your email
        </h2>
        <p className="text-ink-muted">
          We sent a verification code to <span className="font-mono">{email}</span>.
          Enter it below to confirm your email and continue.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-xl text-red-300 text-sm">
          {error}
        </div>
      )}
      {info && (
        <div className="p-4 bg-terracotta/10 border border-terracotta/25 rounded-xl text-terracotta-light text-sm">
          {info}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="verify-code" className="block text-sm font-medium mb-1.5">
            Verification code
          </label>
          <input
            id="verify-code"
            type="text"
            required
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
            placeholder="000000"
            className="w-full p-3 rounded-xl border border-border bg-surface focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink transition-all text-sm font-mono tracking-[0.3em] text-center"
          />
        </div>

        <button
          type="submit"
          disabled={verifying || code.length === 0}
          className="btn-primary w-full py-3 text-base mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {verifying ? "Verifying..." : "Verify & continue"}
        </button>
      </form>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={resend}
          disabled={resending}
          className="text-terracotta font-medium hover:underline disabled:opacity-50"
        >
          {resending ? "Sending…" : "Resend code"}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="text-ink-muted hover:text-ink"
        >
          Use a different email
        </button>
      </div>
    </div>
  );
}