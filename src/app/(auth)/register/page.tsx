"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp, signIn, isGoogleSignInEnabled } from "@/lib/auth/client";

export default function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const { invite } = use(searchParams);
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const result = await signUp.email({
        email,
        password,
        name: orgName,
      });

      if (result.error) {
        setError(result.error.message || "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      const slug = generateSlug(orgName);
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          invite
            ? { inviteToken: invite }
            : { name: orgName, slug }
        ),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to create organization.");
        setLoading(false);
        return;
      }

      router.push(invite ? "/dashboard" : "/dashboard/onboarding");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      const result = await signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}/dashboard`,
      });
      if (result?.error) {
        setError(
          result.error.message ||
            "Google sign-in is not configured for this instance yet."
        );
        setGoogleLoading(false);
        return;
      }
    } catch {
      setError("Google sign-in could not be started.");
      setGoogleLoading(false);
    }
  }

  return (
    <div>
      {/* Mobile Logo */}
      <div className="lg:hidden mb-8">
        <Link href="/" className="flex items-center gap-2 text-ink no-underline">
          <div className="w-8 h-8 bg-ink rounded-md flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <ellipse cx="12" cy="12" rx="5" ry="7" stroke="white" strokeWidth="1.5" fill="none" />
              <ellipse cx="12" cy="12" rx="2" ry="3.5" fill="white" opacity="0.6" />
            </svg>
          </div>
          <span className="text-xl tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Cowrie
          </span>
        </Link>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl mb-2" style={{ fontFamily: "var(--font-display)" }}>
          {invite ? "Join your team" : "Create your organization"}
        </h2>
        <p className="text-ink-muted">
          {invite
            ? "You were invited to an organization on Cowrie. Create your account to get started."
            : "Set up your Cowrie account and start collecting in minutes."}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {isGoogleSignInEnabled() && (
        <>
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full py-3 rounded-xl border border-border bg-surface hover:bg-cream transition-colors font-medium text-sm flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.46c-.28 1.48-1.12 2.73-2.39 3.58v2.97h3.87c2.26-2.09 3.56-5.17 3.56-8.79z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-2.97c-1.07.72-2.44 1.14-4.07 1.14-3.13 0-5.78-2.11-6.73-4.95H1.28v3.07A12 12 0 0 0 12 24z"/>
              <path fill="#FBBC05" d="M5.27 14.31a7.2 7.2 0 0 1 0-4.62V6.62H1.28a12 12 0 0 0 0 10.76z"/>
              <path fill="#EA4335" d="M12 4.74c1.76 0 3.34.61 4.58 1.8L20.07 3A11.97 11.97 0 0 0 1.28 6.62l3.99 3.07C6.22 6.85 8.87 4.74 12 4.74z"/>
            </svg>
            {googleLoading ? "Redirecting..." : "Continue with Google"}
          </button>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-xs text-ink-muted uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {!invite && (
          <div>
            <label htmlFor="register-org" className="block text-sm font-medium mb-1.5">
              Organization name
            </label>
            <input
              id="register-org"
              type="text"
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g. HopeWorks Ghana"
              className="w-full p-3 rounded-xl border border-border bg-surface focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink transition-all text-sm"
            />
            {orgName && (
              <p className="text-xs text-ink-muted mt-1.5 font-mono">
                cowrie.app/give/{generateSlug(orgName)}
              </p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="register-email" className="block text-sm font-medium mb-1.5">
            Email address
          </label>
          <input
            id="register-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@organization.com"
            className="w-full p-3 rounded-xl border border-border bg-surface focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink transition-all text-sm"
          />
        </div>

        <div>
          <label htmlFor="register-password" className="block text-sm font-medium mb-1.5">
            Password
          </label>
          <input
            id="register-password"
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="w-full p-3 rounded-xl border border-border bg-surface focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink transition-all text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 text-base mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-surface/30 border-t-surface rounded-full animate-spin" />
              Creating account...
            </span>
          ) : (
            "Create account"
          )}
        </button>
      </form>

      <p className="text-center text-sm text-ink-muted mt-8">
        Already have an account?{" "}
        <Link href="/login" className="text-terracotta font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}