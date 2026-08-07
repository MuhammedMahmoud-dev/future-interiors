/**
 * Locale primitives. Deliberately free of dictionary imports so client
 * components can use `href`/`dir` without shipping both dictionaries to the
 * browser. `getDictionary` lives in ./dictionary.ts.
 */

export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ar";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function dir(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

/**
 * Absolute origin, needed by anything that has to emit a full URL rather than a
 * path: canonical links, hreflang alternates, Open Graph, the sitemap.
 *
 * Vercel exposes the production host without a scheme, hence the prefix. The
 * localhost fallback keeps `next build` working before the variable is set —
 * metadataBase throws on a relative value.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}

/** Prefix a path with the active locale: href("/works", "en") -> "/en/works" */
export function href(path: string, locale: Locale): string {
  return `/${locale}${path === "/" ? "" : path}`;
}

/**
 * The canonical and hreflang block for one page.
 *
 * This belongs to the PAGE, never to the layout. Next merges metadata down the
 * tree, so `alternates` declared once in the [locale] layout was inherited by
 * every route beneath it — /ar/works announced its canonical as /ar, telling
 * search engines the works page was a duplicate of the homepage and inviting it
 * to be dropped from the index.
 *
 * Computing it from the pathname in one place would need `headers()` inside
 * generateMetadata, which opts every route out of static generation. Passing the
 * path per page keeps all of them static.
 */
export function pageAlternates(path: string, locale: Locale) {
  return {
    canonical: href(path, locale),
    languages: {
      ar: href(path, "ar"),
      en: href(path, "en"),
      "x-default": href(path, defaultLocale),
    },
  };
}

/** Swap the locale segment of a current pathname: "/ar/works" -> "/en/works" */
export function switchLocalePath(pathname: string, target: Locale): string {
  const segments = pathname.split("/");
  if (segments.length > 1 && isLocale(segments[1])) {
    segments[1] = target;
    return segments.join("/");
  }
  return `/${target}${pathname}`;
}

/**
 * Database content is stored in `<field>_ar` / `<field>_en` pairs.
 * English falls back to Arabic when the English column is empty, per spec.
 */
export function pick(
  row: Record<string, unknown> | null | undefined,
  field: string,
  locale: Locale,
): string {
  if (!row) return "";
  const arabic = row[`${field}_ar`];
  const english = row[`${field}_en`];
  const chosen = locale === "en" ? english || arabic : arabic;
  return typeof chosen === "string" ? chosen : "";
}

/** Same fallback rule for `text[]` columns (service bullets, credentials). */
export function pickList(
  row: Record<string, unknown> | null | undefined,
  field: string,
  locale: Locale,
): string[] {
  if (!row) return [];
  const arabic = row[`${field}_ar`];
  const english = row[`${field}_en`];
  const chosen =
    locale === "en" && Array.isArray(english) && english.length > 0 ? english : arabic;
  return Array.isArray(chosen) ? chosen.filter((v): v is string => typeof v === "string") : [];
}

const EGYPT_COUNTRY_CODE = "20";

/**
 * Builds a wa.me link with a prefilled message.
 *
 * wa.me needs a full international number with no plus and no trunk zero, so a
 * locally-written "01115134141" would produce a dead link. Egyptian numbers are
 * normalised and re-prefixed here, which makes 01115134141, +20 111 513 4141,
 * 00201115134141 and 201115134141 all resolve to the same chat.
 *
 * Numbers that are not Egyptian mobiles are passed through untouched — blindly
 * prefixing 20 would corrupt, say, a Saudi or US number.
 */
export function whatsappLink(phone: string | null | undefined, message: string): string {
  const text = encodeURIComponent(message);
  const digits = (phone ?? "").replace(/\D/g, "");
  if (!digits) return `https://wa.me/?text=${text}`;

  const local = normalizePhone(digits);
  // Once the trunk zero and country code are stripped, an Egyptian mobile is
  // exactly 10 digits starting with 1 (prefixes 010/011/012/015).
  const international = /^1\d{9}$/.test(local)
    ? `${EGYPT_COUNTRY_CODE}${local}`
    : digits.replace(/^0+/, "");

  return `https://wa.me/${international}?text=${text}`;
}

/**
 * Normalises an Egyptian mobile number for comparison (used by the phase-2
 * portal login). Handles +20, 0020, and the local 01… trunk form.
 *
 * Order matters: leading zeros are stripped BEFORE the country code, otherwise
 * "0020…" keeps its 20 and never matches the stored number. Egyptian mobile
 * prefixes are 010/011/012/015, so after the trunk zero they start with
 * 10/11/12/15 and can never be mistaken for the 20 country code.
 */
export function normalizePhone(input: string): string {
  let digits = (input ?? "").replace(/\D/g, "").replace(/^0+/, "");
  if (digits.startsWith("20")) digits = digits.slice(2).replace(/^0+/, "");
  return digits;
}
