/**
 * Temporary hero backdrop, shown only while `public/hero.jpg` is missing.
 *
 * A blueprint reads as "engineering supervision" without pretending to be a
 * finished apartment — better than a stock photo of someone else's work.
 *
 * The gradient here is a deliberate, scoped exception to the brand's no-gradient
 * rule: it exists so an empty hero still has depth. Dropping the real photo in
 * removes this component from the render entirely, so the exception leaves the
 * rest of the system untouched.
 *
 * Pure CSS and inline SVG — no image weight, crisp at any viewport.
 */
export function HeroPlaceholder() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-ink">
      {/* Base wash: charcoal falling away toward the corners. */}
      <div className="absolute inset-0 bg-[linear-gradient(158deg,#181818_0%,#101010_48%,#080808_100%)]" />

      {/* Faint warm lift behind the monogram so the centre reads as lit. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_42%,rgba(198,166,100,0.10),transparent_70%)]" />

      {/* Drafting grid: fine 48px squares, heavier every 240px. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            "repeating-linear-gradient(to right, rgba(198,166,100,0.06) 0 1px, transparent 1px 48px)",
            "repeating-linear-gradient(to bottom, rgba(198,166,100,0.06) 0 1px, transparent 1px 48px)",
            "repeating-linear-gradient(to right, rgba(198,166,100,0.10) 0 1px, transparent 1px 240px)",
            "repeating-linear-gradient(to bottom, rgba(198,166,100,0.10) 0 1px, transparent 1px 240px)",
          ].join(","),
        }}
      />

      {/* Floor-plan motif: walls, a door swing, and a dimension run. */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        stroke="#c6a664"
        strokeWidth="1.25"
      >
        <g opacity="0.22">
          {/* Outer envelope */}
          <rect x="150" y="170" width="560" height="420" />
          {/* Internal partitions */}
          <path d="M150 400h250M400 400v190M400 300h310" />
          {/* Door swing */}
          <path d="M400 400v-60" opacity="0.7" />
          <path d="M400 340a60 60 0 0 1 60 60" opacity="0.7" />
          {/* Window openings, drawn as breaks in the wall */}
          <path d="M150 240v70M150 470v70" strokeWidth="3" stroke="#101010" />
          <path d="M150 240v70M150 470v70" strokeWidth="1.25" />
        </g>

        <g opacity="0.16">
          {/* Second block, offset, to suggest a wider drawing sheet */}
          <rect x="880" y="330" width="410" height="300" />
          <path d="M880 480h180M1060 330v300" />
          <circle cx="1180" cy="560" r="34" />
        </g>

        {/* Dimension run along the top of the first plan */}
        <g opacity="0.28">
          <path d="M150 130h560" />
          <path d="M150 120v20M710 120v20M430 122v16" />
        </g>

        {/* Registration marks at the sheet corners */}
        <g opacity="0.3">
          <path d="M60 60h46M60 60v46" />
          <path d="M1380 60h-46M1380 60v46" />
          <path d="M60 840h46M60 840v-46" />
          <path d="M1380 840h-46M1380 840v-46" />
        </g>
      </svg>

      {/* Monogram: outlined, centred, deliberately quiet. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="brand select-none leading-none text-transparent"
          style={{
            fontSize: "clamp(9rem, 30vw, 26rem)",
            WebkitTextStroke: "1.25px rgba(198,166,100,0.20)",
          }}
        >
          FI
        </span>
      </div>

      {/* Keeps the headline legible over the busiest part of the grid. */}
      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(16,16,16,0.85)_0%,rgba(16,16,16,0.35)_45%,transparent_75%)]" />
    </div>
  );
}
