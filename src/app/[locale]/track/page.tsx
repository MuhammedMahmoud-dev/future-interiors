import { notFound } from "next/navigation";

import { getDictionary } from "@/lib/dictionary";
import { isLocale, whatsappLink, type Locale } from "@/lib/i18n";
import { getWhatsappNumber } from "@/lib/data";

export const revalidate = 3600;

/**
 * Phase 1 placeholder. The real login (project code + phone, rate limited) and
 * the client dashboard ship together in phase 2 — a working login with no
 * dashboard behind it would be worse than saying so plainly.
 */
export default async function TrackPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = getDictionary(locale);
  const whatsapp = await getWhatsappNumber();

  return (
    <section className="flex min-h-screen items-center justify-center bg-ink px-4 pb-20 pt-[164px]">
      <div className="w-full max-w-md border border-gold/30 p-10 text-center">
        <h1 className="text-2xl text-white">{t.track.title}</h1>
        <div className="mx-auto mt-6 h-px w-12 bg-gold" />

        <p className="mt-8 text-lg text-gold">{t.track.soonTitle}</p>
        <p className="mt-4 text-sm leading-8 text-white/60">{t.track.soonBody}</p>

        <a
          href={whatsappLink(whatsapp, t.whatsapp.trackHelp)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-10 inline-block rounded-sharp bg-gold px-8 py-4 text-sm font-medium text-ink transition-opacity hover:opacity-90"
        >
          {t.track.whatsappCta}
        </a>
      </div>
    </section>
  );
}
