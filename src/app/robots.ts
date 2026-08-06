import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/i18n";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      /*
       * The admin already sends noindex from its own metadata, but a crawler
       * should not be walking it at all. The portal is per-client data behind a
       * code — nothing there belongs in an index, and its pages are dynamic, so
       * they would otherwise be crawled on every pass for no benefit.
       */
      disallow: ["/admin", "/admin/", "/ar/track", "/en/track"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
