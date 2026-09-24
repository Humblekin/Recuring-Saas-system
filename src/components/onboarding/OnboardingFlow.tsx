"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateOrganizationSettings,
  getPaymentConfigStatus,
} from "@/app/actions/settings";
import { organizationTypeOptions } from "@/lib/constants";
import { createPaymentLink } from "@/app/actions/payment-links";
import { ShareModal } from "@/components/share/ShareModal";
import { LogoMark, CheckIcon } from "@/components/ui/icons";
import { errorMessage } from "@/lib/utils";

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
};

type Step = "profile" | "payments" | "link";

export function OnboardingFlow({
  organization,
  userName,
}: {
  organization: OrgShape;
  userName: string;
}) {
  const router = useRouter();

  const [step, setStep] = useState<Step>("profile");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Profile fields
  const [name, setName] = useState(organization.name || orgInitialName(userName, organization.name) || "");
  const [description, setDescription] = useState(organization.description || "");
  const [type, setType] = useState(organization.type || "other");
  const [country, setCountry] = useState(organization.country || "");
  const [phone, setPhone] = useState(organization.phone || "");
  const [website, setWebsite] = useState(organization.website || "");

  // Payment config
  const [payMode, setPayMode] = useState<"checking" | "ok" | "error">("checking");
  const [payError, setPayError] = useState("");

  // First link
  const [linkUrl, setLinkUrl] = useState("");
  const [showShare, setShowShare] = useState(false);

  async function saveProfile(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError("");
    try {
      await updateOrganizationSettings({
        name,
        description,
        type,
        country,
        phone,
        website,
      });
      setStep("payments");
      checkPayments();
    } catch (err: unknown) {
      setError(errorMessage(err, "Could not save your profile."));
    } finally {
      setBusy(false);
    }
  }

  async function checkPayments() {
    setPayMode("checking");
    try {
      const status = await getPaymentConfigStatus();
      if (status.configured) {
        setPayMode("ok");
      } else {
        setPayMode("error");
        setPayError(status.error || "Payment configuration is incomplete.");
      }
    } catch (err: unknown) {
      setPayMode("error");
      setPayError(errorMessage(err, "Could not check payment configuration."));
    }
  }

  async function createFirstLink() {
    setBusy(true);
    setError("");
    try {
      const link = await createPaymentLink({
        name: "General donations",
        description: "Support our work with a one-time gift or a recurring contribution.",
        amounts: [10, 20, 50, 100],
        oneTimeEnabled: true,
        recurringEnabled: true,
        frequencies: ["weekly", "monthly", "yearly"],
      });
      const base = window.location.origin;
      setLinkUrl(`${base}/give/${organization.slug}/link/${link.slug}`);
      setStep("link");
    } catch (err: unknown) {
      setError(errorMessage(err, "Could not create your payment link."));
    } finally {
      setBusy(false);
    }
  }

  function finish() {
    router.push("/dashboard");
    router.refresh();
  }

  const steps = [
    { key: "profile" as Step, label: "Profile" },
    { key: "payments" as Step, label: "Payments" },
    { key: "link" as Step, label: "First link" },
  ];
  const activeIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-ink rounded-md flex items-center justify-center text-cream">
            <LogoMark size={16} />
          </div>
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <span key={s.key} className="flex items-center gap-2 text-xs">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    i < activeIndex
                      ? "bg-green-100 text-green-700"
                      : i === activeIndex
                      ? "bg-ink text-cream"
                      : "bg-border text-ink-muted"
                  }`}
                >
                  {i < activeIndex ? <CheckIcon size={12} /> : i + 1}
                </span>
                <span className={i === activeIndex ? "text-ink font-medium" : "text-ink-muted"}>
                  {s.label}
                </span>
                {i < steps.length - 1 && <span className="w-4 h-px bg-border" />}
              </span>
            ))}
          </div>
        </div>

        <h2 className="text-2xl font-medium" style={{ fontFamily: "var(--font-display)" }}>
          {step === "profile" && "Tell us about your organization"}
          {step === "payments" && "Connect your payments"}
          {step === "link" && "Get your first payment link"}
        </h2>
        <p className="text-ink-muted mt-1">
          {step === "profile" && "A complete profile builds supporter trust."}
          {step === "payments" && "Kivaro collects through MTN Mobile Money. Add the MTN MoMo API credentials on the server to start accepting payments."}
          {step === "link" && "Share it anywhere. Supporters give in two taps."}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {step === "profile" && (
        <form onSubmit={saveProfile} className="bg-surface border border-border p-6 sm:p-8 rounded-2xl flex flex-col gap-5">
          <div>
            <label htmlFor="onb-name" className="block text-sm font-medium mb-1.5">Organization name</label>
            <input id="onb-name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="onb-desc" className="block text-sm font-medium mb-1.5">Description</label>
            <textarea id="onb-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does your organization do?" className={`${inputClass} resize-none`} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="onb-type" className="block text-sm font-medium mb-1.5">Organization type</label>
              <select id="onb-type" value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
                {organizationTypeOptions.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="onb-country" className="block text-sm font-medium mb-1.5">Country</label>
              <input id="onb-country" type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. Ghana" className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="onb-phone" className="block text-sm font-medium mb-1.5">Phone</label>
              <input id="onb-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+233..." className={inputClass} />
            </div>
            <div>
              <label htmlFor="onb-website" className="block text-sm font-medium mb-1.5">Website</label>
              <input id="onb-website" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" className={inputClass} />
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">
              {busy ? "Saving…" : "Continue to payments"}
            </button>
          </div>
        </form>
      )}

      {step === "payments" && (
        <div className="bg-surface border border-border p-6 sm:p-8 rounded-2xl flex flex-col gap-5">
          {payMode === "checking" && (
            <div className="text-sm text-ink-muted">Checking your MTN Mobile Money configuration…</div>
          )}
          {payMode === "ok" && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm">
              <p className="font-medium mb-1">MTN Mobile Money is connected.</p>
              <p>You&apos;re ready to collect one-time and recurring payments.</p>
            </div>
          )}
          {payMode === "error" && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-sm">
              <p className="font-medium mb-1">Payments need configuration</p>
              <p>{payError}</p>
              <p className="mt-2 text-yellow-700">
                Add <code className="font-mono">MTN_API_USER</code>,{" "}
                <code className="font-mono">MTN_API_KEY</code>,{" "}
                <code className="font-mono">MTN_COLLECTION_PRIMARY_KEY</code> and{" "}
                <code className="font-mono">MTN_TARGET_ENVIRONMENT</code> to your environment
                variables, set the callback URL to <code className="font-mono">/api/webhooks/mtn</code>,
                restart the server, then continue.
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-border flex justify-end gap-3">
            {payMode !== "checking" && (
              <button onClick={checkPayments} className="px-6 py-3 rounded-xl border border-border text-ink hover:bg-cream transition-colors font-medium text-sm">
                Re-check
              </button>
            )}
            <button
              onClick={() => {
                if (payMode === "error") {
                  router.push("/dashboard/settings");
                  return;
                }
                setStep("link");
              }}
              disabled={payMode === "checking"}
              className="btn-primary disabled:opacity-50"
            >
              {payMode === "error" ? "Open settings" : "Continue to your first link"}
            </button>
          </div>
        </div>
      )}

      {step === "link" && (
        <div className="bg-surface border border-border p-6 sm:p-8 rounded-2xl flex flex-col gap-5">
          {linkUrl ? (
            <>
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
                <p className="font-medium mb-1">Done! Your payment link is ready.</p>
                <code className="font-mono break-all block mt-2">{linkUrl}</code>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => setShowShare(true)} className="btn-primary">
                  Share & QR code
                </button>
                <button onClick={finish} className="px-6 py-3 rounded-xl border border-border text-ink hover:bg-cream transition-colors font-medium text-sm">
                  Go to dashboard
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-ink-muted">
                Create a “General donations” payment link. Supporters will be able to give
                one-time or recurring amounts right away.
              </p>
              <div className="pt-4 border-t border-border flex justify-end">
                <button onClick={createFirstLink} disabled={busy} className="btn-primary disabled:opacity-50">
                  {busy ? "Creating…" : "Create payment link"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {showShare && linkUrl && (
        <ShareModal url={linkUrl} title="General donations" onClose={() => setShowShare(false)} />
      )}
    </div>
  );
}

const inputClass =
  "w-full p-3 rounded-xl border border-border bg-surface focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink transition-all text-sm";

function orgInitialName(userName: string, orgName: string): string {
  return orgName || userName || "";
}