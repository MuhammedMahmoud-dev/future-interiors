import type { MetadataRoute } from "next";
import { locales, siteUrl } from "@/lib/i18n";

/**
 * The public routes, both locales, cross-referenced with hreflang alternates.
 *
 * Deliberately absent: /admin, and the client portal under /track. The portal
 * is behind a code and a phone number and there is nothing there to index; the
 * admin is noindex already. Listing either would only advertise them.
 *
 * /works/[slug] is gone — the portfolio is a lightbox gallery on /works now, so
 * there are no per-project URLs to list.
 */
const PATHS = ["", "/works", "/services", "/work-system", "/about", "/contact"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();

  return locales.flatMap((locale) =>
    PATHS.map((path) => ({
      url: `${base}/${locale}${path}`,
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : 0.7,
      alternates: {
        languages: Object.fromEntries(
          locales.map((alt) => [alt, `${base}/${alt}${path}`]),
        ),
      },
    })),
  );
}
