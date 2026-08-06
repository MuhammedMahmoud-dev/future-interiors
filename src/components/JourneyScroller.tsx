"use client";

import { useRef, useState } from "react";

export type JourneyStep = { title: string; duration: string };

/**
 * The five stages of the client journey (§8.7): numbered cards with thin
 * borders in a row, small arrows between them.
 *
 * Desktop shows all five at once. An earlier version pinned the section and
 * scrubbed the steps sideways, which looked cinematic but only ever framed
 * about three of them — the rest read as missing, and the pin reserved roughly
 * 1,500px of scroll that showed up as a dead gap before the next section.
 *
 * Mobile keeps the horizontal swipe with scroll-snap and position dots, because
 * five columns will not fit a phone either way. The arrows are hidden there:
 * the swipe already says "there is more this way".
 */
export function JourneyScroller({ steps }: { steps: JourneyStep[] }) {
  const trackRef = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(0);

  // Only meaningful on mobile, where the track is the scrolling element.
  // scrollLeft is negative under RTL, hence the abs().
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
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-[repeat(5,1fr)] lg:gap-0 lg:overflow-visible"
      >
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="flex min-w-[78%] shrink-0 snap-center items-stretch sm:min-w-[52%] lg:min-w-0"
          >
            <div className="flex-1 rounded-card border border-border bg-paper p-6">
              <span className="brand block text-sm text-accent-ink">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-ink">{step.duration}</p>
            </div>

            {/* The connector between cards — never after the last one. */}
            {index < steps.length - 1 && (
              <span
                aria-hidden="true"
                className="hidden shrink-0 items-center px-2 text-muted-ink lg:flex"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="rtl:-scale-x-100"
                >
                  <path d="M5 12h13M12 5l7 7-7 7" />
                </svg>
              </span>
            )}
          </li>
        ))}
      </ol>

      <div className="mt-6 flex justify-center gap-2 lg:hidden">
        {steps.map((step, index) => (
          <span
            key={step.title}
            className={`h-1.5 w-1.5 rounded-full transition-colors ${
              index === active ? "bg-accent" : "bg-ink/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
