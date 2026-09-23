import { auth } from "@/lib/auth/server";

// =============================================================================
// AUTH API ROUTE — Catch-all proxy to Neon Managed Better Auth
// =============================================================================
// This route handles ALL auth endpoints:
// POST /api/auth/sign-up/email
// POST /api/auth/sign-in/email
// POST /api/auth/sign-out
// GET  /api/auth/session
// etc.
// =============================================================================

export const { GET, POST } = auth.handler();
