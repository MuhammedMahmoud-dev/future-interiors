import { notFound } from "next/navigation";

import { EmptyState, PageHeader } from "@/components/Sections";
import { WorksGrid, type WorkItem } from "@/components/WorksGrid";
import { getDictionary } from "@/lib/dictionary";
import { href, isLocale, pick, type Locale } from "@/lib/i18n";
import { locationLabel, yearOf } from "@/lib/format";
import { signMedia } from "@/lib/media";
import { getPublishedProjects } from "@/lib/data";

export const revalidate = 3600;

export default async function WorksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = getDictionary(locale);

  // Completed projects only — nothing still in progress appears in the grid.
  const projects = await getPublishedProjects({ completedOnly: true });
  const covers = await signMedia(projects.map((project) => project.cover_image ?? ""));

  const items: WorkItem[] = projects.map((project) => ({
    id: project.id,
    slug: project.slug,
    title: pick(project, "title", locale),
    meta: [
      project.area_m2 ? `${project.area_m2} ${t.works.sqm}` : null,
      locationLabel(project.compound, project.district, locale) || null,
      yearOf(project.end_date ?? project.start_date),
    ]
      .filter(Boolean)
      .join(" · "),
    compound: project.compound,
    cover: project.cover_image ? (covers.get(project.cover_image) ?? null) : null,
  }));

  return (
    <>
      <PageHeader title={t.works.title} subtitle={t.works.pageSubtitle} />
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {items.length > 0 ? (
            <WorksGrid
              items={items}
              hrefFor={href("/works", locale)}
              allLabel={t.works.filterAll}
              loadMoreLabel={t.works.loadMore}
            />
          ) : (
            <EmptyState message={t.works.empty} />
          )}
        </div>
      </section>
    </>
  );
}
