import { notFound } from "next/navigation";

import { PageHeader } from "@/components/Sections";
import { getDictionary } from "@/lib/dictionary";
import { isLocale, whatsappLink, type Locale } from "@/lib/i18n";
import { getEngineer, getWhatsappNumber } from "@/lib/data";
import { localeMetadata } from "@/lib/pageMeta";

export const revalidate = 3600;

/** Canonical and hreflang for this page — never inherited from the layout. */
export function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return localeMetadata("/contact", params);
}

/** No form, no map, no opening hours — WhatsApp and a phone number, per spec. */
export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = getDictionary(locale);

  const [engineer, whatsapp] = await Promise.all([getEngineer(), getWhatsappNumber()]);

  return (
    <>
      <PageHeader eyebrow={t.contact.eyebrow} title={t.contact.title} subtitle={t.contact.subtitle} />

      <section className="bg-surface py-24">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <a
            href={whatsappLink(whatsapp, t.whatsapp.book)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-card bg-ink px-10 py-5 text-base font-medium text-white transition-opacity hover:opacity-90"
          >
            {t.contact.whatsappCta}
          </a>

          {engineer?.phone && (
            <div className="mt-14 border-t border-border pt-10">
              <p className="text-xs text-muted-ink">{t.contact.phone}</p>
              <a
                href={`tel:${engineer.phone}`}
                dir="ltr"
                className="brand mt-2 block text-2xl transition-colors hover:text-ink"
              >
                {engineer.phone}
              </a>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
