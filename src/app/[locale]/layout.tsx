import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IBM_Plex_Sans_Arabic, Jost, Noto_Naskh_Arabic, Playfair_Display } from "next/font/google";
import "../globals.css";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { ScrollMotion } from "@/components/motion/ScrollMotion";
import { getDictionary } from "@/lib/dictionary";
import { dir, isLocale, locales, pick, whatsappLink, type Locale } from "@/lib/i18n";
import { getEngineer, getServices, getWhatsappNumber } from "@/lib/data";

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-arabic",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
  display: "swap",
});

/**
 * Heading faces. Only one of the two is ever referenced by CSS on a given page —
 * globals.css picks Playfair under [dir=ltr] and Noto Serif Arabic otherwise —
 * so a reader downloads one serif, not both.
 */
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const notoNaskhArabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif-ar",
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
  const { locale } = await params;
  const t = getDictionary(isLocale(locale) ? locale : "ar");
  return {
    title: t.meta.title,
    description: t.meta.description,
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
      className={`${plexArabic.variable} ${jost.variable} ${playfair.variable} ${notoNaskhArabic.variable} h-full antialiased`}
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
        {/* Scroll motion is public-site only — it is never mounted on the
            client portal or the admin, where people are working, not reading. */}
        <ScrollMotion />
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
