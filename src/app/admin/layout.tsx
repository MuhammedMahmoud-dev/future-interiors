import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Manrope } from "next/font/google";
import "../globals.css";

/**
 * Second root layout. /admin sits outside [locale] — it is a single-user
 * internal tool, always Arabic, and never localised. The public site's navbar,
 * footer and WhatsApp button deliberately do not appear here.
 *
 * Same two faces as the public site (§7). Manrope is loaded for the wordmark,
 * project codes and every money column; the ledger grid keeps Tailwind's denser
 * default scale, since the engineer works in it a hundred rows at a time.
 */

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-arabic",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-manrope",
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
      className={`${plexArabic.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="type-scale-admin min-h-full bg-surface font-sans text-ink">{children}</body>
    </html>
  );
}
