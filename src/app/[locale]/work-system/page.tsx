import { notFound } from "next/navigation";

import { PageHeader } from "@/components/Sections";
import { getDictionary } from "@/lib/dictionary";
import { isLocale, whatsappLink, type Locale } from "@/lib/i18n";
import { getWhatsappNumber } from "@/lib/data";

export const revalidate = 3600;

/**
 * Process only. No figures, no percentages, no price per metre anywhere on this
 * page — the supervision rate is private and never published.
 */
export default async function WorkSystemPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = getDictionary(locale);
  const whatsapp = await getWhatsappNumber();

  return (
    <>
      <PageHeader eyebrow={t.workSystem.eyebrow} title={t.workSystem.title} subtitle={t.workSystem.subtitle} />

      <section className="bg-cream py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <ol className="space-y-14">
            {t.workSystem.steps.map((step, index) => (
              <li key={step.title} className="grid gap-6 sm:grid-cols-[auto_1fr]">
                <span className="brand text-2xl text-gold-ink">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="border-s border-gold/30 ps-6">
                  <h2 className="text-xl">{step.title}</h2>
                  <p className="mt-3 text-sm leading-8 text-ink/60">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-20 border-t border-ink/10 pt-12 text-center">
            <a
              href={whatsappLink(whatsapp, t.whatsapp.book)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-card bg-gold px-8 py-4 text-sm font-medium text-ink transition-opacity hover:opacity-90"
            >
              {t.hero.ctaBook}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
