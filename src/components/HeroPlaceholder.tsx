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
      <div className="absolute inset-0 bg-[linear-gradient(158deg,#1E1F23_0%,#16171A_48%,#0E0F11_100%)]" />

      {/* Faint warm lift behind the monogram so the centre reads as lit. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_42%,rgba(201,162,39,0.10),transparent_70%)]" />

      {/* Drafting grid: fine 48px squares, heavier every 240px.
          Layers below carry data-parallax and are over-sized vertically so
          drifting them never exposes an edge. */}
      <div
        className="absolute inset-x-0 -inset-y-[14%]"
        data-parallax="0.12"
        style={{
          backgroundImage: [
            "repeating-linear-gradient(to right, rgba(201,162,39,0.06) 0 1px, transparent 1px 48px)",
            "repeating-linear-gradient(to bottom, rgba(201,162,39,0.06) 0 1px, transparent 1px 48px)",
            "repeating-linear-gradient(to right, rgba(201,162,39,0.10) 0 1px, transparent 1px 240px)",
            "repeating-linear-gradient(to bottom, rgba(201,162,39,0.10) 0 1px, transparent 1px 240px)",
          ].join(","),
        }}
      />

      {/* Floor-plan motif: walls, a door swing, and a dimension run. */}
      <svg
        className="absolute inset-x-0 -inset-y-[14%] h-[128%] w-full"
        data-parallax="0.2"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        stroke="#c9a227"
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
          <path d="M150 240v70M150 470v70" strokeWidth="3" stroke="#16171A" />
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

      {/* Monogram: outlined, centred, deliberately quiet. Now that the headline
          is centred too it sits directly behind the type, so the stroke is
          lighter than it was when the text sat at the bottom — a watermark, not
          a second thing competing for the eye.
          Drifts fastest, so it reads as the nearest layer. */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        data-parallax="0.3"
      >
        <span
          className="brand select-none leading-none text-transparent"
          style={{
            fontSize: "clamp(9rem, 30vw, 26rem)",
            WebkitTextStroke: "1.25px rgba(201,162,39,0.13)",
          }}
        >
          FI
        </span>
      </div>

      {/* Settles the drawing behind the type. This used to be a bottom-up ramp,
          because the headline sat at the bottom; the headline is centred now, so
          the weight is centred with it and both edges stay open enough for the
          plan and the registration marks to still read. */}
      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(22,23,26,0.55)_0%,rgba(22,23,26,0.62)_30%,rgba(22,23,26,0.62)_70%,rgba(22,23,26,0.30)_100%)]" />
    </div>
  );
}
