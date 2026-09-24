import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { organizations, users } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/server";
import { getOrLinkUserRecord } from "@/lib/auth/org";
import { eq } from "drizzle-orm";
import { cleanText, MAX_NAME } from "@/lib/security/sanitize";
import { getClientIp, isRateLimited } from "@/lib/security/rate-limit";

// =============================================================================
// ORGANIZATION PROVISIONING
// =============================================================================
// POST /api/organizations
//   { name, slug }            → create a new org owned by the caller
//   { inviteToken: string }   → join an existing org as an admin (team invites)
// Both upsert the caller into the `users` table (idempotent for re-logins).
//
// Invites are joined ONLY by the per-org `inviteToken` (a secret, random code).
// The org slug is public (it appears in every give URL) and is deliberately NOT
// accepted here — otherwise anyone could self-enroll into any organization.
// =============================================================================

function makeInviteToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function POST(req: NextRequest) {
  try {
    if (isRateLimited({ bucket: "org-provisioning", clientKey: await getClientIp(), limit: 20, windowMs: 60_000 })) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }
    const session = await requireAuth();
    const body = await req.json().catch(() => ({}));

    // Check whether the user is already attached to an org (idempotent).
    // getOrLinkUserRecord also re-links sessions whose Neon Auth id drifted
    // (auth project recreated) so an existing account isn't orphaned.
    const existingUser = await getOrLinkUserRecord(session);

    // --- Team invite: join an existing organization by secret token ---
    const inviteToken = body.inviteToken as string | undefined;
    if (inviteToken !== undefined) {
      if (
        typeof inviteToken !== "string" ||
        inviteToken.length < 8 ||
        inviteToken.length > 256
      ) {
        return NextResponse.json(
          { error: "This invite link is invalid or has been revoked." },
          { status: 400 }
        );
      }
    }
    if (typeof inviteToken === "string" && inviteToken.trim()) {
      const org = await db.query.organizations.findFirst({
        where: eq(organizations.inviteToken, inviteToken),
      });
      if (!org) {
        return NextResponse.json(
          { error: "This invite link is invalid or has been revoked." },
          { status: 404 }
        );
      }

      if (existingUser) {
        await db
          .update(users)
          .set({ organizationId: org.id, role: "admin" })
          .where(eq(users.id, existingUser.id));
      } else {
        await db.insert(users).values({
          neonAuthId: session.user.id,
          email: session.user.email,
          name: session.user.name || null,
          organizationId: org.id,
          role: "admin",
        });
      }

      return NextResponse.json({ org, joined: true });
    }

    // --- New organization ---
    const { name, slug } = body;
    const cleanName = cleanText(name, MAX_NAME);
    if (cleanName.length < 2) {
      return NextResponse.json(
        { error: "Organization name must be between 2 and 80 characters." },
        { status: 400 }
      );
    }
    if (
      typeof slug !== "string" ||
      !/^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/i.test(slug) ||
      slug.length > 50
    ) {
      return NextResponse.json(
        { error: "Slug must be 1–50 characters using letters, numbers, and hyphens only." },
        { status: 400 }
      );
    }

    let org;
    if (existingUser && existingUser.organizationId) {
      // User already has an org — return it instead of creating a duplicate.
      org = await db.query.organizations.findFirst({
        where: eq(organizations.id, existingUser.organizationId),
      });
      if (org) return NextResponse.json(org);
    }

    const [created] = await db
      .insert(organizations)
      .values({ name: cleanName, slug, inviteToken: makeInviteToken() })
      .returning();
    org = created;

    if (existingUser) {
      await db
        .update(users)
        .set({ organizationId: org.id, role: "owner", name: session.user.name || existingUser.name })
        .where(eq(users.id, existingUser.id));
    } else {
      await db.insert(users).values({
        neonAuthId: session.user.id,
        email: session.user.email,
        name: session.user.name || name,
        organizationId: org.id,
        role: "owner",
      });
    }

    return NextResponse.json(org);
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string };
    console.error("Failed to provision organization:", error);

    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err.code === "23505") {
      return NextResponse.json(
        { error: "Organization name or slug is already taken." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}