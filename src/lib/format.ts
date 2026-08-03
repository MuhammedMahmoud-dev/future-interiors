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

/**
 * Parses a date pasted from Excel into an ISO yyyy-mm-dd string.
 *
 * Day-first is assumed for slash and dot formats, because that is what an
 * Egyptian Excel locale produces — reading 03/08/2026 as March would silently
 * misdate line items on the client's statement. Returns null when unparseable.
 */
export function parseDateInput(input: string | null | undefined): string | null {
  const text = String(input ?? "")
    .trim()
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
  if (!text) return null;

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);
  if (iso) return build(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const dayFirst = /^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})$/.exec(text);
  if (dayFirst) {
    let year = Number(dayFirst[3]);
    if (year < 100) year += year < 70 ? 2000 : 1900;
    return build(year, Number(dayFirst[2]), Number(dayFirst[1]));
  }

  return null;
}

function build(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  // Rejects impossible dates like 31/02 that would otherwise roll over.
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date.toISOString().slice(0, 10);
}

/** "كمبوند كالما، الشيخ زايد" — never includes unit or building number. */
export function locationLabel(
  compound: string | null | undefined,
  district: string | null | undefined,
  locale: Locale,
): string {
  return [compound, district].filter(Boolean).join(locale === "ar" ? "، " : ", ");
}
