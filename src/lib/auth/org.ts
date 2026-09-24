import { db } from "@/lib/db";
import { users, organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/server";

// =============================================================================
// ORGANIZATION AUTHORIZATION HELPERS
// =============================================================================
// Every dashboard query and mutation MUST resolve the caller's organization
// through these helpers. This is the server-side authorization boundary:
// a user can only ever see or act on data for the organization they belong to.
// =============================================================================

export type SessionUserRecord = Awaited<ReturnType<typeof requireAuth>>["user"];

export type OrgContext = {
  session: { session: unknown; user: SessionUserRecord };
  user: typeof users.$inferSelect;
  organization: typeof organizations.$inferSelect;
};

/**
 * Resolve (and if necessary repair) the local `users` row for a Neon Auth
 * session. Neon Auth user ids can drift when an auth project/account is
 * recreated (a previously-created email gets a fresh `user.id`), which would
 * otherwise orphan an existing account and bounce it to /register.
 *
 * Resolution order:
 *  1. exact match on neonAuthId     → return the row
 *  2. email match (id drifted)      → re-link the row to the new id and return it
 *  3. no row at all                 → auto-provision one (idempotent)
 *
 * Returns null only when the row genuinely cannot be created/resolved.
 */
export async function getOrLinkUserRecord(session: {
  user: { id: string; email?: string | null; name?: string | null };
}): Promise<typeof users.$inferSelect | null> {
  const byId = await db.query.users.findFirst({
    where: eq(users.neonAuthId, session.user.id),
  });
  if (byId) return byId;

  if (session.user.email) {
    const byEmail = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    });
    if (byEmail) {
      const [relinked] = await db
        .update(users)
        .set({ neonAuthId: session.user.id, name: session.user.name || byEmail.name })
        .where(eq(users.id, byEmail.id))
        .returning();
      return relinked ?? byEmail;
    }
  }

  if (!session.user.email) return null;

  try {
    const [created] = await db
      .insert(users)
      .values({
        neonAuthId: session.user.id,
        email: session.user.email,
        name: session.user.name || null,
      })
      .onConflictDoNothing({ target: users.neonAuthId })
      .returning();
    if (created) return created;
    return (await db.query.users.findFirst({
      where: eq(users.neonAuthId, session.user.id),
    })) ?? null;
  } catch {
    return null;
  }
}

/** Returns the current user's row in our `users` table (or null when the Neon
 *  auth user has no local record yet). Throws when logged out. */
export async function getCurrentUserRecord() {
  const session = await requireAuth();
  const user = await getOrLinkUserRecord(session);
  return { session, user };
}

/**
 * Resolve the caller + the organization they belong to.
 * Throws with a user-facing message when there is no organization.
 * Use this at the top of every org-scoped server action / query.
 */
export async function requireOrgContext(): Promise<OrgContext> {
  const session = await requireAuth();
  const user = await getOrLinkUserRecord(session);

  if (!user) {
    throw new Error("Account is not linked to an organization yet.");
  }
  if (!user.organizationId) {
    throw new Error("Set up your organization before continuing.");
  }

  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.id, user.organizationId),
  });

  if (!organization) {
    throw new Error("Organization not found.");
  }

  return { session, user, organization };
}

/** Restrict a server action to specific roles (e.g. ['owner']). */
export function assertRole(context: OrgContext, roles: Array<"owner" | "admin">) {
  const role = context.user.role as "owner" | "admin";
  if (!roles.includes(role)) {
    throw new Error("You do not have permission to perform this action.");
  }
}

/** Returns the caller's organization slug (throws if they have no org). */
export async function getUserOrganizationSlug(): Promise<string> {
  const { organization } = await requireOrgContext();
  return organization.slug;
}

/** Returns the caller's role in their org ("owner" | "admin"). */
export async function getCurrentUserRole(): Promise<"owner" | "admin"> {
  const { user } = await requireOrgContext();
  return (user.role as "owner" | "admin") ?? "owner";
}

export const PUBLIC_SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function publicOrgUrl(slug: string): string {
  return `${PUBLIC_SITE_URL}/give/${slug}`;
}

export function publicCampaignUrl(orgSlug: string, campaignSlug: string): string {
  return `${PUBLIC_SITE_URL}/give/${orgSlug}/${campaignSlug}`;
}

export function publicPaymentLinkUrl(orgSlug: string, linkSlug: string): string {
  return `${PUBLIC_SITE_URL}/give/${orgSlug}/link/${linkSlug}`;
}