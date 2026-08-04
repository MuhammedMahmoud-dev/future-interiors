import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Noto_Naskh_Arabic, Playfair_Display } from "next/font/google";
import "../globals.css";

/**
 * Second root layout. /admin sits outside [locale] — it is a single-user
 * internal tool, always Arabic, and never localised. The public site's navbar,
 * footer and WhatsApp button deliberately do not appear here.
 *
 * The serif is loaded for page titles and the wordmark only. Everything the
 * engineer actually works in — tables, the ledger grid, forms — stays sans.
 */

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-arabic",
  display: "swap",
});

const notoNaskhArabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["500", "600"],
  variable: "--font-serif-ar",
  display: "swap",
});

// Latin only, for the wordmark in the admin header.
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "لوحة التحكم — Future Interiors",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${plexArabic.variable} ${notoNaskhArabic.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-cream font-sans text-ink">{children}</body>
    </html>
  );
}
