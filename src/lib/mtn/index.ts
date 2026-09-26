import crypto from "node:crypto";

// =============================================================================
// Safe payment tracing. Logs only non-secret facts (paths, HTTP codes, public
// reference ids, statuses). NEVER include tokens, keys, Basic/Bearer headers,
// subscription keys, or API user/secret values here.
// =============================================================================
export function logPay(...parts: unknown[]) {
  if (process.env.NODE_ENV === "production") return;
  console.log("[KIVARO PAYMENT]", ...parts.map((p) => (typeof p === "string" ? p : JSON.stringify(p))));
}

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
//   MTN_PAYEE_MSISDN             OPTIONAL settlement number. When set it is sent
//                                as the `payee` on every charge. When empty the
//                                payee configured in the MTN portal is used.
//   MTN_CURRENCY                 "GHS" (default). Sandbox transparently uses EUR.
//   MTN_TIMEOUT_MS               per-request timeout, default 15000
//
// NOTE: the MTN sandbox wallet only accepts EUR (a request with GHS is
// rejected with INVALID_CURRENCY). Kivaro stays "always GHS" product-facing:
// the DB and UI use GHS, and only the sandbox wire request is mapped to EUR.
// Production honours MTN_CURRENCY (GHS). Amounts map 1:1.
//
// MTN callbacks are NOT cryptographically signed. Keep the webhook URL secret.
// =============================================================================

export type MtnMode = "sandbox" | "production";
export type MtnPaymentStatus = "PENDING" | "SUCCESSFUL" | "FAILED" | "REJECTED";

/**
 * An error returned by (or while calling) MTN.
 *
 * `transient` marks failures where retrying the exact same request later is
 * reasonable: timeouts, DNS/TLS failures, and MTN 5xx/429. Non-transient
 * failures are MTN telling us the request itself is wrong (4xx) and will keep
 * failing until the input changes.
 */
export class MtnApiError extends Error {
  status: number;
  body: string;
  transient: boolean;

  constructor(message: string, status: number, body: string, transient = false) {
    super(message);
    this.name = "MtnApiError";
    this.status = status;
    this.body = body;
    this.transient = transient;
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
  timeoutMs: number;
};

export function mtnConfig(): MtnConfig {
  const mode: MtnMode = process.env.MTN_MODE === "production" ? "production" : "sandbox";
  const defaultBase =
    mode === "production" ? "https://proxy.momoapi.mtn.com" : "https://sandbox.momodeveloper.mtn.com";
  const timeout = Number(process.env.MTN_TIMEOUT_MS);
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
    timeoutMs: Number.isFinite(timeout) && timeout > 0 ? timeout : 15_000,
  };
}

/** Variables that make the integration non-functional. Checkout refuses to run. */
export function mtnConfigMissing(): string[] {
  const missing: string[] = [];
  const m = mtnConfig();
  if (!m.primaryKey) missing.push("MTN_COLLECTION_PRIMARY_KEY");
  if (!m.apiUser) missing.push("MTN_API_USER");
  if (!m.apiKey) missing.push("MTN_API_KEY");
  if (!m.targetEnvironment) missing.push("MTN_TARGET_ENVIRONMENT");
  return missing;
}

/**
 * Non-blocking misconfigurations. These do not stop a sandbox charge from
 * working, but they silently break production (e.g. no settlement callback
 * means only the supporter's browser poll ever settles a payment). Surfaced in
 * Settings and Onboarding instead of thrown at checkout.
 */
export function mtnConfigWarnings(): string[] {
  const warnings: string[] = [];
  const m = mtnConfig();
  if (!m.callbackUrl) {
    warnings.push(
      "MTN_CALLBACK_URL is not set. Payments will only settle when the supporter's browser reports back; if they close the tab the payment stays pending."
    );
  } else if (/^https?:\/\/(localhost|127\.0\.0\.1)\b/i.test(m.callbackUrl)) {
    warnings.push(
      `MTN_CALLBACK_URL points at localhost (${m.callbackUrl}). MTN cannot reach it from the internet — production settlements will never be delivered. Set it to your public HTTPS URL.`
    );
  } else if (!/^https:\/\//i.test(m.callbackUrl)) {
    warnings.push(`MTN_CALLBACK_URL is not HTTPS (${m.callbackUrl}). Use your public HTTPS URL in production.`);
  }
  if (m.mode === "production" && !m.payeeMsisdn) {
    warnings.push(
      "MTN_PAYEE_MSISDN is empty in production, so charges rely entirely on the payee configured in the MTN portal. Set it explicitly if you settle to more than one number."
    );
  }
  return warnings;
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
  // Accept "02xxxxxxxxx", "233xxxxxxxxx", "+233xxxxxxxxx" — normalize first so
  // every format the giveaway form advertises (e.g. "024 123 4567") passes.
  const d = normalizeMsisdn(value);
  return d.length === 12 && d.startsWith("233");
}

/** Format minor units (pesewas) as a major-unit string MTN accepts ("10", "10.50"). */
export function toMtnMajor(amountMinor: number): string {
  const major = amountMinor / 100;
  return Number.isInteger(major) ? String(major) : major.toFixed(2);
}

/** Map an MTN status to Kivaro's payment status. */
export function mtnStatusToLocal(status: string): "success" | "failed" | "pending" {
  if (status === "SUCCESSFUL") return "success";
  if (status === "FAILED" || status === "REJECTED" || status === "CANCELLED" || status === "TIMEOUT") return "failed";
  return "pending";
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * MTN rejects the whole request with an opaque 400 and an empty body when
 * X-Reference-Id is not a UUID. Fail loudly here instead so the cause is never
 * a mystery blank 400 in the logs.
 */
function assertUuid(value: string, field: string): string {
  if (!UUID_RE.test(value)) {
    throw new MtnApiError(`MTN ${field} must be a UUID (got a non-UUID value)`, 0, "", false);
  }
  return value;
}

// --- Auth ---

// Refresh this many ms before the token actually expires so a request is never
// sent with a token that dies mid-flight.
const TOKEN_EXPIRY_SKEW_MS = 60_000;

let cachedToken: { token: string; expiresAt: number } | null = null;
let inFlightToken: Promise<string> | null = null;

/** Drop any cached token. Used to force a clean re-auth after a 401. */
function invalidateTokenCache() {
  cachedToken = null;
  inFlightToken = null;
}

/**
 * Obtain (and cache) the OAuth access token.
 *
 * Single-flight: concurrent callers arriving on a cold cache all await the SAME
 * in-flight request. Without this, N simultaneous requests fired N OAuth calls,
 * which is how a traffic spike turns into MTN 429s and failed payments.
 */
async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + TOKEN_EXPIRY_SKEW_MS) {
    return cachedToken.token;
  }
  if (!inFlightToken) {
    inFlightToken = requestAccessToken().finally(() => {
      inFlightToken = null;
    });
  }
  return inFlightToken;
}

async function requestAccessToken(): Promise<string> {
  const cfg = mtnConfig();
  const res = await timedFetch(
    `${cfg.baseUrl}/collection/token/`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${cfg.apiUser}:${cfg.apiKey}`).toString("base64")}`,
        "Ocp-Apim-Subscription-Key": cfg.primaryKey,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
    cfg,
    "MTN OAuth token request"
  );
  logPay("auth token request:", res.status);
  if (!res.ok) {
    const body = await res.text();
    throw new MtnApiError(`MTN token request failed (${res.status})`, res.status, body, isTransientStatus(res.status));
  }

  const data = (await res.json()) as { access_token: string; expires_in?: number };
  if (typeof data?.access_token !== "string" || data.access_token.length === 0) {
    throw new MtnApiError("MTN token response contained no access_token", res.status, "", true);
  }
  logPay("auth token obtained");
  // Default 1 hour when MTN omits expires_in; expire slightly early.
  const expiresIn = (Number(data.expires_in) || 3600) * 1000;
  cachedToken = { token: data.access_token, expiresAt: Date.now() + expiresIn };
  return data.access_token;
}

function isTransientStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

/**
 * fetch() with a hard deadline.
 *
 * Without this a slow or blackholed MTN endpoint leaves the request pending
 * indefinitely, which pins a server action open and starves every other
 * supporter behind it. Timeouts and network faults are normalised into
 * MtnApiError so callers only ever have to handle one error type.
 */
async function timedFetch(url: string, init: RequestInit, cfg: MtnConfig, label: string): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(cfg.timeoutMs) });
  } catch (err) {
    const isTimeout = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
    if (isTimeout) {
      throw new MtnApiError(`${label} timed out after ${cfg.timeoutMs}ms`, 504, "", true);
    }
    // Connection refused / DNS failure / TLS error.
    const detail = err instanceof Error ? err.message : "network error";
    throw new MtnApiError(`${label} could not reach MTN (${detail})`, 0, "", true);
  }
}

/**
 * Authenticated MTN call.
 *
 * A 401 means the cached token was rejected (revoked, or the sandbox/prod
 * credentials rotated underneath us). Rather than failing every payment until
 * the cache drains, drop the token, re-authenticate once, and replay the call.
 * `attempt` bounds this to a single retry so a genuinely unauthorised
 * credential cannot loop.
 */
async function apiFetch(path: string, init: RequestInit = {}, attempt = 0): Promise<unknown> {
  const cfg = mtnConfig();
  const token = await getAccessToken();
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("X-Target-Environment", cfg.targetEnvironment);
  headers.set("Ocp-Apim-Subscription-Key", cfg.primaryKey);
  if (init.body) headers.set("Content-Type", "application/json");

  const res = await timedFetch(`${cfg.baseUrl}${path}`, { ...init, headers, cache: "no-store" }, cfg, `MTN ${init.method || "GET"} ${path}`);

  if (res.status === 401 && attempt === 0) {
    logPay("provider call rejected token (401) — re-authenticating and retrying once:", path);
    invalidateTokenCache();
    return apiFetch(path, init, attempt + 1);
  }

  logPay("provider call:", init.method || "GET", path, "->", res.status);
  if (!res.ok) {
    const body = await res.text();
    throw new MtnApiError(`MTN API error on ${path} (${res.status})`, res.status, body, isTransientStatus(res.status));
  }
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    // A 200 carrying HTML or an empty body (sandbox proxies and captive-portal
    // interstitials do this) is not a usable response. Without this guard the
    // value flowed into a typed accessor and crashed on the first property read.
    throw new MtnApiError(
      `MTN ${init.method || "GET"} ${path} returned a non-JSON body`,
      502,
      text.slice(0, 200),
      true
    );
  }
}

/**
 * Assert that a provider response is a JSON object before it is handed back as a
 * typed result. MTN sometimes answers 200 with an empty body; casting that to
 * `TransactionStatus` yielded null and crashed callers on first property access.
 */
function requireObject<T>(value: unknown, label: string): T {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new MtnApiError(`MTN ${label} returned an unexpected empty response`, 502, "", true);
  }
  return value as T;
}

// --- Collection operations ---

/** Currency to put on the wire: sandbox accepts only EUR; prod uses MTN_CURRENCY. */
function wireCurrency(cfg: MtnConfig): string {
  return cfg.mode === "sandbox" ? "EUR" : cfg.currency;
}

/**
 * The `payee` block. Only sent when MTN_PAYEE_MSISDN is configured — otherwise
 * MTN falls back to the payee bound to the API user in the portal, which is the
 * correct default and keeps sandbox working with an empty value.
 */
function payeeBlock(cfg: MtnConfig): Record<string, unknown> {
  if (!cfg.payeeMsisdn) return {};
  return { payee: { partyIdType: "MSISDN", partyId: normalizeMsisdn(cfg.payeeMsisdn) } };
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
  assertUuid(referenceId, "X-Reference-Id");
  const cfg = mtnConfig();
  const body: Record<string, unknown> = {
    amount: toMtnMajor(input.amountMinor),
    currency: wireCurrency(cfg),
    externalId: input.externalId,
    payer: { partyIdType: "MSISDN", partyId: normalizeMsisdn(input.payerMsisdn) },
    ...payeeBlock(cfg),
    payerMessage: input.payerMessage || "Contribution via Kivaro",
    payeeNote: input.payeeNote || "Kivaro contribution",
  };
  if (cfg.callbackUrl) body.callbackUrl = cfg.callbackUrl;

  await apiFetch("/collection/v1_0/requesttopay", {
    method: "POST",
    headers: { "X-Reference-Id": referenceId },
    body: JSON.stringify(body),
  });
  logPay("one-time charge accepted (202) referenceId:", referenceId, "externalId:", input.externalId, "amount:", body.amount, body.currency);
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
  assertUuid(referenceId, "referenceId");
  return requireObject<TransactionStatus>(
    await apiFetch(`/collection/v1_0/requesttopay/${referenceId}`),
    "transaction status"
  );
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
  assertUuid(preApprovalId, "X-Reference-Id");
  const cfg = mtnConfig();
  const body: Record<string, unknown> = {
    payer: { partyIdType: "MSISDN", partyId: normalizeMsisdn(input.payerMsisdn) },
    ...payeeBlock(cfg),
    payerMessage: input.payerMessage || "Authorize recurring contributions via Kivaro",
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
  logPay("preapproval accepted (202) preApprovalId:", preApprovalId, "amount:", body.amount, body.currency);
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
  assertUuid(preApprovalId, "preApprovalId");
  return requireObject<PreApprovalStatus>(
    await apiFetch(`/collection/v1_0/preapproval/${preApprovalId}`),
    "pre-approval status"
  );
}

/**
 * Charge an already-approved pre-approval. The payer is NOT prompted again —
 * this is the recurring auto-debit path (invoked by the cron/scheduler).
 */
export async function requestToPayAgainstPreApproval(
  preApprovalId: string,
  input: RequestToPayInput
): Promise<{ referenceId: string }> {
  assertUuid(preApprovalId, "preApprovalId");
  const cfg = mtnConfig();
  const referenceId = crypto.randomUUID();
  const body: Record<string, unknown> = {
    amount: toMtnMajor(input.amountMinor),
    currency: wireCurrency(cfg),
    externalId: input.externalId,
    payer: { partyIdType: "MSISDN", partyId: normalizeMsisdn(input.payerMsisdn) },
    ...payeeBlock(cfg),
    payerMessage: input.payerMessage || "Recurring contribution via Kivaro",
    payeeNote: input.payeeNote || "Recurring contribution",
  };
  if (cfg.callbackUrl) body.callbackUrl = cfg.callbackUrl;

  await apiFetch(`/collection/v1_0/preapproval/${preApprovalId}/requesttopay`, {
    method: "POST",
    headers: { "X-Reference-Id": referenceId },
    body: JSON.stringify(body),
  });
  logPay("recurring auto-debit accepted (202) referenceId:", referenceId, "amount:", body.amount, body.currency);
  return { referenceId };
}

/** Revoke a payer's pre-approval (cancellation). Best effort — DB mirror always runs. */
export async function deletePreApproval(preApprovalId: string): Promise<void> {
  assertUuid(preApprovalId, "preApprovalId");
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
