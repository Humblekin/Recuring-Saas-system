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
export const changePassword = authClient.changePassword;
export const revokeSession = authClient.revokeSession;
export const listSessions = authClient.listSessions;

/** Returns true when Google OAuth is enabled on the provider (Neon Console). */
export function isGoogleSignInEnabled(): boolean {
  return process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "true";
}