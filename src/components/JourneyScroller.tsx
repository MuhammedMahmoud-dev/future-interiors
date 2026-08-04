"use client";

import { useRef, useState } from "react";

export type JourneyStep = { title: string; duration: string };

/**
 * The five stages of the client journey.
 *
 * Desktop shows all five at once. An earlier version pinned the section and
 * scrubbed the steps sideways, which looked cinematic but only ever framed
 * about three of them — the rest read as missing, and the pin reserved roughly
 * 1,500px of scroll that showed up as a dead gap before the next section.
 *
 * Mobile keeps the horizontal swipe with scroll-snap and position dots, because
 * five columns will not fit a phone either way.
 */
export function JourneyScroller({ steps }: { steps: JourneyStep[] }) {
  const trackRef = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(0);

  // Only meaningful on mobile, where the track is the scrolling element.
  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const step = track.scrollWidth / steps.length;
    setActive(Math.min(steps.length - 1, Math.round(Math.abs(track.scrollLeft) / step)));
  };

  return (
    <div>
      <ol
        ref={trackRef}
        onScroll={onScroll}
        className="no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-12 md:overflow-visible lg:grid-cols-5 lg:gap-x-6"
      >
        {steps.map((step, index) => (
          <li
            key={step.title}
            data-reveal
            className="min-w-[78%] shrink-0 snap-center border-t border-gold/30 pt-6 sm:min-w-[52%] md:min-w-0 md:pe-2"
          >
            <span className="brand block text-sm text-gold">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-3 font-serif text-lg text-ink">{step.title}</h3>
            <p className="mt-2 text-sm text-muted">{step.duration}</p>
          </li>
        ))}
      </ol>

      <div className="mt-6 flex justify-center gap-2 md:hidden">
        {steps.map((step, index) => (
          <span
            key={step.title}
            className={`h-1.5 w-1.5 rounded-full transition-colors ${
              index === active ? "bg-gold" : "bg-ink/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
