"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { href, switchLocalePath, type Locale } from "@/lib/i18n";

type NavStrings = {
  home: string;
  works: string;
  services: string;
  workSystem: string;
  about: string;
  contact: string;
  track: string;
  openMenu: string;
  closeMenu: string;
  switchLang: string;
};

export function Navbar({
  locale,
  nav,
  topbar,
  phone,
  whatsappHref,
}: {
  locale: Locale;
  nav: NavStrings;
  topbar: { call: string; whatsapp: string };
  phone: string | null;
  whatsappHref: string;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Transparent only over the homepage hero; every other page starts solid.
  const overHero = pathname === `/${locale}`;
  const solid = scrolled || !overHero || menuOpen;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [menuOpen]);

  // Navigating from the mobile panel closes it — no effect on pathname needed.
  const closeMenu = () => setMenuOpen(false);

  const links = [
    { path: "/", label: nav.home },
    { path: "/works", label: nav.works },
    { path: "/services", label: nav.services },
    { path: "/work-system", label: nav.workSystem },
    { path: "/about", label: nav.about },
    { path: "/contact", label: nav.contact },
  ];

  const isActive = (path: string) => pathname === href(path, locale);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* Thin utility bar — 36px per spec */}
      <div
        className={`h-9 border-b transition-colors duration-300 ${
          solid ? "border-white/10 bg-ink" : "border-white/15 bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 text-[11px] tracking-wide text-white/70 sm:px-6">
          {phone ? (
            <a href={`tel:${phone}`} className="transition-colors hover:text-white">
              {topbar.call} · <span dir="ltr">{phone}</span>
            </a>
          ) : (
            <span />
          )}
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-white"
          >
            {topbar.whatsapp}
          </a>
        </div>
      </div>

      <nav
        className={`border-b transition-colors duration-300 ${
          solid ? "border-white/10 bg-ink" : "border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href={href("/", locale)} className="brand tracking-[0.18em] text-lg text-white sm:text-xl">
            Future Interiors
          </Link>

          <div className="hidden items-center gap-7 lg:flex">
            {links.map((link) => (
              <Link
                key={link.path}
                href={href(link.path, locale)}
                className={`text-sm transition-colors ${
                  isActive(link.path) ? "text-accent" : "text-white/80 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={switchLocalePath(pathname, locale === "ar" ? "en" : "ar")}
              className="hidden text-xs tracking-wide text-white/70 transition-colors hover:text-white sm:block"
            >
              {nav.switchLang}
            </Link>

            <Link
              href={href("/track", locale)}
              className="hidden rounded-pill bg-paper px-6 py-2.5 text-sm font-medium text-ink transition-opacity duration-200 hover:opacity-90 sm:block"
            >
              {nav.track}
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? nav.closeMenu : nav.openMenu}
              className="p-2 text-white lg:hidden"
            >
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu: full-screen black panel entering from the right */}
      <div
        className={`fixed inset-0 top-[100px] z-40 bg-ink transition-transform duration-300 lg:hidden ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!menuOpen}
      >
        <div className="flex h-full flex-col gap-1 overflow-y-auto px-6 py-8">
          {links.map((link) => (
            <Link
              key={link.path}
              href={href(link.path, locale)}
              tabIndex={menuOpen ? 0 : -1}
              onClick={closeMenu}
              className={`border-b border-white/10 py-4 text-lg ${
                isActive(link.path) ? "text-accent" : "text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}

          <Link
            href={href("/track", locale)}
            tabIndex={menuOpen ? 0 : -1}
            onClick={closeMenu}
            className="mt-6 rounded-pill bg-paper px-5 py-4 text-center font-medium text-ink"
          >
            {nav.track}
          </Link>

          <Link
            href={switchLocalePath(pathname, locale === "ar" ? "en" : "ar")}
            tabIndex={menuOpen ? 0 : -1}
            onClick={closeMenu}
            className="mt-4 text-center text-sm text-white/70"
          >
            {nav.switchLang}
          </Link>
        </div>
      </div>
    </header>
  );
}

function MenuIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  );
}
