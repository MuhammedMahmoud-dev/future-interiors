import { notFound } from "next/navigation";

import { Counter } from "@/components/Counter";
import { EmptyState, PageHeader } from "@/components/Sections";
import { getDictionary } from "@/lib/dictionary";
import { isLocale, pick, pickList, whatsappLink, type Locale } from "@/lib/i18n";
import { getEngineer, getStats, getWhatsappNumber } from "@/lib/data";

export const revalidate = 3600;

/** No portrait for now, per spec — credentials and record carry the page. */
export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = getDictionary(locale);

  const [engineer, stats, whatsapp] = await Promise.all([
    getEngineer(),
    getStats(),
    getWhatsappNumber(),
  ]);

  const credentials = pickList(engineer, "credentials", locale);

  return (
    <>
      <PageHeader
        eyebrow={t.about.eyebrow}
        title={t.about.title}
        subtitle={engineer ? pick(engineer, "title", locale) : undefined}
      />

      <section className="bg-surface py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          {!engineer ? (
            <EmptyState message={t.about.empty} />
          ) : (
            <div className="space-y-16">
              <div>
                <h2 className="text-2xl">{pick(engineer, "name", locale)}</h2>
                {pick(engineer, "bio", locale) && (
                  <p className="mt-6 whitespace-pre-line text-sm leading-8 text-muted-ink">
                    {pick(engineer, "bio", locale)}
                  </p>
                )}
              </div>

              {engineer.syndicate_no && (
                <div className="border-s border-accent ps-6">
                  <p className="text-xs text-muted-ink">{t.about.syndicate}</p>
                  <p className="mt-1" dir="ltr">
                    {engineer.syndicate_no}
                  </p>
                </div>
              )}

              {credentials.length > 0 && (
                <div>
                  <h3 className="text-sm tracking-widest text-accent-ink">{t.about.credentials}</h3>
                  <ul className="mt-6 divide-y divide-border border-y border-border">
                    {credentials.map((credential) => (
                      <li key={credential} className="py-4 text-sm text-muted-ink">
                        {credential}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {stats.length > 0 && (
            <div className="mt-20 grid grid-cols-2 border-y border-border lg:grid-cols-4">
              {stats.map((stat, index) => (
                <div
                  key={stat.id}
                  className={`px-4 py-8 text-center ${
                    index % 2 !== 0 ? "border-s border-border" : ""
                  } ${index >= 2 ? "border-t border-border lg:border-t-0" : ""}`}
                >
                  <p className="brand text-3xl text-accent-ink">
                    <Counter value={Number(stat.value)} />
                    {pick(stat, "suffix", locale) && (
                      <span className="ms-1 text-lg">{pick(stat, "suffix", locale)}</span>
                    )}
                  </p>
                  <p className="mt-2 text-xs text-muted-ink">{pick(stat, "label", locale)}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-20 text-center">
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
