import type { Locale } from "./i18n";

/** Approximate execution duration in whole months, or null when dates are missing. */
export function durationMonths(
  start: string | null | undefined,
  end: string | null | undefined,
): number | null {
  if (!start || !end) return null;
  const from = new Date(start).getTime();
  const to = new Date(end).getTime();
  if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) return null;
  const days = (to - from) / 86_400_000;
  return Math.max(1, Math.round(days / 30.44));
}

export function yearOf(date: string | null | undefined): string | null {
  if (!date) return null;
  const year = new Date(date).getFullYear();
  return Number.isFinite(year) ? String(year) : null;
}

/** Western digits in both locales, matching how the statements are written. */
export function formatNumber(value: number | string | null | undefined): string {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(numeric);
}

/** "كمبوند كالما، الشيخ زايد" — never includes unit or building number. */
export function locationLabel(
  compound: string | null | undefined,
  district: string | null | undefined,
  locale: Locale,
): string {
  return [compound, district].filter(Boolean).join(locale === "ar" ? "، " : ", ");
}
