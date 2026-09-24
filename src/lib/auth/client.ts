"use client";

import { createAuthClient } from "@neondatabase/auth/next";

// =============================================================================
// AUTH CLIENT — For use in Client Components
// =============================================================================
// Neon Auth is a managed Better Auth proxy. The client exposes both the
// Supabase-style surface (signInWithPassword, resetPasswordForEmail, ...) and
// the Better Auth methods (signIn.email, signUp.email, requestPasswordReset,
// resetPassword, sendVerificationEmail, verifyEmail, changePassword, ...).

export const authClient = createAuthClient();

export const { useSession, signIn, signUp, signOut } = authClient;

// Additional auth surface used by the forgot/reset password and account flows.
export const requestPasswordReset = authClient.requestPasswordReset;
export const resetPassword = authClient.resetPassword;
export const sendVerificationEmail = authClient.sendVerificationEmail;
export const verifyEmail = authClient.verifyEmail;

// Email-OTP surface (code-based email verification). Neon sends a numeric
// code in the verification email; submit it back via these endpoints.
export const sendVerificationOtp = authClient.emailOtp.sendVerificationOtp;
export const verifyEmailOtp = authClient.emailOtp.verifyEmail;

/** True when Better Auth rejected the request because the email isn't verified
 *  yet (it emails a code — the UI must prompt the user to enter it).
 *  Neon normalizes the Better Auth `EMAIL_NOT_VERIFIED` error to the
 *  `email_not_confirmed` code with a "not confirmed" message, so match both. */
export function isEmailNotVerifiedError(
  error: { code?: string; message?: string; status?: number } | null | undefined
): boolean {
  if (!error) return false;
  const code = (error.code || "").toLowerCase();
  const message = (error.message || "").toLowerCase();
  return (
    error.status === 403 &&
    (code.includes("email_not_verified") ||
      code.includes("email_not_confirmed") ||
      message.includes("email not verified") ||
      message.includes("email not confirmed"))
  );
}
export const changePassword = authClient.changePassword;
export const revokeSession = authClient.revokeSession;
export const listSessions = authClient.listSessions;

/** Returns true when Google OAuth is enabled on the provider (Neon Console). */
export function isGoogleSignInEnabled(): boolean {
  return process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "true";
}