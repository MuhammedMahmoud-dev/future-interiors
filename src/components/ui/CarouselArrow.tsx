/**
 * Thin gold ring holding a chevron. Used by the project and blog-style
 * carousels.
 *
 * `direction` is *logical*: "next" points the way the reader advances, which is
 * leftward in Arabic. The glyph flips with the document, so callers never have
 * to reason about RTL themselves.
 */
export function CarouselArrow({
  direction,
  onClick,
  label,
  disabled = false,
  className = "",
}: {
  direction: "prev" | "next";
  onClick?: () => void;
  label: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`flex h-11 w-11 items-center justify-center rounded-full border border-gold/50 bg-paper/80 text-gold transition-colors duration-200 hover:border-gold hover:bg-gold hover:text-ink disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-paper/80 disabled:hover:text-gold ${className}`}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        aria-hidden="true"
        className="rtl:-scale-x-100"
      >
        <path d={direction === "next" ? "M9 5l7 7-7 7" : "M15 5l-7 7 7 7"} />
      </svg>
    </button>
  );
}
