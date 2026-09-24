"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp, signIn, useSession, isGoogleSignInEnabled, isEmailNotVerifiedError } from "@/lib/auth/client";
import { VerifyEmailStep } from "@/components/auth/VerifyEmailStep";

export default function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const { invite } = use(searchParams);
  const router = useRouter();
  const { data: session } = useSession();
  // Already signed in (Google OAuth, or an email account whose provisioning
  // previously failed). /register doubles as the org-setup funnel for these —
  // skip account creation and go straight to org provisioning.
  const isAuthenticated = Boolean(session?.user);
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [pendingVerify, setPendingVerify] = useState<{
    orgName: string;
    email: string;
    password: string;
  } | null>(null);

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);
  }

  async function createOrganization(orgNameArg: string, inviteArg: string | undefined) {
    const slug = generateSlug(orgNameArg);
    const res = await fetch("/api/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        inviteArg
          ? { inviteToken: inviteArg }
          : { name: orgNameArg, slug }
      ),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to create organization.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isAuthenticated && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      if (!isAuthenticated) {
        const result = await signUp.email({
          email,
          password,
          name: orgName,
        });

        if (result.error) {
          // The account was created but Better Auth is waiting for the user to
          // confirm their email — show the code-entry step instead of failing.
          if (isEmailNotVerifiedError(result.error)) {
            setPendingVerify({ orgName, email, password });
            setLoading(false);
            return;
          }
          setError(result.error.message || "Registration failed. Please try again.");
          setLoading(false);
          return;
        }
      }

      await createOrganization(orgName, invite);
      router.push(invite ? "/dashboard" : "/dashboard/onboarding");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
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
        <Link href="/" className="flex items-center gap-2.5 text-ink no-underline">
          <span
            className="w-8 h-8 rounded-md bg-terracotta flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            <span className="font-display font-medium text-sm leading-none text-[#051009]">
              K
            </span>
          </span>
          <span className="text-xl tracking-tight" style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>
            Kivaro
          </span>
        </Link>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl mb-2" style={{ fontFamily: "var(--font-display)" }}>
          {invite ? "Join your team" : "Create your organization"}
        </h2>
        <p className="text-ink-muted">
          {isAuthenticated
            ? invite
              ? "You were invited to an organization on Kivaro. Accept the invite to join your team."
              : "You're signed in but don't belong to an organization yet. Set one up to start collecting."
            : invite
              ? "You were invited to an organization on Kivaro. Create your account to get started."
              : "Set up your Kivaro account and start collecting in minutes."}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/25 rounded-xl text-red-300 text-sm">
          {error}
        </div>
      )}

      {pendingVerify ? (
        <VerifyEmailStep
          email={pendingVerify.email}
          onBack={() => setPendingVerify(null)}
          onVerified={async () => {
            const result = await signIn.email({
              email: pendingVerify.email,
              password: pendingVerify.password,
            });
            if (result.error) {
              setError(
                "Email verified. Sign in with your email and password to continue."
              );
              setPendingVerify(null);
              return;
            }
            await createOrganization(pendingVerify.orgName, invite);
            router.push(invite ? "/dashboard" : "/dashboard/onboarding");
            router.refresh();
          }}
        />
      ) : (
        <>
      {isGoogleSignInEnabled() && !isAuthenticated && (
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
                kivaro.app/give/{generateSlug(orgName)}
              </p>
            )}
          </div>
        )}

        {!isAuthenticated && (
          <>
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
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 text-base mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-surface/30 border-t-surface rounded-full animate-spin" />
              {isAuthenticated ? "Creating organization..." : "Creating account..."}
            </span>
          ) : (
            isAuthenticated ? (invite ? "Accept invite" : "Create organization") : "Create account"
          )}
        </button>
      </form>

      {!isAuthenticated && (
        <p className="text-center text-sm text-ink-muted mt-8">
          Already have an account?{" "}
          <Link href="/login" className="text-terracotta font-medium hover:underline">
            Sign in
          </Link>
        </p>
      )}
        </>
      )}
    </div>
  );
}