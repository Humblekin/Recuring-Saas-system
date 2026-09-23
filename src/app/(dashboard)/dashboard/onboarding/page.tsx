import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/server";
import { getOrganizationSettings } from "@/app/actions/settings";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

export const metadata = { title: "Set up your organization — Cowrie" };

export default async function OnboardingPage() {
  const session = await requireAuth();

  const user = await db.query.users.findFirst({
    where: eq(users.neonAuthId, session.user.id),
    columns: { id: true, organizationId: true },
  });

  // Auth account exists but is not attached to an organization yet. They must
  // create one or accept a team invite on /register first — otherwise
  // getOrganizationSettings() below would throw "forbidden" and the dashboard
  // layout would send them right back here in a redirect loop.
  if (!user || !user.organizationId) {
    redirect("/register");
  }

  const { organization, user: profile } = await getOrganizationSettings();

  return <OnboardingFlow organization={organization} userName={profile.name || ""} />;
}