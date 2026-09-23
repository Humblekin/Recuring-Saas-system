// =============================================================================
// INPUT SANITIZATION — defense-in-depth write boundary.
// React escapes output on render, so stored markup is not exploitable through
// the UI today; still, every user-supplied value is cleaned here so bad strings
// (script tags, control characters, oversized payloads) never reach the DB.
// =============================================================================

export const MAX_TITLE = 120;
export const MAX_DESCRIPTION = 4000;
export const MAX_NAME = 80;
export const MAX_EMAIL = 254;
export const MAX_PHONE = 32;
export const MAX_URL = 2048;

// HTML-ish tags, e.g. <script>, </a>, <img ...>.
const HTML_TAGS = /<\s*\/?\s*[a-zA-Z][^>]*>/g;
// Control characters (keeps line feeds intact).
const CONTROL_CHARS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;
// Runs of horizontal whitespace.
const SPACES = /[ \t]+/g;
// Runs of blank lines.
const BLANK_LINES = /\n{3,}/g;

function toStringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Strip tags/control chars, collapse whitespace, trim, and cap length. */
export function cleanText(value: unknown, max: number = MAX_NAME): string {
  return toStringValue(value)
    .replace(HTML_TAGS, " ")
    .replace(CONTROL_CHARS, "")
    .replace(SPACES, " ")
    .trim()
    .slice(0, max);
}

/** Like cleanText but preserves single line breaks and paragraph structure. */
export function cleanMultiline(value: unknown, max: number = MAX_DESCRIPTION): string {
  return toStringValue(value)
    .replace(HTML_TAGS, " ")
    .replace(CONTROL_CHARS, "")
    .replace(SPACES, " ")
    .replace(BLANK_LINES, "\n\n")
    .trim()
    .slice(0, max);
}

/** Lowercases and normalizes an email address so lookups are consistent. */
export function cleanEmail(value: unknown): string {
  return cleanText(value, MAX_EMAIL).toLowerCase();
}

/** Returns the cleaned line, or null when the field is empty. */
export function cleanOptional(value: unknown, max: number): string | null {
  const s = cleanText(value, max);
  return s || null;
}

/** Returns the cleaned URL, or null when empty or not an http(s) URL. */
export function cleanUrl(value: unknown): string | null {
  const s = cleanText(value, MAX_URL);
  if (!s) return null;
  return /^https?:\/\/[^\s<>]{1,2048}$/i.test(s) ? s : null;
}