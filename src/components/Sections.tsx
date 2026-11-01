/**
 * A heading's words, each in its own clipped box, so Motion can raise them from
 * below a hidden line. Rendered on the server: the text is complete and readable
 * without any script, and spaces stay real spaces for copy and screen readers.
 */
export function SplitWords({ text }: { text: string }) {
  const words = text.trim().split(/\s+/);
  return (
    <>
      {words.map((word, index) => (
        <span key={index}>
          <span data-word className="inline-block overflow-hidden pb-[0.08em] -mb-[0.08em] align-top">
            <span className="inline-block">{word}</span>
          </span>
          {index < words.length - 1 ? " " : null}
        </span>
      ))}
    </>
  );
}

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

      <h2
        data-reveal="words"
        className={`text-4xl font-semibold sm:text-5xl ${dark ? "text-white" : "text-ink"}`}
      >
        <SplitWords text={title} />
      </h2>

      {subtitle && (
        <p
          data-reveal="fade"
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
        {/* Above the fold on load, so CSS (hero-rise) rather than a scroll
            reveal: it plays from the first paint, script or not, and never
            flashes the title away and back. */}
        {eyebrow && (
          <div className="hero-rise">
            <Eyebrow>{eyebrow}</Eyebrow>
          </div>
        )}

        <h1 className="hero-rise text-4xl font-semibold text-ink sm:text-5xl" style={{ animationDelay: "0.08s" }}>
          {title}
        </h1>

        {subtitle && (
          <p className="hero-rise mt-5 max-w-2xl text-base leading-8 text-muted-ink" style={{ animationDelay: "0.16s" }}>
            {subtitle}
          </p>
        )}
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
