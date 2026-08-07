import { notFound, redirect } from "next/navigation";

import { LoginForm } from "@/components/LoginForm";
import { getDictionary } from "@/lib/dictionary";
import { isLocale, whatsappLink, type Locale } from "@/lib/i18n";
import { getWhatsappNumber } from "@/lib/data";
import { getSessionProjectId, hasPortalAccess } from "@/lib/portal";
import { localeMetadata } from "@/lib/pageMeta";

// Reads cookies, so it must never be statically cached.
export const dynamic = "force-dynamic";

/** Canonical and hreflang for this page — never inherited from the layout. */
export function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return localeMetadata("/track", params);
}

export default async function TrackPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = getDictionary(locale);

  /*
   * Already signed in — skip the form, but only if the portal is still open.
   *
   * Without that second condition this page and the dashboard bounce off each
   * other: the dashboard sends a revoked client here, and here would send them
   * straight back. They land on the form instead, with the reason, and their
   * stale cookie grants nothing because every portal page re-checks.
   */
  const sessionProjectId = await getSessionProjectId();
  const accessRevoked = sessionProjectId !== null && !(await hasPortalAccess(sessionProjectId));
  if (sessionProjectId && !accessRevoked) redirect(`/${locale}/track/dashboard`);

  const whatsapp = await getWhatsappNumber();

  return (
    <section className="flex min-h-screen items-center justify-center bg-ink px-4 pb-20 pt-[164px]">
      <div className="w-full max-w-md rounded-card border border-accent/30 bg-white/[0.03] p-10">
        <div className="text-center">
          <h1 className="text-2xl text-white">{t.track.title}</h1>
          <div className="mx-auto mt-5 h-px w-12 bg-accent" />
          <p className="mt-6 text-sm leading-7 text-white/55">{t.track.subtitle}</p>
        </div>

        <LoginForm
          locale={locale}
          t={t.track}
          notice={accessRevoked ? t.track.disabled : null}
        />

        <p className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-white/60">
          {t.track.help}{" "}
          <a
            href={whatsappLink(whatsapp, t.whatsapp.trackHelp)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            {t.track.whatsappCta}
          </a>
        </p>
      </div>
    </section>
  );
}
