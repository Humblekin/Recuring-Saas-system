import { db } from "@/lib/db";
import { organizations, paymentLinks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { GiveShell } from "@/components/give/GiveShell";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, orgSlug),
    columns: { name: true, description: true },
  });
  if (!org) return { title: "Not found — Cowrie" };
  return {
    title: `Giving to ${org.name} — Cowrie`,
    description: org.description || `Support ${org.name} on Cowrie.`,
  };
}

export default async function GiveOrgPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, orgSlug),
  });
  if (!org) notFound();

  const orgLinks = await db.query.paymentLinks.findMany({
    where: and(
      eq(paymentLinks.organizationId, org.id),
      eq(paymentLinks.isActive, true)
    ),
    orderBy: (links, { asc }) => [asc(links.createdAt)],
  });

  return (
    <GiveShell
      org={org}
      links={orgLinks.map((l) => ({
        id: l.id,
        name: l.name,
        slug: l.slug,
        description: l.description,
        amounts: l.amounts ?? [],
        oneTimeEnabled: Boolean(l.oneTimeEnabled),
        recurringEnabled: Boolean(l.recurringEnabled),
        frequencies: l.frequencies ?? [],
      }))}
    />
  );
}