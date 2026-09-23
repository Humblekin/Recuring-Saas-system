import { createNeonAuth } from "@neondatabase/auth/next/server";

// =============================================================================
// AUTH SERVER INSTANCE — Neon Managed Better Auth
// =============================================================================
// This is the single source of truth for auth in the entire application.
// Use `auth.getSession()` in Server Components and Server Actions.
// Use `auth.handler()` to create the API route proxy.
// =============================================================================

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
  },
});

/**
 * Get the current session ({ session, user }) or null when logged out.
 * Use in Server Components and Server Actions.
 * Note: auth.getSession() returns { data, error }, not the session directly.
 */
export async function getSession() {
  const { data } = await auth.getSession();
  if (data?.session && data?.user) return data;
  return null;
}

/**
 * Require authentication — throws if not logged in.
 * Returns the full session payload ({ session, user }).
 * Use in Server Actions and protected page data fetching.
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}
