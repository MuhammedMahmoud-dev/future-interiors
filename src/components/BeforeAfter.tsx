"use client";

import { useState } from "react";

/**
 * Drag-to-compare slider built on a native range input: keyboard accessible for
 * free, and no drag library. Only rendered when the project actually has a
 * before/after pair — the caller hides the whole section otherwise.
 */
export function BeforeAfter({
  before,
  after,
  beforeLabel,
  afterLabel,
  hint,
}: {
  before: string;
  after: string;
  beforeLabel: string;
  afterLabel: string;
  hint: string;
}) {
  const [position, setPosition] = useState(50);

  return (
    <figure>
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-ink/5">
        {/* eslint-disable-next-line @next/next/no-img-element -- signed URLs, sized by the container */}
        <img src={before} alt={beforeLabel} className="absolute inset-0 h-full w-full object-cover" />
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 0 0 ${position}%)` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={after} alt={afterLabel} className="h-full w-full object-cover" />
        </div>

        <div
          className="pointer-events-none absolute inset-y-0 w-px bg-accent"
          style={{ insetInlineStart: `${position}%` }}
        />

        <span className="absolute bottom-4 start-4 bg-ink/70 px-3 py-1 text-xs text-white">
          {beforeLabel}
        </span>
        <span className="absolute bottom-4 end-4 bg-ink/70 px-3 py-1 text-xs text-white">
          {afterLabel}
        </span>

        <input
          type="range"
          min={0}
          max={100}
          value={position}
          onChange={(event) => setPosition(Number(event.target.value))}
          aria-label={hint}
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>
      <figcaption className="mt-3 text-center text-xs text-muted">{hint}</figcaption>
    </figure>
  );
}
