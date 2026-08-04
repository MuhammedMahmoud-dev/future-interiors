import { ServiceIcon } from "./ServiceIcon";

export function ServiceCard({
  index,
  title,
  description,
  bullets,
  icon,
}: {
  index: number;
  title: string;
  description: string;
  bullets: string[];
  icon: string | null;
}) {
  return (
    <article
      data-reveal
      className="relative overflow-hidden rounded-card border border-ink/10 bg-paper p-8 shadow-soft transition-shadow duration-200 hover:shadow-lift"
    >
      {/* Faint background numeral, per spec */}
      <span
        aria-hidden="true"
        className="brand pointer-events-none absolute -top-4 end-2 select-none text-7xl text-ink/[0.04]"
      >
        {String(index).padStart(2, "0")}
      </span>

      <ServiceIcon name={icon} />

      <h3 className="mt-6 font-serif text-xl text-ink">{title}</h3>
      {description && <p className="mt-3 text-sm leading-7 text-body">{description}</p>}

      {bullets.length > 0 && (
        <ul className="mt-6 space-y-2 border-t border-ink/10 pt-5 text-sm text-body">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex gap-2">
              <span aria-hidden="true" className="text-gold">
                —
              </span>
              {bullet}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
