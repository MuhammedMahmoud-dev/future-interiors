/**
 * Small gold label that sits above a section title.
 *
 * Uppercase is a Latin device — Arabic has no case, so forcing it there does
 * nothing but strip the tracking's purpose. The transform is applied per
 * direction rather than globally.
 */
export function Eyebrow({
  children,
  tone = "light",
}: {
  children: React.ReactNode;
  /** The ground it sits on — decides which gold clears 4.5:1 contrast. */
  tone?: "light" | "dark";
}) {
  return (
    <span
      data-reveal
      className={`mb-3 block text-xs tracking-[0.28em] ltr:uppercase ${
        tone === "dark" ? "text-gold" : "text-gold-ink"
      }`}
    >
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "start",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Centred is the reference's default for section headers. */
  align?: "start" | "center";
}) {
  const centered = align === "center";

  return (
    <header className={centered ? "text-center" : ""}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}

      <h2 data-reveal className="font-serif text-3xl text-ink sm:text-4xl">
        {title}
      </h2>

      {subtitle && (
        <p
          data-reveal
          className={`mt-4 max-w-2xl text-sm leading-7 text-body ${centered ? "mx-auto" : ""}`}
        >
          {subtitle}
        </p>
      )}

      {/* Draws itself from the inline start — the brand mark in motion. */}
      <div data-rule className={`mt-6 h-px w-16 bg-gold ${centered ? "mx-auto" : ""}`} />
    </header>
  );
}

/** Inner-page header. The top offset clears the fixed 36px bar + 64px nav. */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="relative overflow-hidden border-b border-ink/10 bg-cream pb-16 pt-[164px]">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}

        <h1 data-reveal className="font-serif text-4xl text-ink sm:text-5xl">
          {title}
        </h1>

        {subtitle && (
          <p data-reveal className="mt-5 max-w-2xl text-sm leading-7 text-body">
            {subtitle}
          </p>
        )}

        <div data-rule className="mt-6 h-px w-16 bg-gold" />
      </div>
    </div>
  );
}

export function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 text-ink">{value}</dd>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-card border border-dashed border-ink/15 px-6 py-20 text-center text-sm text-muted">
      {message}
    </div>
  );
}
