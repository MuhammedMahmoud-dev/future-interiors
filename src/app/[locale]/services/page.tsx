import { notFound } from "next/navigation";

import { EmptyState, PageHeader } from "@/components/Sections";
import { ServiceIcon } from "@/components/ServiceIcon";
import { getDictionary } from "@/lib/dictionary";
import { isLocale, pick, pickList, whatsappLink, type Locale } from "@/lib/i18n";
import { getServices, getWhatsappNumber } from "@/lib/data";
import { localeMetadata } from "@/lib/pageMeta";

export const revalidate = 3600;

/** Canonical and hreflang for this page — never inherited from the layout. */
export function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return localeMetadata("/services", params);
}

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = getDictionary(locale);

  const [services, whatsapp] = await Promise.all([getServices(), getWhatsappNumber()]);

  return (
    <>
      <PageHeader eyebrow={t.services.eyebrow} title={t.services.title} subtitle={t.services.pageSubtitle} />

      <section className="bg-surface py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          {services.length === 0 ? (
            <EmptyState message={t.common.unavailable} />
          ) : (
            <div className="divide-y divide-border">
              {services.map((service, index) => {
                const bullets = pickList(service, "bullets", locale);
                return (
                  <article key={service.id} className="grid gap-8 py-14 md:grid-cols-[auto_1fr]">
                    <div className="flex items-start gap-5">
                      <span className="brand text-sm text-accent-ink">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <ServiceIcon name={service.icon} />
                    </div>

                    <div>
                      <h2 className="text-2xl">{pick(service, "title", locale)}</h2>
                      <p className="mt-4 text-sm leading-8 text-muted-ink">
                        {pick(service, "desc", locale)}
                      </p>

                      {bullets.length > 0 && (
                        <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                          {bullets.map((bullet) => (
                            <li
                              key={bullet}
                              className="flex gap-3 border-s border-accent/40 ps-4 text-sm text-muted-ink"
                            >
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="mt-16 text-center">
            <a
              href={whatsappLink(whatsapp, t.whatsapp.book)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-card bg-ink px-8 py-4 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              {t.hero.ctaBook}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
