import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Counter } from "@/components/Counter";
import { FaqList } from "@/components/FaqList";
import { JourneyScroller } from "@/components/JourneyScroller";
import { Eyebrow, SectionHeading } from "@/components/Sections";
import { ServiceIcon } from "@/components/ServiceIcon";
import { TestimonialsSlider } from "@/components/TestimonialsSlider";
import { PillButton } from "@/components/ui/PillButton";
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

/** The dev seed writes a .png; a real photograph will most likely be a .jpg. */
const HERO_CANDIDATES = ["/hero.jpg", "/hero.png"];

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

  const galleries = await Promise.all(projects.map((project) => getPublicProjectMedia(project.id)));
  const signedUrls = await signMedia([
    ...projects.map((project) => project.cover_image ?? ""),
    ...galleries.flat().map((media) => media.url),
  ]);

  const hero = HERO_CANDIDATES.find((file) =>
    existsSync(path.join(process.cwd(), "public", file.slice(1))),
  );

  const bookHref = whatsappLink(whatsapp, t.whatsapp.book);
  const askHref = whatsappLink(whatsapp, t.whatsapp.ask);

  // Supporting imagery for the sections that need a photograph. Falls back to
  // an empty frame rather than to a placeholder — a blank half is honest, an
  // invented image is not.
  const supporting = galleries
    .flat()
    .map((media) => signedUrls.get(media.url))
    .filter((url): url is string => Boolean(url));

  return (
    <>
      {/*
        2 — Hero (§8.2). Fills the viewport exactly, so nothing of the next
        section shows before the first scroll.

        The top bar and nav are position:fixed, so pt-[100px] reserves their
        combined height. dvh, not vh, so mobile URL-bar chrome cannot push the
        following section into view.
      */}
      <section className="relative flex min-h-[max(100dvh,560px)] flex-col overflow-hidden bg-ink pt-[100px]">
        {hero && (
          <>
            <Image
              src={hero}
              alt=""
              fill
              priority
              sizes="100vw"
              className="animate-hero-zoom object-cover"
            />
            {/* Keeps the wordmark and headline legible over any photograph. */}
            <div className="absolute inset-0 bg-ink/55" />
          </>
        )}

        {/*
          Below lg the cards sit inside this section and add their own height, so
          `flex-1` alone would squeeze the wordmark into whatever was left. The
          explicit min-height keeps the first screen for the mark and headline
          and pushes the cards just past the fold. At lg the cards are lifted out
          of flow by the negative margin, so flex-1 fills the section on its own.
        */}
        <div className="relative flex min-h-[calc(100dvh-100px)] flex-1 flex-col justify-center lg:min-h-0">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
            {/*
              The wordmark, oversized (§8.2). It stays Latin in both locales.

              `dir="ltr"` sits on the spans, not on the paragraph: the full stop
              in "FUTURE." is a neutral character, so inside an RTL paragraph it
              would flip to the wrong side and render as ".FUTURE". Leaving the
              paragraph itself in the page direction keeps the mark aligned with
              the Arabic headline beneath it instead of stranded on the far side.
            */}
            <p className="hero-rise brand pointer-events-none select-none font-extrabold leading-[0.82] tracking-[-0.03em] text-white">
              <span dir="ltr" className="block text-[22vw] sm:text-[19vw] lg:text-[15vw]">
                FUTURE.
              </span>
              <span
                dir="ltr"
                className="mt-2 block text-[6.5vw] font-medium tracking-[0.3em] text-white/70 sm:text-[5vw] lg:text-[3.4vw]"
              >
                INTERIORS
              </span>
            </p>

            <h1
              className="hero-rise mt-10 max-w-2xl text-2xl font-medium leading-snug text-white/90 sm:text-3xl"
              style={{ animationDelay: "0.12s" }}
            >
              {t.hero.title}
            </h1>

            <div className="hero-rise mt-9 flex flex-wrap gap-3" style={{ animationDelay: "0.24s" }}>
              <PillButton href={href("/works", locale)} variant="light">
                {t.hero.ctaWorks}
              </PillButton>
              <PillButton href={bookHref} variant="outline" external className="text-white">
                {t.hero.ctaBook}
              </PillButton>
            </div>
          </div>
        </div>

        {/*
          3 — The four service cards (§8.3).

          They overlap the hero's bottom edge on desktop only. Below lg they sit
          under the hero in a 2×2 instead: four cards straddling the fold on a
          phone would bury the headline, but hiding them outright would leave a
          mobile visitor with no services on the homepage at all.
        */}
        {services.length > 0 && (
          <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 lg:pb-0">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:-mb-14 lg:translate-y-14 lg:grid-cols-4">
              {services.slice(0, 4).map((service) => (
                <Link
                  key={service.id}
                  href={href("/services", locale)}
                  className="group rounded-card border border-white/15 bg-ink/70 p-6 backdrop-blur transition-colors duration-200 hover:border-white/40"
                >
                  <span className="text-white/70">
                    <ServiceIcon name={service.icon} />
                  </span>
                  <h2 className="mt-5 text-base font-semibold text-white">
                    {pick(service, "title", locale)}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/50">
                    {pick(service, "desc", locale)}
                  </p>
                  <Arrow className="mt-5 text-white/40 transition-colors group-hover:text-white" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 4 — Why choose us (§8.4). */}
      <section className={`bg-surface py-20 sm:py-28 ${services.length > 0 ? "lg:pt-32" : ""}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-start gap-12 lg:grid-cols-3 lg:gap-10">
            <div>
              <Eyebrow>{t.why.eyebrow}</Eyebrow>
              <h2 className="text-4xl font-semibold text-ink sm:text-5xl">{t.why.title}</h2>
              <p className="mt-5 text-base leading-8 text-muted">{t.why.subtitle}</p>

              <ul className="mt-8 space-y-4">
                {t.why.points.map((point) => (
                  <li key={point} className="flex gap-3 text-base leading-7 text-body">
                    <Check />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* The middle column is the photograph the spec asks for. */}
            <div className="overflow-hidden rounded-card border border-border bg-ink/5 lg:aspect-[3/4]">
              {supporting[0] && (
                // eslint-disable-next-line @next/next/no-img-element -- signed URL
                <img
                  src={supporting[0]}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              )}
            </div>

            <div className="grid gap-4">
              {t.why.cards.map((card) => (
                <article key={card.title} className="rounded-card border border-border bg-paper p-6">
                  <h3 className="text-lg font-semibold text-ink">{card.title}</h3>
                  <p className="mt-2 text-base leading-7 text-muted">{card.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/*
        5 — Featured projects (§8.5). Three cards, no price anywhere. The
        is_public AND publish_approved_at consent gate lives in lib/data.ts.
      */}
      {projects.length > 0 && (
        <section className="bg-paper py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHeading
              eyebrow={t.works.eyebrow}
              title={t.works.title}
              subtitle={t.works.subtitle}
              align="center"
            />

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {projects.map((project) => {
                const cover = project.cover_image ? signedUrls.get(project.cover_image) : undefined;
                const months = durationMonths(project.start_date, project.end_date);
                const year = yearOf(project.end_date ?? project.start_date);
                const location = locationLabel(project.compound, project.district, locale);

                const facts = [
                  project.area_m2 ? `${project.area_m2} ${t.works.sqm}` : null,
                  months ? `${months} ${t.works.months}` : null,
                  year,
                  location || null,
                ].filter(Boolean);

                return (
                  <Link
                    key={project.id}
                    href={href(`/works/${project.slug}`, locale)}
                    className="group flex flex-col overflow-hidden rounded-card border border-border bg-paper transition-colors duration-200 hover:border-ink/30"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-ink/5">
                      {cover && (
                        // eslint-disable-next-line @next/next/no-img-element -- signed URL
                        <img
                          src={cover}
                          alt={pick(project, "title", locale)}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                    </div>

                    <div className="flex flex-1 flex-col border-t border-border p-6">
                      <h3 className="text-lg font-semibold text-ink">
                        {pick(project, "title", locale)}
                      </h3>
                      <p className="mt-3 flex-1 text-sm leading-6 text-muted">{facts.join(" · ")}</p>
                      <Arrow className="mt-6 text-muted transition-colors group-hover:text-ink" />
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="mt-14 text-center">
              <PillButton href={href("/works", locale)} variant="ink">
                {t.works.viewAll}
              </PillButton>
            </div>
          </div>
        </section>
      )}

      {/*
        6 — The numbers strip (§8.6). Hidden entirely until real figures exist;
        these are exactly the site_stats rows, nothing invented.
      */}
      {stats.length > 0 && (
        <section className="bg-ink py-16 text-white sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
              {stats.slice(0, 4).map((stat, index) => (
                <div
                  key={stat.id}
                  className={`flex items-center gap-4 lg:justify-center lg:px-6 ${
                    index > 0 ? "lg:border-s lg:border-white/15" : ""
                  }`}
                >
                  <StatIcon index={index} />
                  <div>
                    <p className="brand text-3xl font-semibold text-white sm:text-4xl">
                      <Counter value={Number(stat.value)} />
                      {pick(stat, "suffix", locale) && (
                        <span className="ms-1 text-xl">{pick(stat, "suffix", locale)}</span>
                      )}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-white/50">
                      {pick(stat, "label", locale)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7 — Client journey (§8.7). */}
      <section className="bg-surface py-20 sm:py-28">
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

      {/* 8 — Two mirrored split sections (§8.8). */}
      <Split
        eyebrow={t.workSystem.eyebrow}
        title={t.workSystem.title}
        body={t.workSystem.subtitle}
        points={t.workSystem.steps.slice(0, 3).map((step) => step.title)}
        linkHref={href("/work-system", locale)}
        linkLabel={t.common.readMore}
        image={supporting[1]}
      />
      <Split
        eyebrow={t.about.eyebrow}
        title={t.about.title}
        body={t.why.subtitle}
        points={t.why.points.slice(0, 3)}
        linkHref={href("/about", locale)}
        linkLabel={t.common.readMore}
        image={supporting[2]}
        reversed
      />

      {/* 9 — Testimonials (§8.9). Nothing renders until real, consented quotes exist. */}
      {testimonials.length > 0 && (
        <section className="bg-ink py-20 text-white sm:py-28">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="text-center">
              <Eyebrow tone="dark">{t.testimonials.eyebrow}</Eyebrow>
            </div>
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
        </section>
      )}

      {/* 10 — FAQ (§8.10). Multiple answers may be open at once. */}
      {faqs.length > 0 && (
        <section className="bg-surface py-20 sm:py-28">
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
              <PillButton href={askHref} variant="ink" external>
                {t.faq.cta}
              </PillButton>
            </div>
          </div>
        </section>
      )}

      {/*
        11 — Dark CTA strip (§8.11). The reference has a form here; the spec
        replaces it with WhatsApp, which is the only contact channel on the site.
      */}
      <section className="bg-ink text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <Eyebrow tone="dark">{t.cta.eyebrow}</Eyebrow>
            <h2 className="text-4xl font-semibold sm:text-5xl">{t.cta.title}</h2>
            <p className="mt-5 max-w-md text-base leading-8 text-white/60">{t.cta.text}</p>

            <div className="mt-9">
              <PillButton href={bookHref} variant="light" external>
                {t.cta.button}
              </PillButton>
            </div>
          </div>

          <div className="overflow-hidden rounded-card border border-white/10 bg-white/5 lg:aspect-[4/3]">
            {supporting[3] && (
              // eslint-disable-next-line @next/next/no-img-element -- signed URL
              <img
                src={supporting[3]}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            )}
          </div>
        </div>
      </section>
    </>
  );
}

/**
 * One of the two mirrored halves in §8.8: copy and a short list on one side,
 * a photograph on the other, reversed for the second instance.
 */
function Split({
  eyebrow,
  title,
  body,
  points,
  linkHref,
  linkLabel,
  image,
  reversed = false,
}: {
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  linkHref: string;
  linkLabel: string;
  image?: string;
  reversed?: boolean;
}) {
  return (
    <section className="bg-paper py-20 sm:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <div className={reversed ? "lg:order-2" : ""}>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="text-4xl font-semibold text-ink sm:text-5xl">{title}</h2>
          <p className="mt-5 text-base leading-8 text-muted">{body}</p>

          <ul className="mt-7 space-y-3">
            {points.map((point) => (
              <li key={point} className="flex gap-3 text-base leading-7 text-body">
                <Check />
                {point}
              </li>
            ))}
          </ul>

          <div className="mt-9">
            <PillButton href={linkHref} variant="ink">
              {linkLabel}
            </PillButton>
          </div>
        </div>

        <div className="aspect-[4/3] overflow-hidden rounded-card border border-border bg-ink/5">
          {image && (
            // eslint-disable-next-line @next/next/no-img-element -- signed URL
            <img src={image} alt="" loading="lazy" className="h-full w-full object-cover" />
          )}
        </div>
      </div>
    </section>
  );
}

function Check() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-1 shrink-0 text-accent"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function Arrow({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-9 w-9 items-center justify-center rounded-full border border-current ${className}`}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        className="rtl:-scale-x-100"
      >
        <path d="M5 12h13M12 5l7 7-7 7" />
      </svg>
    </span>
  );
}

/** Four line glyphs for the numbers strip — no icon library, four inline paths. */
function StatIcon({ index }: { index: number }) {
  const paths = [
    "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z", // apartments delivered
    "M12 3a9 9 0 1 0 9 9M12 7v5l3 2", // years of experience
    "M4 4h7v7H4zM13 13h7v7h-7zM4 15h5v5H4zM15 4h5v5h-5z", // total area
    "M3 17l6-6 4 4 8-8M15 7h6v6", // costs executed
  ];

  return (
    <span
      aria-hidden="true"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20"
    >
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-white/70"
      >
        <path d={paths[index % paths.length]} />
      </svg>
    </span>
  );
}
