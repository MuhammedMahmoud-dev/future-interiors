export function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header>
      <h2 className="text-3xl sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/55">{subtitle}</p>}
      <div className="mt-6 h-px w-16 bg-gold" />
    </header>
  );
}

/** Inner-page header. The top offset clears the fixed 36px bar + 64px nav. */
export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-b border-ink/10 bg-paper pb-16 pt-[164px]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h1 className="text-4xl sm:text-5xl">{title}</h1>
        {subtitle && <p className="mt-5 max-w-2xl text-sm leading-7 text-ink/55">{subtitle}</p>}
        <div className="mt-6 h-px w-16 bg-gold" />
      </div>
    </div>
  );
}

export function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink/40">{label}</dt>
      <dd className="mt-1">{value}</dd>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="border border-dashed border-ink/15 px-6 py-20 text-center text-sm text-ink/40">
      {message}
    </div>
  );
}
