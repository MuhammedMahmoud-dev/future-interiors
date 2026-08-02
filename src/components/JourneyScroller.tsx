"use client";

import { useRef, useState } from "react";

export type JourneyStep = { title: string; duration: string };

/**
 * Horizontal timeline. On desktop the five steps sit in a row; on mobile they
 * become a swipeable scroll-snap track with position dots, rather than five
 * squashed columns.
 */
export function JourneyScroller({ steps }: { steps: JourneyStep[] }) {
  const trackRef = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(0);

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
        className="no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2 md:grid md:grid-cols-5 md:gap-0 md:overflow-visible"
      >
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="min-w-[78%] shrink-0 snap-center border-t border-gold/30 pt-6 md:min-w-0 md:pe-6"
          >
            <span className="brand block text-sm text-gold">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-3 text-lg">{step.title}</h3>
            <p className="mt-2 text-sm text-ink/50">{step.duration}</p>
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
