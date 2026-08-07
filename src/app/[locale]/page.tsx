import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import { notFound } from "next/navigation";

import { Counter } from "@/components/Counter";
import { FaqList } from "@/components/FaqList";
import { HeroServices } from "@/components/HeroServices";
import { JourneyScroller } from "@/components/JourneyScroller";
import { Lightbox, type GalleryImage } from "@/components/Lightbox";
import { Eyebrow, SectionHeading } from "@/components/Sections";
import { TestimonialsSlider } from "@/components/TestimonialsSlider";
import { PillButton } from "@/components/ui/PillButton";
import { getDictionary } from "@/lib/dictionary";
import { href, isLocale, pick, whatsappLink, type Locale } from "@/lib/i18n";
import { signMedia } from "@/lib/media";
import { localeMetadata } from "@/lib/pageMeta";
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

/**
 * The hero photograph is a file, not a database row. Whichever format it was
 * supplied in is kept, so all four are resolved rather than forcing a rename.
 */
const HERO_EXTS = [".jpg", ".jpeg", ".png", ".webp"];

const findPublic = (stem: string) =>
  HERO_EXTS.map((ext) => `/${stem}${ext}`).find((file) =>
    existsSync(path.join(process.cwd(), "public", file.slice(1))),
  );

/** Canonical and hreflang for this page — never inherited from the layout. */
export function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return localeMetadata("/", params);
}

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

  const hero = findPublic("hero");
  /*
   * A landscape hero loses about three quarters of its width to `object-cover`
   * on a portrait phone, so whatever is interesting in the frame is usually
   * cropped away. A portrait source fixes that properly; `object-position` only
   * changes which quarter survives. Falls back to the landscape when absent.
   */
  const heroMobile = findPublic("hero-mobile") ?? hero;

  const bookHref = whatsappLink(whatsapp, t.whatsapp.book);
  const askHref = whatsappLink(whatsapp, t.whatsapp.ask);

  // Supporting imagery for the sections that need a photograph. Falls back to
  // an empty frame rather than to a placeholder — a blank half is honest, an
  // invented image is not.
  const supporting = galleries
    .flat()
    .map((media) => signedUrls.get(media.url))
    .filter((url): url is string => Boolean(url));

  // The featured row: one cover per published project, photographs only.
  const featured: GalleryImage[] = projects
    .map((project) => ({
      id: project.id,
      url: project.cover_image ? signedUrls.get(project.cover_image) : undefined,
      caption: "",
    }))
    .filter((item): item is GalleryImage => Boolean(item.url));

  return (
    <>
      {/*
        2 — Hero (§8.2). A self-contained dark block: wordmark, headline,
        buttons and the four service cards, closing with its own padding.

        `min-h` rather than a fixed height — it fills the screen when the
        content is shorter and grows when it is taller, which is what keeps the
        type at full size instead of being compressed to fit. dvh, not vh, so
        mobile URL-bar chrome does not change the reckoning.

        The top bar and nav are position:fixed, so pt-[100px] reserves them.
      */}
      <section className="relative flex min-h-[max(100dvh,560px)] flex-col bg-ink pb-16 pt-[100px] sm:pb-20">
        {/*
          `overflow-hidden` belongs to the image, not to the section: it is here
          to contain the slow zoom, and on the section it would clip anything
          that reached the edge.
        */}
        {hero && (
          <div className="absolute inset-0 overflow-hidden">
            {/*
              Two sources rather than one: art direction, which `sizes` alone
              cannot do — it picks a resolution, not a crop. Both are rendered
              and one is hidden per breakpoint, so each still gets `priority`
              only where it is the one on screen.
            */}
            <Image
              src={heroMobile!}
              alt=""
              fill
              priority
              sizes="100vw"
              className="animate-hero-zoom object-cover md:hidden"
            />
            <Image
              src={hero}
              alt=""
              fill
              priority
              sizes="100vw"
              className="animate-hero-zoom hidden object-cover md:block"
            />
            {/* Keeps the wordmark and headline legible over any photograph. */}
            <div className="absolute inset-0 bg-ink/55" />
          </div>
        )}

        {/*
          `flex-1` fills whatever the cards leave, so the mark and headline stay
          centred in the remaining space at every width. It cannot be squeezed
          below its own content — a column flex item defaults to
          `min-height: auto` — and the section's min-height means it grows
          instead when the two together need more than a screen.
        */}
        <div className="relative flex flex-1 flex-col justify-center">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
            {/*
              The wordmark, oversized (§8.2). It stays Latin in both locales.

              The direction sits on an inline <bdi>, never on the block. A block
              element carrying dir="ltr" resolves its own `text-align: start` to
              LEFT, which stranded the mark on the opposite side from the Arabic
              headline. The blocks now inherit the page direction — so they align
              with the headline — while <bdi> isolates the Latin run and keeps the
              full stop at the end of "FUTURE." rather than flipping it to ".FUTURE".

              The size is capped: 15vw is 288px at 1920 and simply grows from
              there, which is oversized past the point of being a wordmark.
            */}
            <p className="hero-rise brand pointer-events-none select-none font-extrabold leading-[0.82] tracking-[-0.03em] text-white">
              <span className="block text-[22vw] sm:text-[19vw] lg:text-[min(15vw,260px)]">
                <bdi dir="ltr">FUTURE.</bdi>
              </span>
              <span className="mt-2 block text-[6.5vw] font-medium tracking-[0.3em] text-white/70 sm:text-[5vw] lg:text-[min(3.4vw,58px)]">
                <bdi dir="ltr">INTERIORS</bdi>
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
          3 — The four service cards (§8.3), wholly inside the hero.

          They used to hang past the bottom edge by a negative margin. They no
          longer do: the row is simply the last thing in the section, `mt-12`
          clear of the buttons, with the section's own bottom padding below it.

          `relative` is load-bearing — the photograph above is `absolute`, and a
          positioned element paints over a static sibling regardless of source
          order, so without it the cards would sit behind the image.
        */}
        {services.length > 0 && (
          <div className="relative z-10 mx-auto mt-12 w-full max-w-7xl px-4 sm:px-6">
            <HeroServices
              href={href("/services", locale)}
              services={services.slice(0, 4).map((service) => ({
                id: service.id,
                title: pick(service, "title", locale),
                description: pick(service, "desc", locale),
                icon: service.icon,
              }))}
            />
          </div>
        )}
      </section>

      {/* 4 — Why choose us (§8.4). Nothing overhangs from the hero now, so it
          starts on its own padding like every other section. */}
      <section className="bg-surface py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-start gap-12 lg:grid-cols-3 lg:gap-10">
            <div>
              <Eyebrow>{t.why.eyebrow}</Eyebrow>
              <h2 className="text-4xl font-semibold text-ink sm:text-5xl">{t.why.title}</h2>
              <p className="mt-5 text-base leading-8 text-muted-ink">{t.why.subtitle}</p>

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
            <div className="relative aspect-[3/4] overflow-hidden rounded-card border border-border bg-ink/5">
              {supporting[0] && (
                <Image
                  src={supporting[0]}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 400px"
                  className="object-cover"
                />
              )}
            </div>

            <div className="grid gap-4">
              {t.why.cards.map((card) => (
                <article key={card.title} className="rounded-card border border-border bg-paper p-6">
                  <h3 className="text-lg font-semibold text-ink">{card.title}</h3>
                  <p className="mt-2 text-base leading-7 text-muted-ink">{card.body}</p>
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
      {featured.length > 0 && (
        <section className="bg-paper py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHeading
              eyebrow={t.works.eyebrow}
              title={t.works.title}
              subtitle={t.works.subtitle}
              align="center"
            />

            {/* Photographs only — no title, area, year or location (see works/page.tsx). */}
            <div className="mt-14">
              <Lightbox
                images={featured}
                alt={t.works.photoAlt}
                closeLabel={t.works.closeGallery}
                columns={3}
              />
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
                // The compound used to be appended here. It names the location,
                // so it is gone from the public site entirely — a consented name
                // on its own, or the anonymous label.
                attribution:
                  testimonial.show_name && testimonial.client_name
                    ? testimonial.client_name
                    : t.testimonials.anonymous,
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

          <div className="relative aspect-[4/3] overflow-hidden rounded-card border border-white/10 bg-white/5">
            {supporting[3] && (
              <Image
                src={supporting[3]}
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 620px"
                className="object-cover"
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
          <p className="mt-5 text-base leading-8 text-muted-ink">{body}</p>

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

        <div className="relative aspect-[4/3] overflow-hidden rounded-card border border-border bg-ink/5">
          {image && (
            <Image
              src={image}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 620px"
              className="object-cover"
            />
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

// The circled arrow moved into HeroServices with the cards; the project cards
// that used the other copy are a lightbox gallery now and carry no chrome.

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
