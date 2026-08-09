"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Pack 51 — Clayboan clip morphs. */
export const CLIP_ENTER = "polygon(25% 25%, 75% 40%, 100% 100%, 0% 100%)";
export const CLIP_FULL = "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)";
export const CLIP_LEAVE = "polygon(0% 0%, 100% 0%, 75% 60%, 25% 75%)";

/**
 * Scrubbed clip-path reveal/dismiss (Scroll Animation pack 51).
 * Tall shell + sticky panel for the morph, with binary snap so the open
 * frame parks in place (and leaving needs a clear push past the hold).
 */
export function ClipScrollPanel({
  id,
  className,
  children,
  /** Scroll length as a multiple of viewport height. Demo uses 1.5. */
  heightVh = 160,
  onOpen,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
  heightVh?: number;
  /** Fires when the enter clip reaches full (section top hits viewport top). */
  onOpen?: () => void;
}) {
  const shellRef = useRef<HTMLElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const onOpenRef = useRef(onOpen);
  const heightRef = useRef(heightVh);

  useEffect(() => {
    onOpenRef.current = onOpen;
  }, [onOpen]);

  useEffect(() => {
    heightRef.current = heightVh;
  }, [heightVh]);

  useGSAP(
    () => {
      const shell = shellRef.current;
      const clip = clipRef.current;
      if (!shell || !clip) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(clip, { clipPath: CLIP_ENTER });

        // Enter morph + snap to fully open (or back toward Campaign).
        ScrollTrigger.create({
          trigger: shell,
          start: "top bottom",
          end: "top top",
          scrub: 0.5,
          snap: {
            snapTo: (value: number, self?: { direction: number }) => {
              if (value <= 0.001 || value >= 0.999) return value;
              const goingBack = self && self.direction === -1;
              if (goingBack) return value < 0.88 ? 0 : 1;
              return value > 0.12 ? 1 : 0;
            },
            duration: { min: 0.08, max: 0.2 },
            delay: 0,
            inertia: false,
            ease: "power2.inOut",
          },
          animation: gsap.fromTo(
            clip,
            { clipPath: CLIP_ENTER },
            { clipPath: CLIP_FULL, ease: "none" }
          ),
          onLeave: () => onOpenRef.current?.(),
          onEnterBack: () => onOpenRef.current?.(),
        });

        // Hold at full open, then leave. Snap re-parks on scroll-up.
        ScrollTrigger.create({
          trigger: shell,
          start: "top top",
          end: "bottom top",
          scrub: 0.5,
          snap: {
            snapTo: (value: number, self?: { direction: number }) => {
              if (value <= 0.001 || value >= 0.999) return value;
              const goingBack = self && self.direction === -1;
              if (goingBack) return 0;
              const hv = heightRef.current;
              const holdEnd = Math.max(0.2, (hv - 100) / hv);
              return value > holdEnd + 0.12 ? 1 : 0;
            },
            duration: { min: 0.08, max: 0.22 },
            delay: 0,
            inertia: false,
            ease: "power2.inOut",
          },
        });

        ScrollTrigger.create({
          trigger: shell,
          start: "bottom bottom",
          end: "bottom top",
          scrub: 0.5,
          animation: gsap.fromTo(
            clip,
            { clipPath: CLIP_FULL },
            { clipPath: CLIP_LEAVE, ease: "none" }
          ),
        });
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(clip, { clipPath: CLIP_FULL });
        onOpenRef.current?.();
      });

      return () => mm.revert();
    },
    { scope: shellRef, dependencies: [] }
  );

  return (
    <section
      id={id}
      ref={shellRef}
      className="relative z-10 w-full"
      style={{ height: `${heightVh}vh` }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div
          ref={clipRef}
          className={`absolute inset-0 will-change-[clip-path] ${className ?? ""}`}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
