import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Counter } from "@/components/Counter";
import { FaqList } from "@/components/FaqList";
import { HeroPlaceholder } from "@/components/HeroPlaceholder";
import { JourneyScroller } from "@/components/JourneyScroller";
import { Fact, SectionHeading } from "@/components/Sections";
import { ServiceCard } from "@/components/ServiceCard";
import { TestimonialsSlider } from "@/components/TestimonialsSlider";
import { getDictionary } from "@/lib/dictionary";
import { href, isLocale, pick, pickList, whatsappLink, type Locale } from "@/lib/i18n";
import { durationMonths, locationLabel, yearOf } from "@/lib/format";
import { signMedia } from "@/lib/media";
import {
  getFaqs,
  getPublicProjectMedia,
  getPublishedProjects,
  getServices,
  getStats,
  getTestimonials,
  getWhatsappNumber,
} from "@/lib/data";

export const revalidate = 3600;

const HERO_IMAGE = "/hero.jpg";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = getDictionary(locale);

  const [services, stats, projects, testimonials, faqs, whatsapp] = await Promise.all([
    getServices(),
    getStats(),
    getPublishedProjects({ limit: 3 }),
    getTestimonials(),
    getFaqs(),
    getWhatsappNumber(),
  ]);

  // Cover plus two supporting shots per featured project.
  const galleries = await Promise.all(projects.map((project) => getPublicProjectMedia(project.id)));
  const signedUrls = await signMedia([
    ...projects.map((project) => project.cover_image ?? ""),
    ...galleries.flat().map((media) => media.url),
  ]);

  // The hero is one real photograph dropped into /public. Until it exists the
  // section renders as a solid black panel rather than a broken image.
  const heroExists = existsSync(path.join(process.cwd(), "public", "hero.jpg"));

  const bookHref = whatsappLink(whatsapp, t.whatsapp.book);
  const askHref = whatsappLink(whatsapp, t.whatsapp.ask);

  return (
    <>
      {/*
        1 — Hero. Fills the viewport exactly, so nothing of the next (white)
        section shows before the first scroll.

        The top bar and nav are position:fixed — that is what lets them go from
        transparent to solid on scroll — so they are out of flow and cannot be
        flex children here. They already overlay this section from y=0, which
        makes the dark band they sit in exactly this element's height. The
        pt-[100px] below reserves their combined 36px + 64px so the headline can
        never slide underneath them on a short viewport.

        dvh, not vh: on mobile, 100vh is the *largest* viewport and would push
        the white section into view and add scroll while the URL bar is showing.
        The 520px floor keeps the content from clipping on short landscape phones.
      */}
      <section className="relative flex min-h-[max(100dvh,520px)] flex-col overflow-hidden bg-ink pt-[100px]">
        {heroExists ? (
          <>
            <Image
              src={HERO_IMAGE}
              alt=""
              fill
              priority
              sizes="100vw"
              className="animate-hero-zoom object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-ink/45" />
          </>
        ) : (
          <HeroPlaceholder />
        )}

        {/* Headline and the two calls to action, centred in what is left of the
            viewport below the fixed nav. flex-1 claims that leftover space and
            justify-center centres within it, so the block stays optically
            centred at any height instead of sitting against an edge. The py
            gutter keeps it off the nav and the fold on short screens. */}
        <div className="relative flex flex-1 flex-col justify-center py-10">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
            <h1
              data-reveal
              className="max-w-4xl text-4xl leading-tight text-white sm:text-5xl lg:text-6xl"
            >
              {t.hero.title}
            </h1>
            <div data-reveal className="mt-12 flex flex-wrap gap-4">
              <Link
                href={href("/works", locale)}
                className="rounded-sharp bg-gold px-8 py-4 text-sm font-medium text-ink transition-opacity hover:opacity-90"
              >
                {t.hero.ctaWorks}
              </Link>
              <a
                href={bookHref}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sharp border border-white px-8 py-4 text-sm font-medium text-white transition-colors hover:border-gold hover:text-gold"
              >
                {t.hero.ctaBook}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2 — Numbers. Hidden entirely until real figures exist. */}
      {stats.length > 0 && (
        <section className="bg-ink py-14 text-white">
          <div className="mx-auto grid max-w-7xl grid-cols-2 px-4 sm:px-6 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <div
                key={stat.id}
                className={`px-4 py-6 text-center ${
                  index % 2 !== 0 ? "border-s border-gold/30" : ""
                } ${index >= 2 ? "border-t border-gold/30 lg:border-t-0" : ""} ${
                  index === 2 ? "lg:border-s lg:border-gold/30" : ""
                }`}
              >
                <p className="brand text-3xl text-gold sm:text-4xl">
                  <Counter value={Number(stat.value)} />
                  {pick(stat, "suffix", locale) && (
                    <span className="ms-1 text-xl">{pick(stat, "suffix", locale)}</span>
                  )}
                </p>
                <p className="mt-3 text-xs leading-6 text-white/60 sm:text-sm">
                  {pick(stat, "label", locale)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3 — Services */}
      {services.length > 0 && (
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHeading title={t.services.title} subtitle={t.services.subtitle} />
            <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {services.slice(0, 6).map((service, index) => (
                <ServiceCard
                  key={service.id}
                  index={index + 1}
                  title={pick(service, "title", locale)}
                  description={pick(service, "desc", locale)}
                  bullets={pickList(service, "bullets", locale)}
                  icon={service.icon}
                />
              ))}
            </div>
            <div className="mt-12 text-center">
              <Link
                href={href("/services", locale)}
                className="border-b border-gold pb-1 text-sm text-ink transition-colors hover:text-gold"
              >
                {t.services.viewAll}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 4 — Selected projects, alternating rows */}
      {projects.length > 0 && (
        <section className="bg-paper py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHeading title={t.works.title} subtitle={t.works.subtitle} />

            <div className="mt-16 space-y-20">
              {projects.map((project, index) => {
                const media = galleries[index] ?? [];
                const cover = project.cover_image ? signedUrls.get(project.cover_image) : undefined;
                const supporting = media
                  .filter((item) => item.url !== project.cover_image)
                  .slice(0, 2)
                  .map((item) => signedUrls.get(item.url))
                  .filter((url): url is string => Boolean(url));
                const months = durationMonths(project.start_date, project.end_date);
                const year = yearOf(project.end_date ?? project.start_date);

                return (
                  <article
                    key={project.id}
                    className={`grid items-center gap-10 lg:grid-cols-2 ${
                      index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
                    }`}
                  >
                    <div className="grid grid-cols-3 gap-3">
                      {/* Wipes up from its own bottom edge as it enters. */}
                      <div
                        data-wipe
                        className="col-span-3 aspect-[4/3] overflow-hidden bg-ink/5"
                      >
                        {cover && (
                          <Image
                            src={cover}
                            alt={pick(project, "title", locale)}
                            width={1200}
                            height={900}
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            className="h-full w-full scale-105 object-cover"
                            data-parallax="0.06"
                          />
                        )}
                      </div>
                      {supporting.map((url) => (
                        <div
                          key={url}
                          data-wipe
                          className="aspect-square overflow-hidden bg-ink/5"
                        >
                          <Image
                            src={url}
                            alt=""
                            width={400}
                            height={400}
                            sizes="20vw"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="lg:px-6">
                      <h3 data-reveal className="text-2xl sm:text-3xl">
                        {pick(project, "title", locale)}
                      </h3>
                      <p data-reveal className="mt-5 text-sm leading-8 text-ink/60">
                        {pick(project, "description", locale)}
                      </p>

                      <dl className="mt-8 grid grid-cols-2 gap-y-5 border-t border-ink/10 pt-6 text-sm">
                        {project.area_m2 && (
                          <Fact label={t.works.area} value={`${project.area_m2} ${t.works.sqm}`} />
                        )}
                        {locationLabel(project.compound, project.district, locale) && (
                          <Fact
                            label={t.works.location}
                            value={locationLabel(project.compound, project.district, locale)}
                          />
                        )}
                        {months && (
                          <Fact label={t.works.duration} value={`${months} ${t.works.months}`} />
                        )}
                        {year && <Fact label={t.works.year} value={year} />}
                      </dl>

                      <Link
                        href={href(`/works/${project.slug}`, locale)}
                        className="mt-8 inline-block border-b border-gold pb-1 text-sm transition-colors hover:text-gold"
                      >
                        {t.works.title}
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-16 text-center">
              <Link
                href={href("/works", locale)}
                className="rounded-sharp bg-ink px-8 py-4 text-sm text-white transition-opacity hover:opacity-90"
              >
                {t.works.viewAll}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 5 — Client journey. All five steps visible at once; same section rhythm
          as everything else on the page. */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading title={t.journey.title} subtitle={t.journey.subtitle} />
          <div className="mt-14">
            <JourneyScroller steps={t.journey.steps} />
          </div>
        </div>
      </section>

      {/* 6 — Testimonials. Renders nothing until real, consented quotes exist. */}
      {testimonials.length > 0 && (
        <section className="bg-ink py-24 text-white">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <span aria-hidden="true" className="brand block text-7xl leading-none text-gold">
              &ldquo;
            </span>
            <div className="mt-6">
              <TestimonialsSlider
                items={testimonials.map((testimonial) => ({
                  id: testimonial.id,
                  quote: pick(testimonial, "quote", locale),
                  attribution:
                    testimonial.show_name && testimonial.client_name
                      ? [testimonial.client_name, testimonial.compound].filter(Boolean).join(" — ")
                      : [t.testimonials.anonymous, testimonial.compound].filter(Boolean).join(" — "),
                }))}
              />
            </div>
          </div>
        </section>
      )}

      {/* 7 — FAQ */}
      {faqs.length > 0 && (
        <section className="bg-paper py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <SectionHeading title={t.faq.title} subtitle={t.faq.subtitle} />
            <div className="mt-12">
              <FaqList
                items={faqs.map((faq) => ({
                  id: faq.id,
                  question: pick(faq, "question", locale),
                  answer: pick(faq, "answer", locale),
                }))}
              />
            </div>
            <div className="mt-12 text-center">
              <a
                href={askHref}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sharp bg-ink px-8 py-4 text-sm text-white transition-opacity hover:opacity-90"
              >
                {t.faq.cta}
              </a>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
