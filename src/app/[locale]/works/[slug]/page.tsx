import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BeforeAfter } from "@/components/BeforeAfter";
import { Lightbox } from "@/components/Lightbox";
import { Fact, SectionHeading } from "@/components/Sections";
import { getDictionary } from "@/lib/dictionary";
import { href, isLocale, pick, whatsappLink, type Locale } from "@/lib/i18n";
import { durationMonths, locationLabel, yearOf } from "@/lib/format";
import { signMedia } from "@/lib/media";
import {
  getProjectBySlug,
  getProjectStages,
  getPublicProjectMedia,
  getPublishedProjects,
  getStages,
  getWhatsappNumber,
} from "@/lib/data";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const project = await getProjectBySlug(slug);
  if (!project) return {};
  return {
    title: pick(project, "title", locale),
    description: pick(project, "description", locale).slice(0, 160),
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = getDictionary(locale);

  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const [media, stages, projectStages, related, whatsapp] = await Promise.all([
    getPublicProjectMedia(project.id),
    getStages(),
    getProjectStages(project.id),
    getPublishedProjects({ limit: 4 }),
    getWhatsappNumber(),
  ]);

  const signed = await signMedia([project.cover_image ?? "", ...media.map((item) => item.url)]);
  const urlOf = (path: string | null) => (path ? (signed.get(path) ?? null) : null);

  const cover = urlOf(project.cover_image);
  const months = durationMonths(project.start_date, project.end_date);
  const year = yearOf(project.end_date ?? project.start_date);
  const location = locationLabel(project.compound, project.district, locale);

  // The before/after section only exists when there is a genuine pair.
  // Older projects with result-only photos simply do not render it.
  const beforeShot = media.find((item) => item.phase === "before");
  const afterShot = media.find((item) => item.phase === "after");
  const beforeUrl = urlOf(beforeShot?.url ?? null);
  const afterUrl = urlOf(afterShot?.url ?? null);

  const statusLabel = {
    done: t.project.stageDone,
    in_progress: t.project.stageInProgress,
    not_started: t.project.stageNotStarted,
  } as const;

  const stageBlocks = stages.map((stage) => ({
    id: stage.id,
    name: pick(stage, "name", locale),
    progress: projectStages.find((row) => row.stage_id === stage.id),
    shots: media
      .filter((item) => item.stage_id === stage.id)
      .map((item) => ({ id: item.id, url: urlOf(item.url), caption: pick(item, "caption", locale) }))
      .filter((item): item is { id: string; url: string; caption: string } => Boolean(item.url)),
  }));
  const hasStageProgress = stageBlocks.some((block) => block.progress || block.shots.length > 0);

  const gallery = media
    .map((item) => ({ id: item.id, url: urlOf(item.url), caption: pick(item, "caption", locale) }))
    .filter((item): item is { id: string; url: string; caption: string } => Boolean(item.url));

  const others = related.filter((item) => item.id !== project.id).slice(0, 3);
  const otherCovers = await signMedia(others.map((item) => item.cover_image ?? ""));

  return (
    <>
      {/* Cover */}
      <section className="relative h-[70vh] min-h-[420px] overflow-hidden bg-ink">
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element -- signed URL
          <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-75" />
        )}
        <div className="absolute inset-0 bg-ink/40" />
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
            <h1 className="max-w-3xl text-3xl text-white sm:text-5xl">
              {pick(project, "title", locale)}
            </h1>
          </div>
        </div>
      </section>

      {/* Fact bar — public metadata only, never a unit or building number */}
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <dl className="grid grid-cols-2 gap-y-8 py-10 text-sm lg:grid-cols-4">
            {project.area_m2 && (
              <Fact label={t.works.area} value={`${project.area_m2} ${t.works.sqm}`} />
            )}
            {location && <Fact label={t.works.location} value={location} />}
            {months && <Fact label={t.works.duration} value={`${months} ${t.works.months}`} />}
            {year && <Fact label={t.works.year} value={year} />}
          </dl>
        </div>
      </section>

      {/* Description */}
      {pick(project, "description", locale) && (
        <section className="py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <SectionHeading title={t.project.about} />
            <p className="mt-8 whitespace-pre-line text-sm leading-9 text-body">
              {pick(project, "description", locale)}
            </p>
          </div>
        </section>
      )}

      {/* Before / after — auto-hidden without a matching pair */}
      {beforeUrl && afterUrl && (
        <section className="bg-surface py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <SectionHeading title={t.project.beforeAfter} />
            <div className="mt-10">
              <BeforeAfter
                before={beforeUrl}
                after={afterUrl}
                beforeLabel={t.project.before}
                afterLabel={t.project.after}
                hint={t.project.dragHint}
              />
            </div>
          </div>
        </section>
      )}

      {/* Stage timeline */}
      {hasStageProgress && (
        <section className="py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <SectionHeading title={t.project.timeline} />
            <ol className="mt-12 space-y-12">
              {stageBlocks.map((block, index) => (
                <li key={block.id} className="grid gap-6 sm:grid-cols-[auto_1fr]">
                  <span className="brand text-sm text-accent">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="border-s border-accent/30 ps-6">
                    <div className="flex flex-wrap items-baseline gap-3">
                      <h3 className="text-lg text-ink">{block.name}</h3>
                      {block.progress && (
                        <span
                          className={`text-xs ${
                            block.progress.status === "done" ? "text-accent" : "text-muted"
                          }`}
                        >
                          {statusLabel[block.progress.status]}
                        </span>
                      )}
                    </div>

                    {block.progress && pick(block.progress, "note", locale) && (
                      <p className="mt-3 text-sm leading-7 text-body">
                        {pick(block.progress, "note", locale)}
                      </p>
                    )}

                    {block.shots.length > 0 && (
                      <div className="mt-5 grid grid-cols-3 gap-3">
                        {block.shots.map((shot) => (
                          <div key={shot.id} className="aspect-square overflow-hidden rounded-card bg-ink/5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={shot.url}
                              alt={shot.caption}
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* Full gallery */}
      {gallery.length > 0 && (
        <section className="bg-surface py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading title={t.project.gallery} />
            <div className="mt-10">
              <Lightbox images={gallery} closeLabel={t.project.closeGallery} />
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-ink py-24 text-center text-white">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <h2 className="text-3xl">{t.project.ctaTitle}</h2>
          <p className="mt-4 text-sm text-white/60">{t.project.ctaText}</p>
          <a
            href={whatsappLink(
              whatsapp,
              `${t.whatsapp.project} "${pick(project, "title", locale)}" ${t.whatsapp.projectSuffix}`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-10 inline-block rounded-card bg-ink px-8 py-4 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            {t.project.ctaButton}
          </a>
        </div>
      </section>

      {/* Related */}
      {others.length > 0 && (
        <section className="bg-surface py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHeading title={t.project.related} />
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {others.map((other) => {
                const otherCover = other.cover_image
                  ? otherCovers.get(other.cover_image)
                  : undefined;
                return (
                  <Link
                    key={other.id}
                    href={href(`/works/${other.slug}`, locale)}
                    className="group block"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-ink/5">
                      {otherCover && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={otherCover}
                          alt={pick(other, "title", locale)}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                    </div>
                    <h3 className="mt-4 text-base text-ink transition-colors group-hover:text-ink">
                      {pick(other, "title", locale)}
                    </h3>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
