"use server";

import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { users, organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireOrgContext, assertRole, PUBLIC_SITE_URL } from "@/lib/auth/org";
import { revalidatePath } from "next/cache";

// =============================================================================
// TEAM — members of an organization
// =============================================================================
// A user belongs to an organization via `users.organizationId` with a role of
// 'owner' or 'admin'. Owners can invite/change roles. Invites use a per-org
// secret `inviteToken` (NOT the org slug, which is public in every give URL):
//   ${NEXT_PUBLIC_APP_URL}/register?invite=<token>
// Accounts created from a shared invite link join the org as admins on signup
// (see /api/organizations).

function makeInviteToken(): string {
  return randomBytes(24).toString("base64url");
}

/**
 * Return (creating on demand) the organization's secret invite token. Every
 * org gets one the first time the team page is viewed, so existing
 * organizations work without needing a manual backfill.
 */
async function ensureInviteToken(organizationId: string): Promise<string> {
  let org = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
    columns: { inviteToken: true },
  });

  if (!org?.inviteToken) {
    // Set NOT NULL-safe: ignore a rare concurrent race via on conflict target.
    const token = makeInviteToken();
    const updated = await db
      .update(organizations)
      .set({ inviteToken: token, updatedAt: new Date() })
      .where(eq(organizations.id, organizationId))
      .returning({ inviteToken: organizations.inviteToken });
    org = { inviteToken: updated[0]?.inviteToken ?? token };
  }

  return org.inviteToken!;
}

export async function getTeamMembers() {
  const { organization, user } = await requireOrgContext();

  const inviteToken = await ensureInviteToken(organization.id);

  const members = await db.query.users.findMany({
    where: eq(users.organizationId, organization.id),
    columns: { id: true, neonAuthId: true, email: true, name: true, role: true, createdAt: true },
    orderBy: (users, { asc }) => [asc(users.createdAt)],
  });

  return {
    members,
    currentUserId: user.id,
    role: (user.role as "owner" | "admin") ?? "owner",
    inviteUrl: `${PUBLIC_SITE_URL}/register?invite=${inviteToken}`,
  };
}

export async function setMemberRole(memberId: string, role: "owner" | "admin") {
  const ctx = await requireOrgContext();
  assertRole(ctx, ["owner"]);

  const member = await db.query.users.findFirst({
    where: eq(users.id, memberId),
  });
  if (!member || member.organizationId !== ctx.organization.id) {
    throw new Error("Member not found in this organization.");
  }

  if (!["owner", "admin"].includes(role)) {
    throw new Error("Invalid role.");
  }

  await db.update(users).set({ role }).where(eq(users.id, memberId));
  revalidatePath("/dashboard/team");
  return { success: true };
}

export async function removeMember(memberId: string) {
  const ctx = await requireOrgContext();
  assertRole(ctx, ["owner"]);

  if (memberId === ctx.user.id) {
    throw new Error("You cannot remove yourself. Delete the organization instead.");
  }

  const member = await db.query.users.findFirst({
    where: eq(users.id, memberId),
  });
  if (!member || member.organizationId !== ctx.organization.id) {
    throw new Error("Member not found in this organization.");
  }
  if (member.role === "owner") {
    throw new Error("Owners cannot be removed by another member.");
  }

  await db.update(users).set({ organizationId: null, role: "owner" }).where(eq(users.id, memberId));
  revalidatePath("/dashboard/team");
  return { success: true };
}