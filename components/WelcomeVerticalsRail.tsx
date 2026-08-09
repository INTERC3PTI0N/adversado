"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type CardDriver = (progress: number) => void;

const HANDOFF_SNAP = {
  snapTo: (value: number, self?: { direction: number }) => {
    if (value <= 0.001 || value >= 0.999) return value;
    const slide = window.innerWidth * 1.05;
    const cards = window.innerHeight * 3;
    const total = slide + cards;
    const slideEnd = slide / total;
    const goingBack = self && self.direction === -1;

    // Only snap across the Welcome ↔ Verticals handoff; free scrub in card zone.
    if (value > slideEnd + 0.02) {
      if (goingBack && value < slideEnd + 0.12) return slideEnd;
      return value;
    }
    if (goingBack) return value < slideEnd * 0.45 ? 0 : slideEnd;
    return value > slideEnd * 0.55 ? slideEnd : 0;
  },
  duration: { min: 0.28, max: 0.5 },
  delay: 0.04,
  inertia: false,
  ease: "power2.inOut",
} as const;

/**
 * Welcome → Four Verticals as a side-by-side pair.
 * Vertical wheel drives a rightward slide, then continues into the card scrub.
 */
export function WelcomeVerticalsRail({
  welcome,
  verticals,
  cardDriverRef,
}: {
  welcome: ReactNode;
  verticals: ReactNode;
  /** Verticals registers its progress applier here when rail-driven. */
  cardDriverRef: React.MutableRefObject<CardDriver | null>;
}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const shell = shellRef.current;
      const track = trackRef.current;
      if (!shell || !track) return;

      const mm = gsap.matchMedia();

      mm.add(
        "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
        () => {
          gsap.set(track, { x: 0 });

          const slideLen = () => window.innerWidth * 1.05;
          const cardsLen = () => window.innerHeight * 3;

          ScrollTrigger.create({
            trigger: shell,
            start: "top top",
            end: () => `+=${slideLen() + cardsLen()}`,
            pin: true,
            scrub: 0.7,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            snap: HANDOFF_SNAP,
            onUpdate: (self) => {
              const slide = slideLen();
              const cards = cardsLen();
              const dist = self.progress * (slide + cards);
              if (dist <= slide) {
                gsap.set(track, { x: -window.innerWidth * (dist / slide) });
                cardDriverRef.current?.(0);
              } else {
                gsap.set(track, { x: -window.innerWidth });
                cardDriverRef.current?.((dist - slide) / cards);
              }
            },
          });
        }
      );

      // Mobile: stacked Welcome → Verticals. Card scrub is owned by Verticals.
      mm.add("(max-width: 767px)", () => {
        gsap.set(track, { clearProps: "transform" });
      });

      // Reduced motion (any width): park the rail and ask cards for their end state.
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(track, { clearProps: "transform" });
        cardDriverRef.current?.(1);
      });

      return () => mm.revert();
    },
    { scope: shellRef, dependencies: [] }
  );

  return (
    <div ref={shellRef} data-welcome-verticals-rail className="relative z-10">
      {/* overflow hidden only on desktop — it breaks ScrollTrigger pin on mobile
          and the Verticals pack scrub would run while the stage scrolls away. */}
      <div className="h-auto w-full md:h-screen md:overflow-hidden">
        <div
          ref={trackRef}
          className="flex w-full flex-col will-change-transform md:h-full md:w-[200vw] md:flex-row"
        >
          <div className="w-full shrink-0 md:h-full md:w-screen md:overflow-hidden">
            {welcome}
          </div>
          <div className="w-full shrink-0 md:h-full md:w-screen md:overflow-hidden">
            {verticals}
          </div>
        </div>
      </div>
    </div>
  );
}
