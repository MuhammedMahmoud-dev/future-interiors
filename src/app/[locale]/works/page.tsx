import { notFound } from "next/navigation";

import { EmptyState, PageHeader } from "@/components/Sections";
import { Lightbox, type GalleryImage } from "@/components/Lightbox";
import { getDictionary } from "@/lib/dictionary";
import { isLocale, type Locale } from "@/lib/i18n";
import { signMedia } from "@/lib/media";
import { getGalleryImages } from "@/lib/data";
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
 *
 * The photographs come from gallery_images, which belongs to no project. They
 * were read out of project_media until deleting a project emptied this page.
 */
export default async function WorksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = getDictionary(locale);

  /*
   * One flat, ordered list from a table of its own.
   *
   * This used to walk published projects, collect each one's media, put the
   * cover first and then dedupe by URL — machinery that existed only because
   * the photographs were attached to projects. They are not any more, so a
   * single read replaces all of it, and deleting a project cannot empty this
   * page.
   */
  const gallery = await getGalleryImages();
  const signed = await signMedia(gallery.map((image) => image.url));

  const images: GalleryImage[] = gallery
    .map((image) => ({
      id: image.id,
      url: signed.get(image.url),
      caption: "",
    }))
    .filter((image): image is GalleryImage => Boolean(image.url));

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
