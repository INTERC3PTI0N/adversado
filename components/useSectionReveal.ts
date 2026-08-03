"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Shared scroll-reveal for the homepage sections: everything marked
 * `data-reveal` inside the returned ref rises and fades in, staggered in DOM
 * order, once the section reaches the viewport.
 *
 * Uses `gsap.from` deliberately — the resting state is the markup's own, so
 * if JS never runs or the trigger never fires the content is simply visible
 * rather than stuck at opacity 0.
 */
export function useSectionReveal<T extends HTMLElement>({
  stagger = 0.12,
  y = 40,
  start = "top 78%",
}: { stagger?: number; y?: number; start?: string } = {}) {
  const ref = useRef<T>(null);

  useGSAP(
    () => {
      const targets = gsap.utils.toArray<HTMLElement>("[data-reveal]", ref.current);
      if (!targets.length) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(targets, {
          y,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger,
          scrollTrigger: { trigger: ref.current, start, once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return ref;
}
