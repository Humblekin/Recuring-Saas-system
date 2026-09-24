import { getOrganizationSettings, getPaymentConfigStatus } from "@/app/actions/settings";
import { SettingsClient } from "@/components/settings/SettingsClient";

export const metadata = { title: "Settings — Kivaro" };

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [settings, payments] = await Promise.all([
    getOrganizationSettings(),
    getPaymentConfigStatus(),
  ]);

  return (
    <SettingsClient
      org={settings.organization}
      user={settings.user}
      sessionUser={settings.sessionUser}
      payments={payments}
    />
  );
}