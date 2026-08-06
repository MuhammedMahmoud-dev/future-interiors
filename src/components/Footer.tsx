import Link from "next/link";
import { href, type Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/dictionary";

/**
 * Four columns (§8.12): brand, links, services, contact — then the copyright
 * line. The social row is laid out but deliberately not wired up: there are no
 * accounts to point it at yet, and inventing them would be fake content.
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
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-4">
          {/* 1 — Brand */}
          <div>
            <p className="brand text-xl tracking-[0.18em]">Future Interiors</p>
            <p className="mt-5 max-w-xs text-sm leading-7 text-white/50">{t.footer.blurb}</p>

            <p className="mt-8 text-xs tracking-[0.22em] text-white/60 ltr:uppercase">
              {t.footer.social}
            </p>
            {/* Reserved, not active — there are no accounts to link to yet. */}
            <div aria-hidden="true" className="mt-3 flex gap-2">
              {[0, 1, 2].map((slot) => (
                <span key={slot} className="h-9 w-9 rounded-full border border-white/15" />
              ))}
            </div>
          </div>

          {/* 2 — Links */}
          <nav>
            <h2 className="mb-5 text-xs tracking-[0.22em] text-white/60 ltr:uppercase">
              {t.footer.links}
            </h2>
            <ul className="space-y-3 text-sm text-white/70">
              {links.map((link) => (
                <li key={link.path}>
                  <Link href={href(link.path, locale)} className="transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* 3 — Services */}
          <div>
            <h2 className="mb-5 text-xs tracking-[0.22em] text-white/60 ltr:uppercase">
              {t.footer.services}
            </h2>
            {services.length > 0 ? (
              <ul className="space-y-3 text-sm text-white/70">
                {services.map((service) => (
                  <li key={service}>{service}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-white/60">{t.common.unavailable}</p>
            )}
          </div>

          {/* 4 — Contact */}
          <div>
            <h2 className="mb-5 text-xs tracking-[0.22em] text-white/60 ltr:uppercase">
              {t.footer.contact}
            </h2>
            <ul className="space-y-4 text-sm">
              {phone && (
                <li>
                  <a
                    href={`tel:${phone}`}
                    className="flex items-center gap-3 text-white/70 transition-colors hover:text-white"
                  >
                    <ContactIcon>
                      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.8a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.8 2.1Z" />
                    </ContactIcon>
                    <span className="brand" dir="ltr">
                      {phone}
                    </span>
                  </a>
                </li>
              )}

              <li>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-white/70 transition-colors hover:text-white"
                >
                  <ContactIcon>
                    <path d="M21 11.5a8.4 8.4 0 0 1-12.6 7.3L3 20.5l1.8-5.2A8.4 8.4 0 1 1 21 11.5Z" />
                  </ContactIcon>
                  <span>{t.topbar.whatsapp}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center text-xs text-white/60 sm:px-6">
          {t.footer.rights}
        </div>
      </div>
    </footer>
  );
}

/** A thin ring holding a line glyph — §8.12's "contact details with icons". */
function ContactIcon({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
    </span>
  );
}
