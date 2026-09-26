import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Sanitize a string for safe rendering — strips HTML tags
 * Security: prevents XSS from user-generated content
 */
export function sanitize(str: string): string {
  return str.replace(/<[^>]*>/g, "");
}

/**
 * Format currency in GHS (Ghana Cedis)
 */
export function formatCurrency(
  amount: number,
  currency: string = "GHS"
): string {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format currency from the lowest denomination (pesewas / cents).
 * Amounts are stored in the DB as integers in lowest denomination,
 * so divide by 100 before displaying.
 */
export function formatCurrencyFromMinor(
  amount: number,
  currency: string = "GHS"
): string {
  return formatCurrency(amount / 100, currency);
}

/** Present a subscription frequency as friendly text. */
export function formatFrequency(frequency: string): string {
  switch (frequency) {
    case "weekly":
      return "Weekly";
    case "monthly":
      return "Monthly";
    case "yearly":
      return "Yearly";
    default:
      return frequency;
  }
}

/** Days in the given month (0-indexed), e.g. daysInMonth(2026, 1) === 28. */
function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/**
 * Compute the next billing date after applying a recurring interval.
 *
 * Month/year arithmetic CLAMPS to the last valid day instead of rolling over.
 * `setMonth(getMonth() + 1)` overflows: on Jan 31 it yields Mar 3, because
 * February has no 31st. That silently skipped an entire billing cycle and then
 * pinned the supporter to the 3rd of every following month — a supporter who
 * signed up on the 31st would never be charged in February, and would be
 * charged on a day they never agreed to. Clamping gives Jan 31 -> Feb 28/29,
 * which is the conventional behaviour for recurring billing.
 */
export function addInterval(date: Date, interval: string): Date {
  const next = new Date(date);
  if (interval === "weekly") {
    next.setDate(next.getDate() + 7);
  } else if (interval === "monthly") {
    const day = next.getDate();
    next.setDate(1);
    next.setMonth(next.getMonth() + 1);
    next.setDate(Math.min(day, daysInMonth(next.getFullYear(), next.getMonth())));
  } else if (interval === "yearly") {
    // Feb 29 + 1 year has no Feb 29; clamp to Feb 28.
    const day = next.getDate();
    next.setDate(1);
    next.setFullYear(next.getFullYear() + 1);
    next.setDate(Math.min(day, daysInMonth(next.getFullYear(), next.getMonth())));
  }
  return next;
}

/**
 * Generate a cryptographically random ID (for CSRF tokens, etc.)
 * Security: uses crypto.randomUUID when available
 */
export function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Validate that a URL is safe for redirects (same-origin only)
 * Security: prevents open redirect attacks
 */
export function isSafeRedirect(url: string, origin: string): boolean {
  try {
    const parsed = new URL(url, origin);
    return parsed.origin === origin;
  } catch {
    return false;
  }
}

/** Extract a human-readable message from an unknown thrown value. */
export function errorMessage(err: unknown, fallback = "Something went wrong."): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  return fallback;
}
