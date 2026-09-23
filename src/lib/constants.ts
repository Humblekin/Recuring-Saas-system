/** Shared constants usable by both server and client code. */

export const organizationTypeOptions = [
  "church",
  "mosque",
  "ngo",
  "school",
  "association",
  "community",
  "business",
  "other",
] as const;

export const RECURRING_FREQUENCIES = ["weekly", "monthly", "yearly"] as const;

export type RecurringFrequency = (typeof RECURRING_FREQUENCIES)[number];