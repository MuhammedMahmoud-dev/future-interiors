/**
 * Native <details> — multiple questions can be open at once with no JavaScript,
 * which is exactly the behaviour the spec asks for.
 */
export function FaqList({ items }: { items: { id: string; question: string; answer: string }[] }) {
  return (
    <div className="divide-y divide-ink/10 border-y border-ink/10">
      {items.map((item) => (
        <details key={item.id} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-start text-lg marker:hidden">
            {item.question}
            <span
              aria-hidden="true"
              className="shrink-0 text-2xl leading-none text-gold transition-transform duration-200 group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="pb-6 text-sm leading-8 text-ink/65">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
