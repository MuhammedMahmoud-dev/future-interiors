"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ServiceIcon } from "./ServiceIcon";

export type HeroService = {
  id: string;
  title: string;
  description: string;
  icon: string | null;
};

/**
 * The four service cards that straddle the hero's bottom edge (§8.3).
 *
 * The row is positioned by its caller — it sits in normal flow at the end of the
 * hero and is pulled down by `--hero-cards-overlap`, so half of each card is
 * over the photograph and half over the section beneath. Flow rather than
 * absolute positioning on purpose: an element placed after the headline cannot
 * cover it, whatever the viewport does.
 *
 * Four columns only survive on a desktop. Tablet gets 2 × 2, and a phone gets a
 * swipeable track with position dots — four columns squeezed onto 375px would be
 * unreadable, and a plain stack would push the section below a screen and a half
 * further down.
 */
export function HeroServices({ services, href }: { services: HeroService[]; href: string }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  // Only meaningful below md, where the track is the scrolling element.
  // scrollLeft runs negative under RTL, so it is read through abs() — without
  // that the dots stay pinned to the first card for the whole Arabic scroll.
  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const step = track.scrollWidth / services.length;
    setActive(Math.min(services.length - 1, Math.round(Math.abs(track.scrollLeft) / step)));
  };

  if (services.length === 0) return null;

  return (
    <div>
      <ul
        ref={trackRef}
        onScroll={onScroll}
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 lg:grid-cols-4"
      >
        {services.map((service) => (
          <li key={service.id} className="min-w-[82%] shrink-0 snap-center md:min-w-0">
            <Link
              href={href}
              className="group flex h-full flex-col rounded-card border border-white/15 bg-ink/70 p-6 backdrop-blur-sm transition-colors duration-200 hover:border-white/40"
            >
              <ServiceIcon name={service.icon} />

              <h2 className="mt-5 text-base font-semibold text-white">{service.title}</h2>

              {service.description && (
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/60">
                  {service.description}
                </p>
              )}

              <span
                aria-hidden="true"
                className="mt-5 flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-white/50 transition-colors group-hover:border-white group-hover:text-white"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  className="rtl:-scale-x-100"
                >
                  <path d="M5 12h13M12 5l7 7-7 7" />
                </svg>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Dots sit below the overhang, over the light section — hence ink, not white. */}
      <div className="mt-5 flex justify-center gap-2 md:hidden">
        {services.map((service, index) => (
          <span
            key={service.id}
            className={`h-1.5 w-1.5 rounded-full transition-colors ${
              index === active ? "bg-ink" : "bg-ink/25"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
