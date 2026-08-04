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
      className="relative overflow-hidden border border-ink/10 bg-white p-8 transition-colors hover:border-gold"
    >
      {/* Faint background numeral, per spec */}
      <span
        aria-hidden="true"
        className="brand pointer-events-none absolute -top-4 end-2 select-none text-7xl text-ink/[0.04]"
      >
        {String(index).padStart(2, "0")}
      </span>

      <ServiceIcon name={icon} />

      <h3 className="mt-6 text-xl">{title}</h3>
      {description && <p className="mt-3 text-sm leading-7 text-ink/60">{description}</p>}

      {bullets.length > 0 && (
        <ul className="mt-6 space-y-2 border-t border-ink/10 pt-5 text-sm text-ink/70">
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
