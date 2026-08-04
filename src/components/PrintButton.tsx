"use client";

/**
 * Printing through the browser is what keeps Arabic correct: the PDF libraries
 * available in JS do not do Arabic shaping or bidi properly, while the browser's
 * own print pipeline already does both.
 */
export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-card bg-ink px-6 py-3 text-sm text-white transition-opacity hover:opacity-90 print:hidden"
    >
      {label}
    </button>
  );
}
