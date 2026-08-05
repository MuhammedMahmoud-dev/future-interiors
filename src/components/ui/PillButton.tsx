import Link from "next/link";

/**
 * The site's call to action (§7): a fully rounded pill with the label, then the
 * arrow riding in its own small circle.
 *
 * No variant is gold. §7 reserves the accent for "very small touches only — the
 * active link, the monogram", and a filled gold button on every section would
 * make the accent the loudest thing on the page. Primary buttons are therefore
 * monochrome, and pick their contrast from the ground they sit on.
 *
 * The arrow points along the reading direction — it means "onward", so it flips
 * in Arabic rather than always pointing right.
 */

type Variant = "light" | "ink" | "outline";

const VARIANTS: Record<Variant, { shell: string; puck: string }> = {
  /** On a dark ground. */
  light: {
    shell: "bg-paper text-ink hover:opacity-90",
    puck: "bg-ink/10 text-ink",
  },
  /** On a light ground. */
  ink: {
    shell: "bg-ink text-white hover:opacity-90",
    puck: "bg-white/15 text-white",
  },
  /** Secondary, either ground — inherits the current text colour. */
  outline: {
    shell: "border border-current text-current hover:opacity-70",
    puck: "border border-current",
  },
};

function Inner({ children, variant }: { children: React.ReactNode; variant: Variant }) {
  return (
    <>
      <span>{children}</span>
      <span
        aria-hidden="true"
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${VARIANTS[variant].puck}`}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="rtl:-scale-x-100"
        >
          <path d="M5 12h13M12 5l7 7-7 7" />
        </svg>
      </span>
    </>
  );
}

const base =
  "inline-flex items-center gap-3 rounded-pill py-2 ps-7 pe-2 text-sm font-medium transition-opacity duration-200";

export function PillButton({
  href,
  children,
  variant = "ink",
  external = false,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  external?: boolean;
  className?: string;
}) {
  const classes = `${base} ${VARIANTS[variant].shell} ${className}`;

  // WhatsApp and tel links leave the app; internal routes use the router.
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        <Inner variant={variant}>{children}</Inner>
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      <Inner variant={variant}>{children}</Inner>
    </Link>
  );
}
