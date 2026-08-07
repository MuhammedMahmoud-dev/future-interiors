import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IBM_Plex_Sans_Arabic, Manrope } from "next/font/google";
import "../globals.css";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { getDictionary } from "@/lib/dictionary";
import { dir, isLocale, locales, pick, siteUrl, whatsappLink, type Locale } from "@/lib/i18n";
import { getEngineer, getServices, getWhatsappNumber } from "@/lib/data";

/**
 * Two faces, one per script (§7). There is deliberately no third heading face:
 * headings use these at heavier weights and tighter tracking, which is what
 * keeps the page monochrome rather than decorated.
 */
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-arabic",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : "ar";
  const t = getDictionary(locale);

  return {
    metadataBase: new URL(siteUrl()),
    title: t.meta.title,
    description: t.meta.description,

    /*
     * `alternates` and `openGraph.url` are deliberately absent here.
     *
     * Metadata merges down the tree, so anything path-specific declared in a
     * layout is inherited by every page beneath it. Both of those are
     * path-specific, and stating them once here made every inner page claim to
     * be the locale homepage. They now come from each page via
     * `pageAlternates()`; a page that forgets them has no canonical, which is
     * recoverable, rather than a wrong one, which is not.
     *
     * The rest is genuinely shared and stays.
     *
     * Open Graph is not cosmetic on this site: every call to action opens
     * WhatsApp, so the link gets pasted into WhatsApp constantly. Without these
     * it previews as a bare URL with no title, description or image.
     */
    openGraph: {
      type: "website",
      siteName: t.meta.siteName,
      title: t.meta.title,
      description: t.meta.description,
      locale: locale === "ar" ? "ar_EG" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: t.meta.title,
      description: t.meta.description,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;

  const t = getDictionary(locale);
  const [engineer, services, whatsapp] = await Promise.all([
    getEngineer(),
    getServices(),
    getWhatsappNumber(),
  ]);

  const phone = engineer?.phone ?? null;
  const bookHref = whatsappLink(whatsapp, t.whatsapp.book);

  return (
    <html
      lang={locale}
      dir={dir(locale)}
      className={`${plexArabic.variable} ${manrope.variable} h-full antialiased`}
    >
      {/* type-scale-public enlarges the whole reading scale; /admin has its own
          root layout and deliberately keeps Tailwind's denser default. */}
      <body className="type-scale-public flex min-h-full flex-col font-sans">
        <Navbar
          locale={locale}
          nav={t.nav}
          topbar={t.topbar}
          phone={phone}
          whatsappHref={bookHref}
        />
        <main className="flex-1">{children}</main>
        <Footer
          locale={locale}
          t={t}
          services={services.map((service) => pick(service, "title", locale))}
          phone={phone}
          whatsappHref={bookHref}
        />
        <WhatsAppFab href={bookHref} label={t.whatsapp.float} />
      </body>
    </html>
  );
}
