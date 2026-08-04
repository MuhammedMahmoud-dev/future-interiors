import Link from "next/link";

/**
 * The site's primary call to action: a gold pill with the label, then the arrow
 * riding in its own small circle.
 *
 * The arrow points along the reading direction — it means "onward", so it must
 * flip in Arabic rather than always pointing right.
 */

type Variant = "gold" | "outline" | "ink";

const VARIANTS: Record<Variant, { shell: string; puck: string }> = {
  gold: {
    shell: "bg-gold text-ink hover:shadow-lift",
    puck: "bg-ink/15 text-ink",
  },
  outline: {
    shell: "border border-white/70 text-white hover:border-gold hover:text-gold",
    puck: "border border-current",
  },
  ink: {
    shell: "bg-ink text-white hover:shadow-lift",
    puck: "bg-white/15 text-white",
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
  "group inline-flex items-center gap-3 rounded-pill ps-7 pe-2 py-2 text-sm font-medium transition-shadow duration-200";

export function PillButton({
  href,
  children,
  variant = "gold",
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
