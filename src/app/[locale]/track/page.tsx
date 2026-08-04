import { notFound, redirect } from "next/navigation";

import { LoginForm } from "@/components/LoginForm";
import { getDictionary } from "@/lib/dictionary";
import { isLocale, whatsappLink, type Locale } from "@/lib/i18n";
import { getWhatsappNumber } from "@/lib/data";
import { getSessionProjectId } from "@/lib/portal";

// Reads cookies, so it must never be statically cached.
export const dynamic = "force-dynamic";

export default async function TrackPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = getDictionary(locale);

  // Already signed in — skip the form.
  if (await getSessionProjectId()) redirect(`/${locale}/track/dashboard`);

  const whatsapp = await getWhatsappNumber();

  return (
    <section className="flex min-h-screen items-center justify-center bg-ink px-4 pb-20 pt-[164px]">
      <div className="w-full max-w-md rounded-card border border-gold/30 bg-white/[0.03] p-10">
        <div className="text-center">
          <h1 className="font-serif text-2xl text-white">{t.track.title}</h1>
          <div className="mx-auto mt-5 h-px w-12 bg-gold" />
          <p className="mt-6 text-sm leading-7 text-white/55">{t.track.subtitle}</p>
        </div>

        <LoginForm locale={locale} t={t.track} />

        <p className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-white/40">
          {t.track.help}{" "}
          <a
            href={whatsappLink(whatsapp, t.whatsapp.trackHelp)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold hover:underline"
          >
            {t.track.whatsappCta}
          </a>
        </p>
      </div>
    </section>
  );
}
