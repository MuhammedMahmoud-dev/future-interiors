"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * The whole scroll-motion engine, mounted once in the locale layout.
 *
 * Pages stay Server Components: they mark elements with data attributes
 * (`data-reveal`, `data-rule`, `data-parallax`, `data-wipe`)
 * and this is the only thing that ships to the browser.
 *
 * Initial states are set here rather than in CSS on purpose. useGSAP runs in a
 * layout effect, so hiding happens before paint — no flash — while a visitor
 * with JavaScript disabled gets fully visible content instead of a blank page.
 */

const REVEAL_Y = 24;
const REVEAL_DURATION = 0.7;
const STAGGER = 0.08;
const EASE = "power4.out"; // ~cubic-bezier(0.22, 1, 0.36, 1): leaves fast, settles slow

/**
 * Position among the marked siblings sharing a parent, so a group of lines or
 * cards arrives as one staggered gesture rather than all at once.
 */
function staggerIndex(el: HTMLElement): number {
  const parent = el.parentElement;
  if (!parent) return 0;
  const group = Array.from(
    parent.querySelectorAll<HTMLElement>(":scope > [data-reveal], :scope > [data-wipe]"),
  );
  return Math.max(0, group.indexOf(el));
}

export function ScrollMotion() {
  const pathname = usePathname();
  const progressRef = useRef<HTMLDivElement>(null);

  // The client portal shares this layout but is a working tool, not a reading
  // experience — no motion, and no progress rule over someone's statement.
  const isPortal = pathname.includes("/track");

  useGSAP(
    () => {
      if (isPortal) return;

      const rtl = document.documentElement.dir === "rtl";
      const inlineStart = rtl ? "right center" : "left center";

      // Dev-only handle so motion can be driven manually when rAF is throttled
      // (headless runs, backgrounded tabs). Stripped from production builds.
      if (process.env.NODE_ENV === "development") {
        (window as unknown as { __gsap?: typeof gsap }).__gsap = gsap;
      }

      const media = gsap.matchMedia();

      // ---------------------------------------------------------- reduced motion
      // Not a disclaimer: everything lands at its final state and no trigger is
      // ever created, so there is nothing to drive a repaint on scroll.
      media.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set("[data-reveal], [data-wipe]", { opacity: 1, y: 0, clipPath: "none" });
        gsap.set("[data-rule]", { scaleX: 1 });
        if (progressRef.current) gsap.set(progressRef.current, { scaleX: 0, opacity: 0 });
      });

      media.add("(prefers-reduced-motion: no-preference)", () => {
        /**
         * Run once, when the element is in view.
         *
         * ScrollTrigger does not fire onEnter for elements that are already
         * past the start line when the trigger is created, which is every
         * element above the fold. Without the immediate branch the hero text
         * stays at opacity 0 forever.
         */
        const onEnterOnce = (el: HTMLElement, play: (delay: number) => void) => {
          const threshold = window.innerHeight * 0.85;
          if (el.getBoundingClientRect().top < threshold) {
            play(staggerIndex(el) * STAGGER);
            return;
          }
          ScrollTrigger.create({
            trigger: el,
            start: "top 85%",
            once: true,
            onEnter: () => play(staggerIndex(el) * STAGGER),
          });
        };

        // -------------------------------------------------------- staggered reveals
        const revealed = gsap.utils.toArray<HTMLElement>("[data-reveal]");
        gsap.set(revealed, { opacity: 0, y: REVEAL_Y });

        revealed.forEach((el) => {
          onEnterOnce(el, (delay) =>
            gsap.to(el, {
              opacity: 1,
              y: 0,
              duration: REVEAL_DURATION,
              ease: EASE,
              delay,
              overwrite: "auto",
            }),
          );
        });

        // -------------------------------------------------------- self-drawing rules
        const rules = gsap.utils.toArray<HTMLElement>("[data-rule]");
        gsap.set(rules, { scaleX: 0, transformOrigin: inlineStart });

        rules.forEach((rule) => {
          onEnterOnce(rule, (delay) =>
            gsap.to(rule, { scaleX: 1, duration: 0.9, ease: EASE, delay, overwrite: "auto" }),
          );
        });

        // -------------------------------------------------------- parallax depth
        gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((layer) => {
          const factor = Number(layer.dataset.parallax) || 0.1;
          const section = layer.closest("section") ?? layer.parentElement;
          gsap.to(layer, {
            yPercent: factor * 100,
            ease: "none", // scroll-linked: any easing would desync it from the input
            scrollTrigger: {
              trigger: section,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          });
        });

        // -------------------------------------------------------- wipe reveals
        const plates = gsap.utils.toArray<HTMLElement>("[data-wipe]");
        gsap.set(plates, { clipPath: "inset(0% 0% 100% 0%)" });

        plates.forEach((plate) => {
          onEnterOnce(plate, (delay) =>
            gsap.to(plate, {
              clipPath: "inset(0% 0% 0% 0%)",
              duration: 1.1,
              ease: EASE,
              delay,
              overwrite: "auto",
            }),
          );
        });

        // -------------------------------------------------------- scroll progress
        if (progressRef.current) {
          gsap.set(progressRef.current, { scaleX: 0, transformOrigin: inlineStart });
          gsap.to(progressRef.current, {
            scaleX: 1,
            ease: "none",
            scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
          });
        }
      });

      // The journey section used to be pinned and scrubbed sideways here. It was
      // removed: it only ever framed about three of the five steps, and its pin
      // reserved ~1,500px of scroll that read as a dead gap. The steps now lay
      // out statically and simply reveal like everything else.

      return () => media.revert();
    },
    { dependencies: [pathname, isPortal], revertOnUpdate: true },
  );

  if (isPortal) return null;

  return (
    <div
      ref={progressRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-[100px] z-40 h-px origin-left bg-gold"
    />
  );
}
