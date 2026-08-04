import { ServiceIcon } from "./ServiceIcon";

/**
 * A service as a ringed icon with a short caption beneath — the row treatment
 * used on the homepage. The expanded card version lives on /services.
 *
 * Dividers are drawn with a logical border so the row reads correctly in both
 * directions without a second rule.
 */
export function ServiceCircle({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string | null;
}) {
  return (
    <div
      data-reveal
      className="group flex flex-col items-center px-4 text-center sm:border-e sm:border-ink/10 sm:last:border-e-0"
    >
      <span className="flex h-20 w-20 items-center justify-center rounded-full border border-gold/45 bg-paper transition-colors duration-200 group-hover:border-gold group-hover:bg-gold/10">
        <ServiceIcon name={icon} />
      </span>

      <h3 className="mt-5 font-serif text-lg leading-snug text-ink">{title}</h3>

      {description && (
        <p className="mt-2 text-xs leading-6 text-body">{description}</p>
      )}
    </div>
  );
}
