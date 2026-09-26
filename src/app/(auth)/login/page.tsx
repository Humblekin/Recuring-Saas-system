"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, isGoogleSignInEnabled, isEmailNotVerifiedError } from "@/lib/auth/client";
import { VerifyEmailStep } from "@/components/auth/VerifyEmailStep";
import { AuthShell } from "@/components/auth/AuthShell";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const { reset } = use(searchParams);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetComplete] = useState(reset === "complete");
  const [pendingVerify, setPendingVerify] = useState<{
    email: string;
    password: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn.email({ email, password });

      if (result.error) {
        if (isEmailNotVerifiedError(result.error)) {
          setPendingVerify({ email, password });
          setLoading(false);
          return;
        }
        setError(result.error.message || "Invalid email or password.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
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
      if (result.error) {
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
    <AuthShell>
      {/* Mobile Logo */}
      <div className="lg:hidden mb-6 sm:mb-8">
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

      <div className="mb-7 sm:mb-8">
        <h2 className="text-2xl mb-2" style={{ fontFamily: "var(--font-display)" }}>
          Welcome back
        </h2>
        <p className="text-[15px] leading-relaxed text-ink-muted">
          Sign in to manage your organization&apos;s payments.
        </p>
      </div>

      {resetComplete && (
        <div className="mb-5 sm:mb-6 p-3.5 sm:p-4 bg-terracotta/10 border border-terracotta/25 rounded-xl text-terracotta text-sm leading-relaxed">
          Your password has been reset. Sign in with your new password.
        </div>
      )}

      {error && (
        <div className="mb-5 sm:mb-6 p-3.5 sm:p-4 bg-red-500/10 border border-red-500/25 rounded-xl text-error text-sm leading-relaxed">
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
                "Email verified. Sign in with your email and password."
              );
              setPendingVerify(null);
              return;
            }
            router.push("/dashboard");
            router.refresh();
          }}
        />
      ) : (
        <>
          {isGoogleSignInEnabled() && (
        <>
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full min-h-[48px] px-4 py-3 rounded-xl border border-border bg-surface text-[15px] sm:text-sm font-medium flex items-center justify-center gap-3 text-ink transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out-expo hover:bg-cream hover:border-border-light active:scale-[0.99] focus-visible:outline-none focus-visible:border-terracotta focus-visible:ring-4 focus-visible:ring-terracotta/12 disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.46c-.28 1.48-1.12 2.73-2.39 3.58v2.97h3.87c2.26-2.09 3.56-5.17 3.56-8.79z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-2.97c-1.07.72-2.44 1.14-4.07 1.14-3.13 0-5.78-2.11-6.73-4.95H1.28v3.07A12 12 0 0 0 12 24z"/>
              <path fill="#FBBC05" d="M5.27 14.31a7.2 7.2 0 0 1 0-4.62V6.62H1.28a12 12 0 0 0 0 10.76z"/>
              <path fill="#EA4335" d="M12 4.74c1.76 0 3.34.61 4.58 1.8L20.07 3A11.97 11.97 0 0 0 1.28 6.62l3.99 3.07C6.22 6.85 8.87 4.74 12 4.74z"/>
            </svg>
            {googleLoading ? "Redirecting..." : "Continue with Google"}
          </button>

          <div className="flex items-center gap-3 sm:gap-4 my-5 sm:my-6">
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-xs text-ink-muted uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5">
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium mb-1.5">
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@organization.com"
            className="w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-base sm:text-sm text-ink placeholder:text-ink-muted/60 outline-none transition-[border-color,box-shadow] duration-200 ease-out-expo focus:border-terracotta focus:ring-4 focus:ring-terracotta/12"
          />
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <label htmlFor="login-password" className="block text-sm font-medium">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="shrink-0 text-sm text-terracotta font-medium transition-colors duration-200 ease-out-expo hover:text-terracotta-dark"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="login-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-base sm:text-sm text-ink placeholder:text-ink-muted/60 outline-none transition-[border-color,box-shadow] duration-200 ease-out-expo focus:border-terracotta focus:ring-4 focus:ring-terracotta/12"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 text-base mt-1 sm:mt-2 transition-[transform,background-color,box-shadow] duration-200 ease-out-expo active:scale-[0.985] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-surface/30 border-t-surface rounded-full animate-spin" />
              Signing in...
            </span>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      <p className="text-center text-sm text-ink-muted mt-7 sm:mt-8">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="text-terracotta font-medium transition-colors duration-200 ease-out-expo hover:text-terracotta-dark"
        >
          Create one
        </Link>
      </p>
        </>
      )}
    </AuthShell>
  );
}
