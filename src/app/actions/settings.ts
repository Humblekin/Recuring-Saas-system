"use server";

import { db } from "@/lib/db";
import { organizations, users, paymentLinks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireOrgContext } from "@/lib/auth/org";
import { revalidatePath } from "next/cache";
import { mtnConfigMissing, mtnConfigWarnings, testMtnConfig } from "@/lib/mtn";
import {
  cleanEmail,
  cleanMultiline,
  cleanOptional,
  cleanText,
  cleanUrl,
  MAX_EMAIL,
  MAX_NAME,
  MAX_PHONE,
  MAX_TITLE,
} from "@/lib/security/sanitize";


// =============================================================================
// SETTINGS — organization profile, payment configuration, account details
// =============================================================================

export async function getOrganizationSettings() {
  const ctx = await requireOrgContext();
  return { organization: ctx.organization, user: ctx.user, sessionUser: ctx.session.user };
}

export async function updateOrganizationSettings(data: {
  name?: string;
  description?: string;
  slug?: string;
  type?: string;
  email?: string;
  phone?: string;
  country?: string;
  website?: string;
}) {
  const { organization } = await requireOrgContext();

  const set: Partial<typeof organizations.$inferInsert> = { updatedAt: new Date() };

  if (data.name != null) {
    const name = cleanText(data.name, MAX_TITLE);
    if (!name) throw new Error("Organization name is required.");
    set.name = name;
  }
  if (data.description != null) {
    set.description = cleanMultiline(data.description) || null;
  }
  if (data.website != null) {
    const website = cleanUrl(data.website);
    if (data.website.trim() && !website) {
      throw new Error("Website must be a valid http(s) URL.");
    }
    set.website = website;
  }
  if (data.email != null) {
    const email = cleanEmail(data.email).slice(0, MAX_EMAIL);
    if (email && !email.includes("@")) throw new Error("Please provide a valid email.");
    set.email = email || null;
  }
  if (data.phone != null) set.phone = cleanOptional(data.phone, MAX_PHONE);
  if (data.country != null) set.country = cleanOptional(data.country, MAX_NAME);
  if (data.type != null) set.type = cleanOptional(data.type, MAX_NAME);

  if (data.slug != null && data.slug.trim() !== organization.slug) {
    const cleanSlug = data.slug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);
    if (!cleanSlug) throw new Error("Slug must include letters or numbers.");
    if (cleanSlug !== organization.slug) {
      const taken = await db.query.organizations.findFirst({
        where: eq(organizations.slug, cleanSlug),
      });
      if (taken) throw new Error("That slug is already taken by another organization.");
      set.slug = cleanSlug;
    }
  }

  try {
    await db.update(organizations).set(set).where(eq(organizations.id, organization.id));
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/onboarding");
    return { success: true };
  } catch (err) {
    if ((err as { code?: string })?.code === "23505") {
      throw new Error("That slug is already taken by another organization.");
    }
    throw new Error("Failed to update settings.");
  }
}

export async function updateProfile(data: { name: string }) {
  const { user } = await requireOrgContext();
  const name = cleanText(data.name, MAX_NAME);
  if (!name) throw new Error("Name is required.");
  await db.update(users).set({ name }).where(eq(users.id, user.id));
  revalidatePath("/dashboard/settings");
  return { success: true };
}

/**
 * Verify the MTN MoMo collection configuration is live. Used by onboarding
 * and the Settings → Payments panel. Returns a readable error when the
 * required environment variables are missing or credentials are rejected.
 */
export async function getPaymentConfigStatus() {
  const { organization } = await requireOrgContext();

  const missing = mtnConfigMissing();
  const hasSecretKey = missing.length === 0;
  const mode: "live" | "test" | null = hasSecretKey
    ? process.env.MTN_MODE === "production"
      ? "live"
      : "test"
    : null;
  let error: string | null = hasSecretKey
    ? null
    : `Missing environment variables: ${missing.join(", ")}.`;

  if (hasSecretKey && process.env.MTN_MODE !== "production") {
    // Probe the sandbox token endpoint so onboarding only reports "connected"
    // when the credentials genuinely work.
    const probe = await testMtnConfig();
    if (!probe.ok) {
      error = probe.error || "MTN MoMo credentials were rejected.";
    }
  }

  const links = await db.query.paymentLinks.findMany({
    where: eq(paymentLinks.organizationId, organization.id),
    columns: { id: true },
  });

  // Non-blocking misconfiguration (localhost callback, no payee MSISDN). These
  // do not stop payments working, so they are surfaced as warnings rather than
  // folded into `error` — an operator needs to see them, but reporting the
  // integration as broken would be wrong.
  const warnings = mtnConfigWarnings();

  return {
    configured: hasSecretKey && mode != null && !error,
    mode,
    error,
    warnings,
    hasPaymentLinks: links.length > 0,
  };
}