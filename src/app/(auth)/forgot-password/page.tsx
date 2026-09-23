"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/auth/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (result.error) {
        setError(
          result.error.message ||
            "We could not send a reset link. Check the email and try again."
        );
        setLoading(false);
        return;
      }

      setSent(true);
      setLoading(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl mb-2" style={{ fontFamily: "var(--font-display)" }}>
          Reset your password
        </h2>
        <p className="text-ink-muted">
          Enter the email address associated with your account and we&apos;ll send
          you a link to reset it.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/25 rounded-xl text-red-300 text-sm">
          {error}
        </div>
      )}

      {sent ? (
        <div className="p-6 bg-terracotta/10 border border-terracotta/25 rounded-xl text-terracotta-light text-sm">
          <p className="font-medium mb-1">Check your inbox</p>
          <p>
            If an account exists for <span className="font-mono">{email}</span>, a
            password reset link is on its way. It may take a few minutes to arrive —
            do not close this tab if you&apos;re testing on a local server.
          </p>
          <button
            onClick={() => setSent(false)}
            className="mt-4 text-terracotta font-medium hover:underline"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label htmlFor="forgot-email" className="block text-sm font-medium mb-1.5">
              Email address
            </label>
            <input
              id="forgot-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@organization.com"
              className="w-full p-3 rounded-xl border border-border bg-surface focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink transition-all text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-base mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
      )}

      <p className="text-center text-sm text-ink-muted mt-8">
        Remembered your password?{" "}
        <Link href="/login" className="text-terracotta font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}