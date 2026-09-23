import crypto from "node:crypto";

// =============================================================================
// MTN MOBILE MONEY — COLLECTION API (server-side)
// =============================================================================
// Thin, typo-safe wrapper around the official MTN MoMo Collection product:
//   POST /collection/token/                                  → access token
//   POST /collection/v1_0/requesttopay                       → one-time charge
//   GET  /collection/v1_0/requesttopay/{referenceId}         → payment status
//   POST /collection/v1_0/preapproval                        → recurring consent
//   GET  /collection/v1_0/preapproval/{id}                   → pre-approval status
//   POST /collection/v1_0/preapproval/{id}/requesttopay      → auto-debit a payer
//   DELETE /collection/v1_0/preapproval/{id}                 → revoke consent
//
// Environment variables (see .env.example):
//   MTN_MODE                     "sandbox" | "production"
//   MTN_API_BASE_URL             override (defaults per mode)
//   MTN_TARGET_ENVIRONMENT       "sandbox" or MTN market code e.g. "mtnghana"
//   MTN_COLLECTION_PRIMARY_KEY   Ocp-Apim-Subscription-Key from the portal
//   MTN_API_USER                 sandbox: generated / prod: from portal
//   MTN_API_KEY                  sandbox: generated / prod: from portal
//   MTN_PAYEE_MSISDN             org's fund-settlement mobile number (country code form)
//   MTN_CURRENCY                 "GHS" (default). Sandbox transparently uses EUR.
//
// NOTE: the MTN sandbox wallet only accepts EUR (a request with GHS is
// rejected with INVALID_CURRENCY). Cowrie stays "always GHS" product-facing:
// the DB and UI use GHS, and only the sandbox wire request is mapped to EUR.
// Production honours MTN_CURRENCY (GHS). Amounts map 1:1.
//
// MTN callbacks are NOT cryptographically signed. Keep the webhook URL secret.
// =============================================================================

export type MtnMode = "sandbox" | "production";
export type MtnPaymentStatus = "PENDING" | "SUCCESSFUL" | "FAILED" | "REJECTED";

export class MtnApiError extends Error {
  status: number;
  body: string;

  constructor(message: string, status: number, body: string) {
    super(message);
    this.name = "MtnApiError";
    this.status = status;
    this.body = body;
  }
}

export type MtnConfig = {
  mode: MtnMode;
  baseUrl: string;
  targetEnvironment: string;
  primaryKey: string;
  apiUser: string;
  apiKey: string;
  payeeMsisdn: string;
  currency: string;
  callbackUrl: string;
};

export function mtnConfig(): MtnConfig {
  const mode: MtnMode = process.env.MTN_MODE === "production" ? "production" : "sandbox";
  const defaultBase =
    mode === "production" ? "https://proxy.momoapi.mtn.com" : "https://sandbox.momodeveloper.mtn.com";
  return {
    mode,
    baseUrl: (process.env.MTN_API_BASE_URL || defaultBase).replace(/\/+$/, ""),
    targetEnvironment: process.env.MTN_TARGET_ENVIRONMENT || (mode === "sandbox" ? "sandbox" : "mtnghana"),
    primaryKey: process.env.MTN_COLLECTION_PRIMARY_KEY || "",
    apiUser: process.env.MTN_API_USER || "",
    apiKey: process.env.MTN_API_KEY || "",
    payeeMsisdn: process.env.MTN_PAYEE_MSISDN || "",
    currency: process.env.MTN_CURRENCY || "GHS",
    callbackUrl: process.env.MTN_CALLBACK_URL || "",
  };
}

export function mtnConfigMissing(): string[] {
  const missing: string[] = [];
  const m = mtnConfig();
  if (!m.primaryKey) missing.push("MTN_COLLECTION_PRIMARY_KEY");
  if (!m.apiUser) missing.push("MTN_API_USER");
  if (!m.apiKey) missing.push("MTN_API_KEY");
  if (!m.targetEnvironment) missing.push("MTN_TARGET_ENVIRONMENT");
  return missing;
}

/** Normalize user-entered MSISDN to the format MTN expects (233xxxxxxxxx). */
export function normalizeMsisdn(value: string): string {
  let digits = value.replace(/\D+/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = "233" + digits.slice(1);
  if (!digits.startsWith("233")) digits = "233" + digits;
  return digits;
}

export function isValidMsisdn(value: string): boolean {
  const d = value.replace(/\D+/g, "");
  // Accept "02xxxxxxxxx", "233xxxxxxxxx", "+233xxxxxxxxx".
  return d.length === 12 && d.startsWith("233");
}

/** Format minor units (pesewas) as a major-unit string MTN accepts ("10", "10.50"). */
export function toMtnMajor(amountMinor: number): string {
  const major = amountMinor / 100;
  return Number.isInteger(major) ? String(major) : major.toFixed(2);
}

/** Map an MTN status to Cowrie's payment status. */
export function mtnStatusToLocal(status: string): "success" | "failed" | "pending" {
  if (status === "SUCCESSFUL") return "success";
  if (status === "FAILED" || status === "REJECTED" || status === "CANCELLED" || status === "TIMEOUT") return "failed";
  return "pending";
}

// --- Auth ---

let accessTokenCache: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const cfg = mtnConfig();
  if (accessTokenCache && accessTokenCache.expiresAt > Date.now() + 30_000) {
    return accessTokenCache.token;
  }

  const res = await fetch(`${cfg.baseUrl}/collection/token/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${cfg.apiUser}:${cfg.apiKey}`).toString("base64")}`,
      "Ocp-Apim-Subscription-Key": cfg.primaryKey,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new MtnApiError(`MTN token request failed (${res.status})`, res.status, await res.text());
  }

  const data = (await res.json()) as { access_token: string; expires_in?: number };
  // Default 1 hour; expire slightly early so concurrent calls re-fetch safely.
  const expiresIn = (data.expires_in || 3600) * 1000;
  accessTokenCache = { token: data.access_token, expiresAt: Date.now() + expiresIn };
  return data.access_token;
}

async function apiFetch(path: string, init: RequestInit = {}) {
  const cfg = mtnConfig();
  const token = await getAccessToken();
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("X-Target-Environment", cfg.targetEnvironment);
  headers.set("Ocp-Apim-Subscription-Key", cfg.primaryKey);
  if (init.body) headers.set("Content-Type", "application/json");

  const res = await fetch(`${cfg.baseUrl}${path}`, { ...init, headers, cache: "no-store" });
  if (!res.ok) {
    const body = await res.text();
    throw new MtnApiError(`MTN API error on ${path} (${res.status})`, res.status, body);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// --- Collection operations ---

/** Currency to put on the wire: sandbox accepts only EUR; prod uses MTN_CURRENCY. */
function wireCurrency(cfg: MtnConfig): string {
  return cfg.mode === "sandbox" ? "EUR" : cfg.currency;
}

export type RequestToPayInput = {
  amountMinor: number;
  externalId: string;
  payerMsisdn: string;
  payerMessage?: string;
  payeeNote?: string;
};

/**
 * Initiate a one-time charge. The payer is prompted in their MoMo app and the
 * transaction remains PENDING until they approve or reject it.
 */
export async function requestToPay(
  input: RequestToPayInput,
  referenceId: string = crypto.randomUUID()
): Promise<{ referenceId: string }> {
  const cfg = mtnConfig();
  const body: Record<string, unknown> = {
    amount: toMtnMajor(input.amountMinor),
    currency: wireCurrency(cfg),
    externalId: input.externalId,
    payer: { partyIdType: "MSISDN", partyId: normalizeMsisdn(input.payerMsisdn) },
    payerMessage: input.payerMessage || "Contribution via Cowrie",
    payeeNote: input.payeeNote || "Cowrie contribution",
  };
  if (cfg.callbackUrl) body.callbackUrl = cfg.callbackUrl;

  await apiFetch("/collection/v1_0/requesttopay", {
    method: "POST",
    headers: { "X-Reference-Id": referenceId },
    body: JSON.stringify(body),
  });
  return { referenceId };
}

export type TransactionStatus = {
  amount: string;
  currency: string;
  financialTransactionId?: string;
  externalId?: string;
  payer?: { partyIdType: string; partyId: string };
  status: string;
  reason?: string;
};

export async function getTransactionStatus(referenceId: string): Promise<TransactionStatus> {
  return apiFetch(`/collection/v1_0/requesttopay/${referenceId}`);
}

export type CreatePreApprovalInput = {
  amountMinor: number;
  externalId: string;
  payerMsisdn: string;
  validityTimeSeconds: number;
  payerMessage?: string;
  payeeNote?: string;
};

/**
 * Ask a payer to authorize future automatic debits (MTN Pre-Approval). Returns
 * the preApprovalId which the payer must approve in their MoMo app. Once
 * approved, `getPreApprovalStatus` reports SUCCESSFUL.
 */
export async function createPreApproval(
  input: CreatePreApprovalInput,
  preApprovalId: string = crypto.randomUUID()
): Promise<{ preApprovalId: string }> {
  const cfg = mtnConfig();
  const body: Record<string, unknown> = {
    payer: { partyIdType: "MSISDN", partyId: normalizeMsisdn(input.payerMsisdn) },
    payerMessage: input.payerMessage || "Authorize recurring contributions via Cowrie",
    payeeNote: input.payeeNote || "Recurring contributions",
    amount: toMtnMajor(input.amountMinor),
    currency: wireCurrency(cfg),
    validityTime: String(input.validityTimeSeconds),
  };
  if (cfg.callbackUrl) body.callbackUrl = cfg.callbackUrl;

  await apiFetch("/collection/v1_0/preapproval", {
    method: "POST",
    headers: { "X-Reference-Id": preApprovalId },
    body: JSON.stringify(body),
  });
  return { preApprovalId };
}

export type PreApprovalStatus = {
  amount: string;
  currency: string;
  externalId?: string;
  payer?: { partyIdType: string; partyId: string };
  payerMessage?: string;
  status: string;
  validityTime?: string;
};

export async function getPreApprovalStatus(preApprovalId: string): Promise<PreApprovalStatus> {
  return apiFetch(`/collection/v1_0/preapproval/${preApprovalId}`);
}

/**
 * Charge an already-approved pre-approval. The payer is NOT prompted again —
 * this is the recurring auto-debit path (invoked by the cron/scheduler).
 */
export async function requestToPayAgainstPreApproval(
  preApprovalId: string,
  input: RequestToPayInput
): Promise<{ referenceId: string }> {
  const cfg = mtnConfig();
  const referenceId = crypto.randomUUID();
  const body: Record<string, unknown> = {
    amount: toMtnMajor(input.amountMinor),
    currency: wireCurrency(cfg),
    externalId: input.externalId,
    payer: { partyIdType: "MSISDN", partyId: normalizeMsisdn(input.payerMsisdn) },
    payerMessage: input.payerMessage || "Recurring contribution via Cowrie",
    payeeNote: input.payeeNote || "Recurring contribution",
  };
  if (cfg.callbackUrl) body.callbackUrl = cfg.callbackUrl;

  await apiFetch(`/collection/v1_0/preapproval/${preApprovalId}/requesttopay`, {
    method: "POST",
    headers: { "X-Reference-Id": referenceId },
    body: JSON.stringify(body),
  });
  return { referenceId };
}

/** Revoke a payer's pre-approval (cancellation). Best effort — DB mirror always runs. */
export async function deletePreApproval(preApprovalId: string): Promise<void> {
  await apiFetch(`/collection/v1_0/preapproval/${preApprovalId}`, { method: "DELETE" });
}

/** Probe whether the API credentials actually work (used by Settings/Onboarding). */
export async function testMtnConfig() {
  try {
    await getAccessToken();
    return { ok: true as const, error: null as string | null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not reach MTN MoMo.";
    return { ok: false as const, error: message };
  }
}