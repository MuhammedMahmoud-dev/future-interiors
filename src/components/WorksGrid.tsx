"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type WorkItem = {
  id: string;
  slug: string;
  title: string;
  meta: string;
  compound: string | null;
  cover: string | null;
};

const PAGE_SIZE = 6;

export function WorksGrid({
  items,
  hrefFor,
  allLabel,
  loadMoreLabel,
}: {
  items: WorkItem[];
  /** Locale-prefixed path builder, passed in so this stays a dumb client component. */
  hrefFor: string;
  allLabel: string;
  loadMoreLabel: string;
}) {
  const [compound, setCompound] = useState<string | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const compounds = useMemo(
    () => [...new Set(items.map((item) => item.compound).filter((c): c is string => Boolean(c)))],
    [items],
  );

  const filtered = compound ? items.filter((item) => item.compound === compound) : items;
  const shown = filtered.slice(0, visible);

  return (
    <div>
      {compounds.length > 1 && (
        <div className="mb-10 flex flex-wrap gap-2">
          <FilterChip
            active={compound === null}
            onClick={() => {
              setCompound(null);
              setVisible(PAGE_SIZE);
            }}
          >
            {allLabel}
          </FilterChip>
          {compounds.map((name) => (
            <FilterChip
              key={name}
              active={compound === name}
              onClick={() => {
                setCompound(name);
                setVisible(PAGE_SIZE);
              }}
            >
              {name}
            </FilterChip>
          ))}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {shown.map((item) => (
          <Link
            key={item.id}
            href={`${hrefFor}/${item.slug}`}
            className="group block overflow-hidden rounded-card border border-border bg-paper transition-colors duration-200 hover:border-ink/30"
          >
            <div className="aspect-[4/3] overflow-hidden bg-ink/5">
              {item.cover && (
                // eslint-disable-next-line @next/next/no-img-element -- signed URLs
                <img
                  src={item.cover}
                  alt={item.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
            </div>
            {/* White body below the image, per the reference's card anatomy. */}
            <div className="border-t border-border p-5">
              <h3 className="text-lg font-semibold text-ink">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-muted">{item.meta}</p>
            </div>
          </Link>
        ))}
      </div>

      {visible < filtered.length && (
        <div className="mt-14 text-center">
          <button
            type="button"
            onClick={() => setVisible((count) => count + PAGE_SIZE)}
            className="rounded-pill border border-ink px-8 py-3.5 text-sm transition-opacity duration-200 hover:opacity-70"
          >
            {loadMoreLabel}
          </button>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-pill border px-5 py-2 text-sm transition-colors ${
        active ? "border-ink bg-ink text-white" : "border-border text-body hover:border-ink"
      }`}
    >
      {children}
    </button>
  );
}
