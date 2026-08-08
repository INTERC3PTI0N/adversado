"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin, useGSAP);

/**
 * The Belief → Introduction handoff, lifted from the reference route
 * transition (svg-page-transition-master/TransitionWrapper.jsx): a squiggle
 * draws itself in, thickens until its stroke floods the screen, then thins
 * back out. That original plays it once on a route change, `leave` then
 * `enter`, either side of the URL swap. There's no swap here — both sections
 * are already stacked in one scrolling document — so the whole draw/thicken/
 * thin arc is scrubbed to the scroll position crossing the seam instead.
 * `trigger` is the boundary itself, not either section, so the sweep is
 * centred on the seam rather than tied to one side of it.
 */
export function SectionWipe({ trigger }: { trigger: string }) {
  const pathRef = useRef<SVGPathElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.set(pathRef.current, { drawSVG: "0%", strokeWidth: 2 });

      gsap
        .timeline({
          scrollTrigger: {
            // A selector string rather than a ref: GSAP resolves it lazily,
            // when the trigger is created/refreshed — a ref instead would
            // have raced Introduction's own mount, since this effect and the
            // one that populates the ref aren't ordered against each other.
            // That race is exactly what produced a `start`/`end` of -591/-182:
            // ScrollTrigger measured against a still-null trigger.
            trigger,
            start: "top 65%",
            end: "top 20%",
            scrub: true,
          },
        })
        // Draws in, thin.
        .to(pathRef.current, { drawSVG: "100%", strokeWidth: 2, ease: "none", duration: 1 }, 0)
        // Floods the screen — the stroke is the wipe.
        .to(pathRef.current, { strokeWidth: 900, ease: "power1.in", duration: 1 }, 1)
        // Thins back out of the way, leaving Introduction already underneath.
        .to(pathRef.current, { strokeWidth: 2, ease: "power1.out", duration: 1 }, 2)
        .set(pathRef.current, { drawSVG: "0%" });
    });
    return () => mm.revert();
  });

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center"
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1316 664"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full scale-150"
        preserveAspectRatio="xMidYMid slice"
      >
        <path
          ref={pathRef}
          d="M13.4746 291.27C13.4746 291.27 100.646 -18.6724 255.617 16.8418C410.588 52.356 61.0296 431.197 233.017 546.326C431.659 679.299 444.494 21.0125 652.73 100.784C860.967 180.556 468.663 430.709 617.216 546.326C765.769 661.944 819.097 48.2722 988.501 120.156C1174.21 198.957 809.424 543.841 988.501 636.726C1189.37 740.915 1301.67 149.213 1301.67 149.213"
          stroke="#e6b325"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
