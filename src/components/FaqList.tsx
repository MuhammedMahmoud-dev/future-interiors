/**
 * Native <details> — multiple questions can be open at once with no JavaScript,
 * which is exactly the behaviour the spec asks for.
 */
export function FaqList({ items }: { items: { id: string; question: string; answer: string }[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <details
          key={item.id}
          className="group overflow-hidden rounded-card border border-border bg-paper"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 px-6 py-5 text-start text-lg text-ink marker:hidden">
            {item.question}
            <span
              aria-hidden="true"
              className="shrink-0 text-2xl leading-none text-accent transition-transform duration-200 group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="border-t border-border px-6 py-5 text-base leading-8 text-body">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
