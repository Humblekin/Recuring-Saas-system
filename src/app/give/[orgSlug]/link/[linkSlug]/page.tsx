import { db } from "@/lib/db";
import { organizations, paymentLinks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { GiveShell } from "@/components/give/GiveShell";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgSlug: string; linkSlug: string }>;
}) {
  const { orgSlug, linkSlug } = await params;
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, orgSlug),
    columns: { id: true, name: true },
  });
  const link = org
    ? await db.query.paymentLinks.findFirst({
        where: and(
          eq(paymentLinks.organizationId, org.id),
          eq(paymentLinks.slug, linkSlug)
        ),
        columns: { id: true, name: true },
      })
    : null;
  if (!org || !link) return { title: "Not found — Cowrie" };
  return { title: `${link.name} — ${org.name}`, description: `Give to ${link.name} on Cowrie.` };
}

export default async function GiveLinkPage({
  params,
}: {
  params: Promise<{ orgSlug: string; linkSlug: string }>;
}) {
  const { orgSlug, linkSlug } = await params;

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, orgSlug),
  });
  if (!org) notFound();

  const link = await db.query.paymentLinks.findFirst({
    where: and(
      eq(paymentLinks.organizationId, org.id),
      eq(paymentLinks.slug, linkSlug),
      eq(paymentLinks.isActive, true)
    ),
  });
  if (!link) notFound();

  const allLinks = await db.query.paymentLinks.findMany({
    where: and(
      eq(paymentLinks.organizationId, org.id),
      eq(paymentLinks.isActive, true)
    ),
    orderBy: (links, { asc }) => [asc(links.createdAt)],
  });

  return (
    <GiveShell
      org={org}
      links={allLinks.map((l) => ({
        id: l.id,
        name: l.name,
        slug: l.slug,
        description: l.description,
        amounts: l.amounts ?? [],
        oneTimeEnabled: Boolean(l.oneTimeEnabled),
        recurringEnabled: Boolean(l.recurringEnabled),
        frequencies: l.frequencies ?? [],
      }))}
      defaultLinkId={link.id}
    />
  );
}