"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateOrganizationSettings,
  updateProfile,
} from "@/app/actions/settings";
import { organizationTypeOptions } from "@/lib/constants";
import { isGoogleSignInEnabled } from "@/lib/auth/client";
import { CopyButton } from "@/components/ui/CopyButton";
import { cn, errorMessage } from "@/lib/utils";

type Tab = "profile" | "payments" | "account";

type OrgShape = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  website: string | null;
  primaryColor: string | null;
};

export function SettingsClient({
  org,
  user,
  sessionUser,
  payments,
}: {
  org: OrgShape;
  user: { id: string; name: string | null; email: string; role: string | null };
  sessionUser: { email?: string | null; emailVerified?: boolean | null };
  payments: { configured: boolean; mode: "live" | "test" | null; error: string | null; hasPaymentLinks: boolean };
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("profile");

  const googleEnabled = isGoogleSignInEnabled();

  // Profile form state
  const [name, setName] = useState(org.name);
  const [slug, setSlug] = useState(org.slug);
  const [description, setDescription] = useState(org.description || "");
  const [type, setType] = useState(org.type || "");
  const [email, setEmail] = useState(org.email || "");
  const [phone, setPhone] = useState(org.phone || "");
  const [country, setCountry] = useState(org.country || "");
  const [website, setWebsite] = useState(org.website || "");

  // Account form state
  const [yourName, setYourName] = useState(user.name || "");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function notify(type: "success" | "error", text: string) {
    setMessage({ type, text });
    window.setTimeout(() => setMessage(null), 4000);
  }

  async function handleOrgSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await updateOrganizationSettings({ name, description, slug, type, email, phone, country, website });
      notify("success", "Organization saved.");
      router.refresh();
    } catch (err) {
      notify("error", errorMessage(err, "Failed to save."));
    } finally {
      setSaving(false);
    }
  }

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await updateProfile({ name: yourName });
      notify("success", "Profile saved.");
      router.refresh();
    } catch (err) {
      notify("error", errorMessage(err, "Failed to save."));
    } finally {
      setSaving(false);
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "profile", label: "Organization" },
    { id: "payments", label: "Payments" },
    { id: "account", label: "Account" },
  ];

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-medium" style={{ fontFamily: "var(--font-display)" }}>
          Settings
        </h2>
        <p className="text-ink-muted mt-1">Manage your organization, payments, and account.</p>
      </div>

      <div className="flex gap-2 mb-8 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-colors border",
              tab === t.id ? "border-ink bg-ink text-cream" : "border-border bg-surface text-ink hover:border-ink"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {message && (
        <div
          className={cn(
            "mb-6 p-4 border rounded-xl text-sm",
            message.type === "error"
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-green-50 border-green-200 text-green-700"
          )}
        >
          {message.text}
        </div>
      )}

      {tab === "profile" && (
        <form onSubmit={handleOrgSubmit} className="bg-surface border border-border p-6 sm:p-8 rounded-2xl flex flex-col gap-6">
          <div>
            <label htmlFor="org-name" className="block text-sm font-medium mb-1.5">Organization name</label>
            <input id="org-name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label htmlFor="org-slug" className="block text-sm font-medium mb-1.5">Public URL slug</label>
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <span className="text-sm font-mono text-ink-muted bg-cream px-3 py-3 border border-border rounded-xl">
                kivaro/give/
              </span>
              <input id="org-slug" type="text" required value={slug} onChange={(e) => setSlug(e.target.value)} className={`${inputClass} font-mono`} />
            </div>
            <p className="text-xs text-ink-muted mt-2">Changing this breaks existing links and QR codes.</p>
          </div>

          <div>
            <label htmlFor="org-type" className="block text-sm font-medium mb-1.5">Organization type</label>
            <select id="org-type" value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
              <option value="">Select a type…</option>
              {organizationTypeOptions.map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="org-desc" className="block text-sm font-medium mb-1.5">Description</label>
            <textarea id="org-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tells supporters what you do (shown on your public page)." className={`${inputClass} resize-none`} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="org-email" className="block text-sm font-medium mb-1.5">Contact email</label>
              <input id="org-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="org-phone" className="block text-sm font-medium mb-1.5">Phone</label>
              <input id="org-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="org-country" className="block text-sm font-medium mb-1.5">Country</label>
              <input id="org-country" type="text" value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="org-website" className="block text-sm font-medium mb-1.5">Website</label>
              <input id="org-website" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" className={inputClass} />
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
              {saving ? "Saving…" : "Save organization"}
            </button>
          </div>
        </form>
      )}

      {tab === "payments" && (
        <div className="bg-surface border border-border p-6 sm:p-8 rounded-2xl flex flex-col gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2">MTN Mobile Money configuration</h3>
            <p className="text-sm text-ink-muted">
              Payments are collected through the MTN MoMo Collection API. Credentials are configured on the server (
              <code className="text-xs bg-cream border border-border px-1.5 py-0.5 rounded">MTN_COLLECTION_PRIMARY_KEY</code>,{" "}
              <code className="text-xs bg-cream border border-border px-1.5 py-0.5 rounded">MTN_API_USER</code>,{" "}
              <code className="text-xs bg-cream border border-border px-1.5 py-0.5 rounded">MTN_API_KEY</code>) — they never reach the browser.
            </p>
          </div>

          <div className={cn("p-4 rounded-xl border text-sm", payments.configured ? "bg-success/10 border-success/30 text-success" : "bg-warning/10 border-warning/30 text-warning")}>
            {payments.configured ? (
              <>MTN MoMo is connected (<strong>{payments.mode}</strong> mode). Set the collection callback URL to{" "}
                <code className="text-xs bg-surface border border-border px-1.5 py-0.5 rounded">https://&lt;your-domain&gt;/api/webhooks/mtn</code>{" "}
                in the MTN MoMo developer portal to receive payment notifications.</>
            ) : (
              <>
                Payment processing is not set up yet. {payments.error || "Add MTN MoMo credentials to continue."}{" "}
                Webhook URL: <code className="text-xs bg-surface border border-border px-1.5 py-0.5 rounded">https://&lt;your-domain&gt;/api/webhooks/mtn</code>
              </>
            )}
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-between">
            <div>
              <div className="text-sm font-medium mb-0.5">Your public giving page</div>
              <div className="text-xs text-ink-muted">Share this to collect donations.</div>
            </div>
            <div className="flex items-center gap-3 min-w-0">
              <code className="text-xs text-ink-muted bg-cream border border-border px-3 py-2 rounded-lg truncate flex-1 min-w-0 max-w-[260px]">
                {`${window.location.origin}/give/${slug}`}
              </code>
              <CopyButton text={`${window.location.origin}/give/${slug}`} label="URL" />
            </div>
          </div>
        </div>
      )}

      {tab === "account" && (
        <div className="flex flex-col gap-6">
          <form onSubmit={handleProfileSubmit} className="bg-surface border border-border p-6 sm:p-8 rounded-2xl flex flex-col gap-6">
            <div>
              <h3 className="text-lg font-medium mb-1">Your profile</h3>
              <p className="text-sm text-ink-muted mb-4">Shown to your team and on receipts.</p>
            </div>
            <div>
              <label htmlFor="your-name" className="block text-sm font-medium mb-1.5">Display name</label>
              <input id="your-name" type="text" required value={yourName} onChange={(e) => setYourName(e.target.value)} className={inputClass} />
            </div>
            <div className="pt-4 border-t border-border">
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                {saving ? "Saving…" : "Save profile"}
              </button>
            </div>
          </form>

          <div className="bg-surface border border-border p-6 sm:p-8 rounded-2xl flex flex-col gap-4">
            <h3 className="text-lg font-medium">Signed in</h3>
            <div className="text-sm text-ink-muted">{sessionUser.email || user.email}</div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Email verification</span>
                {sessionUser.emailVerified === true ? (
                  <span className="text-xs font-medium text-green-600">Verified</span>
                ) : (
                  <span className="text-xs font-medium text-yellow-600">Pending — check your inbox</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Password login</span>
                <span className="text-xs text-ink-muted">Use the login page to reset your password</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Google sign-in</span>
                <span className={cn("text-xs font-medium", googleEnabled ? "text-green-600" : "text-ink-muted")}>
                  {googleEnabled ? "Enabled" : "Not enabled"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputClass =
  "w-full p-3 rounded-xl border border-border bg-surface focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink transition-all text-sm";