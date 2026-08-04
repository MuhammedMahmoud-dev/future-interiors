import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import { notFound } from "next/navigation";

import { Counter } from "@/components/Counter";
import { FaqList } from "@/components/FaqList";
import { HeroPlaceholder } from "@/components/HeroPlaceholder";
import { JourneyScroller } from "@/components/JourneyScroller";
import { Eyebrow, Fact, SectionHeading } from "@/components/Sections";
import { ServiceCircle } from "@/components/ServiceCircle";
import { TestimonialsSlider } from "@/components/TestimonialsSlider";
import { BlueprintDecor } from "@/components/ui/BlueprintDecor";
import { PillButton } from "@/components/ui/PillButton";
import { WaveDivider } from "@/components/ui/WaveDivider";
import { getDictionary } from "@/lib/dictionary";
import { href, isLocale, pick, whatsappLink, type Locale } from "@/lib/i18n";
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

  const heroExists = existsSync(path.join(process.cwd(), "public", "hero.jpg"));

  const bookHref = whatsappLink(whatsapp, t.whatsapp.book);
  const askHref = whatsappLink(whatsapp, t.whatsapp.ask);

  // The reference leads with one oversized figure. Rather than invent it, the
  // first configured stat is promoted and the rest form the row beneath — so
  // this stays driven entirely by site_stats.
  const [leadStat, ...restStats] = stats;

  return (
    <>
      {/*
        1 — Hero. Fills the viewport exactly, so nothing of the next section
        shows before the first scroll — which is why the wave divider opens the
        *next* section rather than closing this one.

        The top bar and nav are position:fixed, so pt-[100px] reserves their
        combined height. dvh, not vh, so mobile URL-bar chrome cannot push the
        following section into view.
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

        <div className="relative flex flex-1 flex-col justify-center py-10">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
            <h1
              data-reveal
              className="max-w-4xl font-serif text-4xl leading-tight text-white sm:text-5xl lg:text-6xl"
            >
              {t.hero.title}
            </h1>

            <div data-reveal className="mt-12 flex flex-wrap gap-4">
              <PillButton href={href("/works", locale)}>{t.hero.ctaWorks}</PillButton>
              <PillButton href={bookHref} variant="outline" external>
                {t.hero.ctaBook}
              </PillButton>
            </div>
          </div>
        </div>
      </section>

      {/* 2 — Featured projects. Only published, consented projects, and only
             public fields — the filter lives in lib/data.ts and is untouched. */}
      {projects.length > 0 && (
        <>
          <WaveDivider className="bg-ink" fill="var(--color-cream)" />
          <section className="relative overflow-hidden bg-cream py-20 sm:py-24">
            <BlueprintDecor corner="end" />

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
              <SectionHeading
                eyebrow={t.works.eyebrow}
                title={t.works.title}
                subtitle={t.works.subtitle}
                align="center"
              />

              <div className="mt-16 space-y-20">
                {projects.map((project, index) => {
                  const media = galleries[index] ?? [];
                  const cover = project.cover_image
                    ? signedUrls.get(project.cover_image)
                    : undefined;
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
                        <div
                          data-wipe
                          className="col-span-3 aspect-[4/3] overflow-hidden rounded-card bg-ink/5 shadow-soft"
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
                            className="aspect-square overflow-hidden rounded-card bg-ink/5 shadow-soft"
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
                        <h3 data-reveal className="font-serif text-2xl text-ink sm:text-3xl">
                          {pick(project, "title", locale)}
                        </h3>
                        <p data-reveal className="mt-5 text-sm leading-8 text-body">
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

                        <div className="mt-8">
                          <PillButton href={href(`/works/${project.slug}`, locale)} variant="ink">
                            {t.works.title}
                          </PillButton>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="mt-16 text-center">
                <PillButton href={href("/works", locale)} variant="ink">
                  {t.works.viewAll}
                </PillButton>
              </div>
            </div>
          </section>
        </>
      )}

      {/* 3 — Experience. Hidden entirely until real figures exist; the numbers
             are exactly the site_stats rows, nothing invented. */}
      {stats.length > 0 && (
        <>
          <WaveDivider className="bg-cream" fill="var(--color-ink)" />
          <section className="bg-ink py-20 text-white sm:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,340px)_1fr]">
                {/* The lead figure, ringed like the reference's "15+ Years". */}
                <div className="relative flex items-center justify-center">
                  <span
                    aria-hidden="true"
                    className="absolute h-56 w-56 rounded-full border border-gold/20 sm:h-64 sm:w-64"
                  />
                  <p className="relative text-center">
                    <span className="block font-serif text-6xl text-gold sm:text-7xl">
                      <Counter value={Number(leadStat.value)} />
                      {pick(leadStat, "suffix", locale) && (
                        <span className="text-4xl">{pick(leadStat, "suffix", locale)}</span>
                      )}
                    </span>
                    <span className="mt-2 block text-sm text-white/70">
                      {pick(leadStat, "label", locale)}
                    </span>
                  </p>
                </div>

                <div>
                  <Eyebrow>{t.stats.eyebrow}</Eyebrow>
                  <h2 data-reveal className="font-serif text-3xl text-white sm:text-4xl">
                    {t.stats.title}
                  </h2>
                  <div data-rule className="mt-6 h-px w-16 bg-gold" />

                  {restStats.length > 0 && (
                    <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-3">
                      {restStats.map((stat) => (
                        <div key={stat.id} className="flex items-center gap-3">
                          <span
                            aria-hidden="true"
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/40"
                          >
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="var(--color-gold)"
                              strokeWidth="1.25"
                            >
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                          </span>
                          <span>
                            <span className="block text-lg text-gold">
                              <Counter value={Number(stat.value)} />
                              {pick(stat, "suffix", locale) && (
                                <span className="ms-1 text-sm">{pick(stat, "suffix", locale)}</span>
                              )}
                            </span>
                            <span className="block text-xs leading-5 text-white/60">
                              {pick(stat, "label", locale)}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* 4 — Services: one ringed icon per service, from the database. */}
      {services.length > 0 && (
        <>
          <WaveDivider className="bg-ink" fill="var(--color-cream)" />
          <section className="relative overflow-hidden bg-cream py-20 sm:py-24">
            <BlueprintDecor corner="start" />

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
              <SectionHeading
                eyebrow={t.services.eyebrow}
                title={t.services.title}
                subtitle={t.services.subtitle}
                align="center"
              />

              <div className="mt-14 grid grid-cols-2 gap-y-12 sm:grid-cols-3 lg:grid-cols-6">
                {services.slice(0, 6).map((service) => (
                  <ServiceCircle
                    key={service.id}
                    title={pick(service, "title", locale)}
                    description={pick(service, "desc", locale)}
                    icon={service.icon}
                  />
                ))}
              </div>

              <div className="mt-14 text-center">
                <PillButton href={href("/services", locale)} variant="ink">
                  {t.services.viewAll}
                </PillButton>
              </div>
            </div>
          </section>
        </>
      )}

      {/* 5 — Client journey. All five steps visible at once. */}
      <section className="bg-paper py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow={t.journey.eyebrow}
            title={t.journey.title}
            subtitle={t.journey.subtitle}
            align="center"
          />
          <div className="mt-14">
            <JourneyScroller steps={t.journey.steps} />
          </div>
        </div>
      </section>

      {/* 6 — Testimonials. Renders nothing until real, consented quotes exist. */}
      {testimonials.length > 0 && (
        <>
          <WaveDivider className="bg-paper" fill="var(--color-ink)" />
          <section className="bg-ink py-20 text-white sm:py-24">
            <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
              <Eyebrow>{t.testimonials.eyebrow}</Eyebrow>
              <span aria-hidden="true" className="block font-serif text-7xl leading-none text-gold">
                &ldquo;
              </span>
              <div className="mt-6 text-start">
                <TestimonialsSlider
                  items={testimonials.map((testimonial) => ({
                    id: testimonial.id,
                    quote: pick(testimonial, "quote", locale),
                    attribution:
                      testimonial.show_name && testimonial.client_name
                        ? [testimonial.client_name, testimonial.compound].filter(Boolean).join(" — ")
                        : [t.testimonials.anonymous, testimonial.compound]
                            .filter(Boolean)
                            .join(" — "),
                  }))}
                />
              </div>
            </div>
          </section>
        </>
      )}

      {/* 7 — FAQ */}
      {faqs.length > 0 && (
        <>
          <WaveDivider className="bg-ink" fill="var(--color-cream)" />
          <section className="bg-cream py-20 sm:py-24">
            <div className="mx-auto max-w-4xl px-4 sm:px-6">
              <SectionHeading
                eyebrow={t.faq.eyebrow}
                title={t.faq.title}
                subtitle={t.faq.subtitle}
                align="center"
              />
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
                <PillButton href={askHref} external>
                  {t.faq.cta}
                </PillButton>
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}
