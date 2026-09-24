"use client";

import { useState } from "react";
import { verifyEmailOtp, sendVerificationOtp } from "@/lib/auth/client";
import { XIcon } from "@/components/ui/icons";

/**
 * Shows when the signed-in user hasn't verified their email address yet.
 * Accepts the emailed verification code inline ("paste + confirm"), with a
 * resend action. Email delivery is configured on the Neon Auth console; if
 * it's not configured the action fails gracefully and we hint at setup.
 */
export function EmailVerificationNotice({
  email,
}: {
  email: string;
}) {
  const [hidden, setHidden] = useState(false);
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  if (hidden || done) return null;

  async function resend() {
    setSending(true);
    setError("");
    try {
      const result = await sendVerificationOtp({
        email,
        type: "email-verification",
      });
      if (result.error) {
        setError(
          "Could not send the verification email. Ask your administrator to enable verification emails in the Neon Auth console."
        );
      }
    } catch {
      setError("Could not send the verification email.");
    } finally {
      setSending(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
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
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
      setVerifying(false);
    }
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl px-4 py-3 text-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium mb-0.5">Verify your email address</p>
          <p className="text-yellow-700">
            A verification code has been sent to your inbox. Paste it below to
            confirm your email.
            {error && <span className="block text-yellow-700 mt-1">{error}</span>}
          </p>
        </div>
        <button
          onClick={() => setHidden(true)}
          aria-label="Dismiss"
          className="hover:opacity-70 flex-shrink-0"
        >
          <XIcon size={16} />
        </button>
      </div>

      <form
        onSubmit={handleVerify}
        className="mt-3 flex flex-col sm:flex-row gap-2 w-full"
      >
        <input
          type="text"
          required
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
          placeholder="Paste the code from the email"
          className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-yellow-300 bg-white text-sm font-mono tracking-[0.2em] focus:outline-none focus:ring-1 focus:ring-yellow-400"
        />
        <button
          type="submit"
          disabled={verifying || code.length === 0}
          className="px-4 py-2 rounded-lg bg-yellow-500 text-white text-sm font-medium hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {verifying ? "Verifying…" : "Verify & continue"}
        </button>
        <button
          type="button"
          onClick={resend}
          disabled={sending}
          className="px-3 py-2 rounded-lg text-yellow-800 text-sm font-medium hover:underline disabled:opacity-50 whitespace-nowrap"
        >
          {sending ? "Sending…" : "Resend code"}
        </button>
      </form>
    </div>
  );
}