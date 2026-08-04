/**
 * Faint architectural linework tucked into a section corner.
 *
 * Drawn here from plan primitives — an envelope, a partition, a door swing, a
 * dimension run. Kept at 0.06 opacity so it reads as watermark texture and
 * never competes with type sitting over it.
 *
 * Positioned with logical properties (`start`/`end`), so in Arabic it occupies
 * the mirrored corner instead of drifting to the wrong side of the page.
 */
export function BlueprintDecor({
  corner = "end",
  className = "",
}: {
  corner?: "start" | "end";
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 320 320"
      fill="none"
      stroke="var(--color-gold)"
      strokeWidth="1"
      className={`pointer-events-none absolute top-10 hidden w-[280px] opacity-[0.06] lg:block ${
        corner === "end" ? "end-0 translate-x-1/4" : "start-0 -translate-x-1/4"
      } rtl:-scale-x-100 ${className}`}
    >
      {/* Plan envelope with an internal partition */}
      <rect x="40" y="40" width="200" height="150" />
      <path d="M40 130h110M150 130v60" />

      {/* Door swing */}
      <path d="M150 130v-40" />
      <path d="M150 90a40 40 0 0 1 40 40" />

      {/* Dimension run above the envelope */}
      <path d="M40 22h200M40 14v16M240 14v16M140 16v12" />

      {/* Secondary block, offset, to suggest a wider sheet */}
      <rect x="90" y="220" width="150" height="70" />
      <path d="M160 220v70" />
      <circle cx="205" cy="255" r="18" />
    </svg>
  );
}
