"use server";

import { db } from "@/lib/db";
import { paymentLinks, campaigns } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireOrgContext } from "@/lib/auth/org";
import { revalidatePath } from "next/cache";
import { RECURRING_FREQUENCIES, type RecurringFrequency } from "@/lib/constants";
import { cleanMultiline, cleanText, MAX_NAME } from "@/lib/security/sanitize";

// =============================================================================
// PAYMENT LINKS (CORE FEATURE)
// =============================================================================
// A payment link defines the public giving page contents: amounts, one-time /
// recurring toggles and frequencies. Amounts stored in pesewas.
// =============================================================================

function makeSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function getPaymentLinks() {
  const { organization } = await requireOrgContext();
  return db.query.paymentLinks.findMany({
    where: eq(paymentLinks.organizationId, organization.id),
    orderBy: (paymentLinks, { desc }) => [desc(paymentLinks.createdAt)],
  });
}

export async function getPaymentLink(id: string) {
  const { organization } = await requireOrgContext();
  return db.query.paymentLinks.findFirst({
    where: and(eq(paymentLinks.id, id), eq(paymentLinks.organizationId, organization.id)),
  });
}

export type CreatePaymentLinkInput = {
  name: string;
  description?: string;
  amounts: number[]; // in GHS major units, converted to pesewas on save
  oneTimeEnabled: boolean;
  recurringEnabled: boolean;
  frequencies: RecurringFrequency[];
};

export async function createPaymentLink(input: CreatePaymentLinkInput) {
  const { organization } = await requireOrgContext();

  const name = cleanText(input.name, MAX_NAME);
  if (!name) throw new Error("Give your payment link a name.");

  const slug = makeSlug(name);
  if (!slug) throw new Error("Name must include letters or numbers.");

  const amounts = (input.amounts || [])
    .map((a) => Math.round(Number(a) * 100))
    .filter((a) => Number.isFinite(a) && a > 0);

  const frequencies = (input.frequencies || [])
    .filter((f): f is RecurringFrequency =>
      (RECURRING_FREQUENCIES as readonly string[]).includes(f)
    );

  const oneTimeEnabled = Boolean(input.oneTimeEnabled);
  const recurringEnabled = Boolean(input.recurringEnabled);
  if (!oneTimeEnabled && !recurringEnabled) {
    throw new Error("Enable one-time or recurring payments (at least one).");
  }
  if (recurringEnabled && frequencies.length === 0) {
    throw new Error("Pick at least one recurring frequency.");
  }

  try {
    const inserted = await db
      .insert(paymentLinks)
      .values({
        organizationId: organization.id,
        name,
        slug,
        description: input.description ? cleanMultiline(input.description) || null : null,
        amounts,
        oneTimeEnabled,
        recurringEnabled,
        frequencies,
        isActive: true,
      })
      .returning();

    revalidatePath("/dashboard/payment-links");
    return inserted[0];
  } catch (err) {
    if ((err as { code?: string })?.code === "23505") {
      throw new Error("A payment link with this name already exists.");
    }
    throw new Error("Failed to create payment link.");
  }
}

export type UpdatePaymentLinkInput = Partial<CreatePaymentLinkInput>;

export async function updatePaymentLink(id: string, input: UpdatePaymentLinkInput) {
  const { organization } = await requireOrgContext();

  const existing = await db.query.paymentLinks.findFirst({
    where: and(eq(paymentLinks.id, id), eq(paymentLinks.organizationId, organization.id)),
  });
  if (!existing) throw new Error("Payment link not found.");

  const set: Partial<typeof paymentLinks.$inferInsert> = {};

  if (input.name != null) {
    const name = cleanText(input.name, MAX_NAME);
    if (!name) throw new Error("Payment link name is required.");
    set.name = name;
    const slug = makeSlug(name);
    if (slug) set.slug = slug;
  }
  if (input.description != null) {
    set.description = cleanMultiline(input.description) || null;
  }
  if (input.amounts != null) {
    set.amounts = input.amounts
      .map((a) => Math.round(Number(a) * 100))
      .filter((a) => Number.isFinite(a) && a > 0);
  }
  if (input.oneTimeEnabled != null) set.oneTimeEnabled = Boolean(input.oneTimeEnabled);
  if (input.recurringEnabled != null) set.recurringEnabled = Boolean(input.recurringEnabled);
  if (input.frequencies != null) {
    set.frequencies = input.frequencies.filter((f) =>
      (RECURRING_FREQUENCIES as readonly string[]).includes(f)
    );
  }

  try {
    await db.update(paymentLinks).set({ ...set, updatedAt: new Date() }).where(eq(paymentLinks.id, id));
    revalidatePath("/dashboard/payment-links");
    return { success: true };
  } catch (err) {
    if ((err as { code?: string })?.code === "23505") {
      throw new Error("A payment link with this name already exists.");
    }
    throw new Error("Failed to update payment link.");
  }
}

export async function togglePaymentLink(id: string) {
  const { organization } = await requireOrgContext();
  const existing = await db.query.paymentLinks.findFirst({
    where: and(eq(paymentLinks.id, id), eq(paymentLinks.organizationId, organization.id)),
  });
  if (!existing) throw new Error("Payment link not found.");

  await db
    .update(paymentLinks)
    .set({ isActive: !existing.isActive, updatedAt: new Date() })
    .where(eq(paymentLinks.id, id));

  revalidatePath("/dashboard/payment-links");
  return { success: true, isActive: !existing.isActive };
}

export async function deletePaymentLink(id: string) {
  const { organization } = await requireOrgContext();

  const existing = await db.query.paymentLinks.findFirst({
    where: and(eq(paymentLinks.id, id), eq(paymentLinks.organizationId, organization.id)),
  });
  if (!existing) throw new Error("Payment link not found.");

  // Campaigns referencing this link fall back to no link (campaign keeps working).
  await db
    .update(campaigns)
    .set({ paymentLinkId: null })
    .where(eq(campaigns.paymentLinkId, id));

  await db.delete(paymentLinks).where(eq(paymentLinks.id, id));
  revalidatePath("/dashboard/payment-links");
  return { success: true };
}

/** Public lookup used by the /give pages. Not behind the dashboard guard. */
export async function getActivePaymentLinksForOrg(organizationId: string) {
  return db.query.paymentLinks.findMany({
    where: and(
      eq(paymentLinks.organizationId, organizationId),
      eq(paymentLinks.isActive, true)
    ),
    orderBy: (paymentLinks, { asc }) => [asc(paymentLinks.createdAt)],
  });
}