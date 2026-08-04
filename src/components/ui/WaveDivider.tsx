/**
 * Curved transition between a dark and a light section.
 *
 * The curve is asymmetric, so it has a reading direction. It is mirrored under
 * RTL to match — otherwise the shape sweeps against the way an Arabic reader
 * moves down the page.
 *
 * Drawn here, not taken from anywhere. `preserveAspectRatio="none"` lets one
 * path stretch to any viewport without a media query.
 */
export function WaveDivider({
  fill,
  className = "",
  flip = false,
}: {
  /** Colour of the section *arriving* below the curve. */
  fill: string;
  className?: string;
  /** Curve bulges up instead of down. */
  flip?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none relative w-full overflow-hidden leading-[0] rtl:-scale-x-100 ${className}`}
    >
      <svg
        viewBox="0 0 1440 90"
        preserveAspectRatio="none"
        className={`block h-[48px] w-full sm:h-[70px] lg:h-[90px] ${flip ? "rotate-180" : ""}`}
      >
        <path
          d="M0,42 C220,96 430,4 720,26 C980,46 1180,92 1440,54 L1440,90 L0,90 Z"
          fill={fill}
        />
      </svg>
    </div>
  );
}
