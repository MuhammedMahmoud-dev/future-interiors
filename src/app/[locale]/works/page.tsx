import { notFound } from "next/navigation";

import { EmptyState, PageHeader } from "@/components/Sections";
import { Lightbox, type GalleryImage } from "@/components/Lightbox";
import { getDictionary } from "@/lib/dictionary";
import { isLocale, type Locale } from "@/lib/i18n";
import { signMedia } from "@/lib/media";
import { getPublicProjectMedia, getPublishedProjects } from "@/lib/data";
import { localeMetadata } from "@/lib/pageMeta";

export const revalidate = 3600;

/** Canonical and hreflang for this page — never inherited from the layout. */
export function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return localeMetadata("/works", params);
}

/**
 * The portfolio is photographs and nothing else.
 *
 * It used to be project cards carrying a title, area, duration, year and
 * location, each linking to a detail page. The engineer asked for the images on
 * their own — no compound names anywhere, and no surrounding data — so the page
 * is now one gallery of every published photo, opening in a lightbox.
 */
export default async function WorksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = getDictionary(locale);

  // Completed projects only — nothing still in progress appears here.
  const projects = await getPublishedProjects({ completedOnly: true });
  const galleries = await Promise.all(projects.map((project) => getPublicProjectMedia(project.id)));

  const covers = projects.map((project) => project.cover_image).filter(Boolean) as string[];
  const shots = galleries.flat();
  const signed = await signMedia([...covers, ...shots.map((shot) => shot.url)]);

  // Cover first for each project, then its remaining photos, so the strongest
  // frame of each apartment leads rather than whatever happened to sort first.
  const collected: GalleryImage[] = projects.flatMap((project, index) => {
    const cover = project.cover_image;
    const ordered = [
      ...(cover ? [{ id: `${project.id}-cover`, url: cover }] : []),
      ...(galleries[index] ?? [])
        .filter((shot) => shot.url !== cover)
        .map((shot) => ({ id: shot.id, url: shot.url })),
    ];

    return ordered
      .map((item) => ({ id: item.id, url: signed.get(item.url), caption: "" }))
      .filter((item): item is GalleryImage => Boolean(item.url));
  });

  // A project whose cover is also one of its own media rows would otherwise
  // render the same photograph twice. This cannot catch the same picture stored
  // under two object paths — the seed is what guarantees that — but it is one
  // line against a mistake the admin makes easily.
  const images = [...new Map(collected.map((image) => [image.url, image])).values()];

  return (
    <>
      <PageHeader eyebrow={t.works.eyebrow} title={t.works.title} subtitle={t.works.pageSubtitle} />

      <section className="bg-surface py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {images.length > 0 ? (
            <Lightbox
              images={images}
              alt={t.works.photoAlt}
              closeLabel={t.works.closeGallery}
              columns={2}
            />
          ) : (
            <EmptyState message={t.works.empty} />
          )}
        </div>
      </section>
    </>
  );
}
