"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { useGSAP } from "@gsap/react";
import { COMMIT_SNAP } from "@/components/Hero";

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin, useGSAP);

/**
 * The Belief → Introduction handoff, lifted from the reference route
 * transition (svg-page-transition-master/TransitionWrapper.jsx): a squiggle
 * draws itself in, thickens until its stroke floods the screen, then thins
 * back out.
 *
 * Scrubbed across the exact scroll that carries Introduction from just below
 * the fold to fully on (`top bottom` → `top top`). When the wipe finishes,
 * Introduction owns the viewport and the campaign section is gone — and the
 * same range snaps the other way when scrolling back up.
 */
export function SectionWipe({ trigger }: { trigger: string }) {
  const pathRef = useRef<SVGPathElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.set(pathRef.current, { drawSVG: "0%", strokeWidth: 2 });

      // Near-instant commit so the seam does not rest half-wiped with both
      // sections sharing the frame after the stroke has thinned.
      const SEAM_SNAP = {
        ...COMMIT_SNAP,
        duration: { min: 0.04, max: 0.1 },
        ease: "power3.out",
        snapTo: (value: number, self?: { direction: number }) => {
          if (value <= 0.001 || value >= 0.999) return value;
          const goingBack = self && self.direction === -1;
          if (goingBack) return value < 0.97 ? 0 : 1;
          return value > 0.02 ? 1 : 0;
        },
      } as const;

      gsap
        .timeline({
          scrollTrigger: {
            // A selector string rather than a ref: GSAP resolves it lazily,
            // when the trigger is created/refreshed — a ref instead would
            // have raced Introduction's own mount, since this effect and the
            // one that populates the ref aren't ordered against each other.
            trigger,
            start: "top bottom",
            end: "top top",
            scrub: true,
            snap: SEAM_SNAP,
          },
        })
        // Draws in while the next section is rising under the flood.
        .to(pathRef.current, { drawSVG: "100%", strokeWidth: 2, ease: "none", duration: 0.35 }, 0)
        // Floods the screen — peak cover mid-seam, campaign fully obscured.
        .to(pathRef.current, { strokeWidth: 900, ease: "power1.in", duration: 0.3 }, 0.35)
        // Thins out only as Introduction finishes locking to the viewport top.
        .to(pathRef.current, { strokeWidth: 2, ease: "power1.out", duration: 0.35 }, 0.65)
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
