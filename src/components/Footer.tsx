import Link from "next/link";
import { href, type Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/dictionary";
import { PillButton } from "./ui/PillButton";
import { WaveDivider } from "./ui/WaveDivider";

/**
 * Split footer: the call to action leads, contact details sit in the middle
 * behind gold icons, and the wordmark closes it.
 *
 * Every heading here is existing copy — the CTA reuses the contact page's own
 * title rather than inventing a second piece of marketing language.
 */
export function Footer({
  locale,
  t,
  services,
  phone,
  whatsappHref,
}: {
  locale: Locale;
  t: Dictionary;
  services: string[];
  phone: string | null;
  whatsappHref: string;
}) {
  const links = [
    { path: "/works", label: t.nav.works },
    { path: "/services", label: t.nav.services },
    { path: "/work-system", label: t.nav.workSystem },
    { path: "/about", label: t.nav.about },
    { path: "/contact", label: t.nav.contact },
    { path: "/track", label: t.nav.track },
  ];

  return (
    <footer className="bg-ink text-white">
      {/* Curves out of whatever light section preceded it. */}
      <WaveDivider className="bg-cream" fill="var(--color-ink)" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Lead: the call to action and the contact details. */}
        <div className="grid gap-12 border-b border-white/10 py-16 lg:grid-cols-[1.2fr_1fr_auto]">
          <div>
            <h2 className="font-serif text-3xl leading-tight sm:text-4xl">
              {t.contact.title}
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-7 text-white/60">{t.footer.blurb}</p>
            <div className="mt-8">
              <PillButton href={whatsappHref} external>
                {t.contact.whatsappCta}
              </PillButton>
            </div>
          </div>

          <ul className="space-y-5 text-sm lg:border-s lg:border-white/10 lg:ps-12">
            {phone && (
              <li>
                <a
                  href={`tel:${phone}`}
                  className="group flex items-center gap-4 transition-colors hover:text-gold"
                >
                  <ContactIcon>
                    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.8a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.8 2.1Z" />
                  </ContactIcon>
                  <span dir="ltr">{phone}</span>
                </a>
              </li>
            )}

            <li>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 transition-colors hover:text-gold"
              >
                <ContactIcon>
                  <path d="M21 11.5a8.4 8.4 0 0 1-12.6 7.3L3 20.5l1.8-5.2A8.4 8.4 0 1 1 21 11.5Z" />
                </ContactIcon>
                <span>{t.topbar.whatsapp}</span>
              </a>
            </li>
          </ul>

          <div className="lg:text-end">
            <p className="brand text-xl">Future Interiors</p>
            {/* Social links are intentionally not wired up yet — the row stays reserved. */}
          </div>
        </div>

        {/* Secondary: navigation and the service list. */}
        <div className="grid gap-10 py-12 sm:grid-cols-2">
          <div>
            <h3 className="mb-5 text-xs tracking-[0.28em] text-gold ltr:uppercase">
              {t.footer.links}
            </h3>
            <ul className="grid grid-cols-2 gap-3 text-sm text-white/70">
              {links.map((link) => (
                <li key={link.path}>
                  <Link
                    href={href(link.path, locale)}
                    className="transition-colors hover:text-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-5 text-xs tracking-[0.28em] text-gold ltr:uppercase">
              {t.footer.services}
            </h3>
            {services.length > 0 ? (
              <ul className="grid grid-cols-2 gap-3 text-sm text-white/70">
                {services.map((service) => (
                  <li key={service}>{service}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-white/40">{t.common.unavailable}</p>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center text-xs text-white/40 sm:px-6">
          {t.footer.rights}
        </div>
      </div>
    </footer>
  );
}

/** Gold ring holding a line glyph — the reference's contact treatment. */
function ContactIcon({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/40 transition-colors group-hover:border-gold"
    >
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--color-gold)"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
    </span>
  );
}
