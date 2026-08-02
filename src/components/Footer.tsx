import Link from "next/link";
import { href, type Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/dictionary";

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
    <footer className="border-t border-gold/30 bg-ink text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="brand text-xl">Future Interiors</p>
          <p className="mt-4 max-w-xs text-sm leading-7 text-white/60">{t.footer.blurb}</p>
          {/* Social links are intentionally not wired up yet — the row stays reserved. */}
        </div>

        <div>
          <h3 className="mb-5 text-sm tracking-widest text-gold">{t.footer.links}</h3>
          <ul className="space-y-3 text-sm text-white/70">
            {links.map((link) => (
              <li key={link.path}>
                <Link href={href(link.path, locale)} className="transition-colors hover:text-gold">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-5 text-sm tracking-widest text-gold">{t.footer.services}</h3>
          {services.length > 0 ? (
            <ul className="space-y-3 text-sm text-white/70">
              {services.map((service) => (
                <li key={service}>{service}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-white/40">{t.common.unavailable}</p>
          )}
        </div>

        <div>
          <h3 className="mb-5 text-sm tracking-widest text-gold">{t.footer.contact}</h3>
          <ul className="space-y-3 text-sm text-white/70">
            {phone && (
              <li>
                <a href={`tel:${phone}`} dir="ltr" className="transition-colors hover:text-gold">
                  {phone}
                </a>
              </li>
            )}
            <li>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-gold"
              >
                {t.topbar.whatsapp}
              </a>
            </li>
          </ul>
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
