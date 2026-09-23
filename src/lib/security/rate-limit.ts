import { headers } from "next/headers";

// =============================================================================
// RATE LIMITING — fixed-window, in-memory.
// Protects public, unauthenticated entry points (checkout, webhooks, cron) from
// abuse. State is process-local: fine for a single instance, resets on restart.
// =============================================================================

const buckets = new Map<string, number[]>();

export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return h.get("x-real-ip") || "unknown";
}

/**
 * Returns true when the request is within its allowance, false when the limit
 * has been exceeded for the given window. The bucket key names the rate limit;
 * provide `clientKey` to scope per caller (e.g. an IP).
 */
export function isRateLimited(opts: {
  bucket: string;
  clientKey?: string;
  limit: number;
  windowMs: number;
}): boolean {
  const key = opts.clientKey ? `${opts.bucket}:${opts.clientKey}` : opts.bucket;
  const now = Date.now();
  const cutoff = now - opts.windowMs;

  const hits = (buckets.get(key) || []).filter((t) => t > cutoff);
  if (hits.length >= opts.limit) {
    buckets.set(key, hits);
    return true;
  }

  hits.push(now);
  buckets.set(key, hits);
  return false;
}