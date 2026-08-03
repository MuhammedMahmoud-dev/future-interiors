import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "../globals.css";

/**
 * Second root layout. /admin sits outside [locale] — it is a single-user
 * internal tool, always Arabic, and never localised. The public site's navbar,
 * footer and WhatsApp button deliberately do not appear here.
 */

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "لوحة التحكم — Future Interiors",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${plexArabic.variable} h-full antialiased`}>
      <body className="min-h-full bg-paper font-sans text-ink">{children}</body>
    </html>
  );
}
