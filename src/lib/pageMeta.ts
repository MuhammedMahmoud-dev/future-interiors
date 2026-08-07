import type { Metadata } from "next";
import { defaultLocale, href, isLocale, pageAlternates } from "./i18n";

/**
 * The path-specific half of a public page's metadata.
 *
 * Kept out of i18n.ts because that module is imported by client components, and
 * kept out of the layout because metadata merges downward — see the note on
 * `pageAlternates`. Every public page calls this with its own path:
 *
 *   export function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
 *     return localeMetadata("/works", params);
 *   }
 *
 * Title and description are not set here. They are genuinely shared and stay in
 * the layout; per-page titles would be an improvement but are a separate change.
 */
export async function localeMetadata(
  path: string,
  params: Promise<{ locale: string }>,
): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;

  return {
    alternates: pageAlternates(path, locale),
    openGraph: { url: href(path, locale) },
  };
}

/**
 * For the portal's signed-in pages. They hold one client's figures, so they are
 * never indexed and never carry a canonical — `robots.ts` disallows them too,
 * and this is the page-level counterpart to that.
 */
export const privateMetadata: Metadata = {
  robots: { index: false, follow: false },
};
