"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

/**
 * Site-wide motion for the public pages: Lenis smooth scrolling and GSAP
 * scroll reveals, driven entirely by data attributes in the markup.
 *
 *   data-reveal="words"  a heading built by <SplitWords>: words rise from a mask
 *   data-reveal="fade"   rises 24px and fades in
 *   data-reveal="image"  a photo frame: wiped open in the reading direction,
 *                        then drifts with the scroll (parallax)
 *
 * Everything is visible in the server HTML. Motion only ever hides an element
 * from a script that is already running, and never one that is on screen when
 * the page loads — so a phone that cannot run this bundle shows the whole page
 * still, and nothing above the fold flashes away and back.
 *
 * Reduced motion: no smooth scroll, no parallax, a short fade only.
 * The client portal (/track) is left completely alone: it is a working tool,
 * and its printable statement must not carry transforms.
 */

const EASE = "expo.out"; // the approved curve, ~ cubic-bezier(0.16, 1, 0.3, 1)
const START = "top 85%";

gsap.registerPlugin(ScrollTrigger);

export function Motion() {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);
  const portal = pathname.includes("/track");

  // ---------------------------------------------------------------- smooth scroll
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (portal || reduce) return;

    const lenis = new Lenis({ lerp: 0.1 });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [portal]);

  // ---------------------------------------------------------------- reveals, per page
  useEffect(() => {
    if (portal) return;
    lenisRef.current?.scrollTo(0, { immediate: true });

    // Elements already on screen stay as rendered: hiding them now would flash.
    const offscreen = (el: Element) => !ScrollTrigger.isInViewport(el, 0.05);
    const pick = (kind: string) => gsap.utils.toArray<HTMLElement>(`[data-reveal="${kind}"]`).filter(offscreen);

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      for (const heading of pick("words")) {
        gsap.from(heading.querySelectorAll("[data-word] > span"), {
          yPercent: 110,
          duration: 1,
          stagger: 0.06,
          ease: EASE,
          scrollTrigger: { trigger: heading, start: START, once: true },
        });
      }

      for (const el of pick("fade")) {
        gsap.from(el, {
          y: 24,
          opacity: 0,
          duration: 1,
          ease: EASE,
          scrollTrigger: { trigger: el, start: START, once: true },
        });
      }

      const rtl = document.documentElement.dir === "rtl";
      for (const frame of gsap.utils.toArray<HTMLElement>('[data-reveal="image"]')) {
        const img = frame.querySelector("img");
        if (!img) continue;

        // Parallax applies to every frame, on screen or not: it only moves the
        // photo inside its own clipped box. Scaled so the drift never shows an edge.
        gsap.set(img, { scale: 1.16 });
        gsap.fromTo(
          img,
          { yPercent: -6 },
          {
            yPercent: 6,
            ease: "none",
            scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: true },
          },
        );

        if (!offscreen(frame)) continue;
        // Wipe from the side the reader starts on: right in Arabic, left in English.
        gsap.from(frame, {
          clipPath: rtl ? "inset(0% 0% 0% 100%)" : "inset(0% 100% 0% 0%)",
          duration: 1.2,
          ease: EASE,
          clearProps: "clipPath",
          scrollTrigger: { trigger: frame, start: START, once: true },
        });
        gsap.from(img, {
          scale: 1.34,
          duration: 1.2,
          ease: EASE,
          scrollTrigger: { trigger: frame, start: START, once: true },
        });
      }
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      for (const el of [...pick("words"), ...pick("fade"), ...pick("image")]) {
        gsap.from(el, {
          opacity: 0,
          duration: 0.3,
          ease: "none",
          scrollTrigger: { trigger: el, start: START, once: true },
        });
      }
    });

    // Images and fonts change heights after the first layout.
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    document.fonts?.ready.then(refresh);

    return () => {
      window.removeEventListener("load", refresh);
      mm.revert();
    };
  }, [pathname, portal]);

  return null;
}
