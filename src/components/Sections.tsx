/**
 * Shared section furniture.
 *
 * §7 puts a small, widely-tracked uppercase label above every section heading.
 * It is grey, not gold: the accent is reserved for the few places the spec names
 * (the active nav link, the monogram), and a gold label on every section would
 * make it the loudest thing on the page.
 *
 * Uppercase is a Latin device — Arabic has no case, so forcing it there does
 * nothing but strip the tracking's purpose. It is applied per direction.
 */
export function Eyebrow({
  children,
  tone = "light",
}: {
  children: React.ReactNode;
  /** The ground it sits on. */
  tone?: "light" | "dark";
}) {
  return (
    <span
      className={`mb-4 block text-xs tracking-[0.22em] ltr:uppercase ${
        tone === "dark" ? "text-white/50" : "text-muted-ink"
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
  tone = "light",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "start" | "center";
  tone?: "light" | "dark";
}) {
  const centered = align === "center";
  const dark = tone === "dark";

  return (
    <header className={centered ? "text-center" : ""}>
      {eyebrow && <Eyebrow tone={tone}>{eyebrow}</Eyebrow>}

      <h2 className={`text-4xl font-semibold sm:text-5xl ${dark ? "text-white" : "text-ink"}`}>
        {title}
      </h2>

      {subtitle && (
        <p
          className={`mt-5 max-w-2xl text-base leading-8 ${dark ? "text-white/60" : "text-muted-ink"} ${
            centered ? "mx-auto" : ""
          }`}
        >
          {subtitle}
        </p>
      )}
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
    <div className="border-b border-border bg-surface pb-16 pt-[164px]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}

        <h1 className="text-4xl font-semibold text-ink sm:text-5xl">{title}</h1>

        {subtitle && <p className="mt-5 max-w-2xl text-base leading-8 text-muted-ink">{subtitle}</p>}
      </div>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-card border border-dashed border-border px-6 py-20 text-center text-sm text-muted-ink">
      {message}
    </div>
  );
}
