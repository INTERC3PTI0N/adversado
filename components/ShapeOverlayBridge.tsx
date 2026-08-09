"use client";

import { useEffect, useId, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const NUM_POINTS = 10;
const DELAY_POINTS_MAX = 0.28;
const DELAY_PER_PATH = 0.22;

/** Down: eager park on Welcome. Up: deliberate — needs past mid-seam. */
const SEAM_SNAP = {
  snapTo: (value: number, self?: { direction: number }) => {
    if (value <= 0.001 || value >= 0.999) return value;
    const goingBack = self && self.direction === -1;
    if (goingBack) return value < 0.48 ? 0 : 1;
    return value > 0.18 ? 1 : 0;
  },
  duration: { min: 0.28, max: 0.5 },
  delay: 0.04,
  inertia: false,
  ease: "power2.inOut",
} as const;

function pointDelays(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const wave = (Math.sin(i * 1.618) + 1) * 0.5;
    return wave * DELAY_POINTS_MAX;
  });
}

function buildPathD(points: number[], covering: boolean) {
  // Pack SVG Animations/1 — wavy edge via cubic midpoints across the viewBox.
  let d = covering ? `M 0 0 V ${points[0]} C` : `M 0 ${points[0]} C`;

  for (let j = 0; j < NUM_POINTS - 1; j++) {
    const p = ((j + 1) / (NUM_POINTS - 1)) * 100;
    const cp = p - 100 / (NUM_POINTS - 1) / 2;
    d += ` ${cp} ${points[j]} ${cp} ${points[j + 1]} ${p} ${points[j + 1]}`;
  }

  d += covering ? ` V 100 H 0` : ` V 0 H 0`;
  return d;
}

/**
 * Seamless Campaign ↔ Welcome handoff.
 *
 * - Sections stay flush (fixed overlay — zero layout height).
 * - Curtain sits OVER both while they trade the viewport.
 * - Down: original peel (fill below the wave). Up: flipped peel (fill above).
 * - Snap commits a full destination frame when done.
 */
export function ShapeOverlayBridge({
  from = "#campaign",
  to = "#introduction",
  onComplete,
}: {
  from?: string;
  to?: string;
  onComplete?: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const onCompleteRef = useRef(onComplete);
  const uid = useId().replace(/:/g, "");

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useGSAP(
    () => {
      const root = rootRef.current;
      const paths = pathRefs.current.filter(Boolean) as SVGPathElement[];
      const fromEl = document.querySelector(from);
      const toEl = document.querySelector(to);
      if (!root || paths.length < 2 || !fromEl || !toEl) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const allPoints = paths.map(() =>
          Array.from({ length: NUM_POINTS }, () => 100)
        );
        const delays = pointDelays(NUM_POINTS);
        // true = original (scroll down), false = flipped (scroll up)
        let covering = true;

        const paint = () => {
          paths.forEach((path, i) => {
            path.setAttribute("d", buildPathD(allPoints[i], covering));
          });
        };

        allPoints.forEach((points) => {
          for (let j = 0; j < NUM_POINTS; j++) points[j] = 100;
        });
        paint();
        gsap.set(root, { autoAlpha: 0 });

        const openTl = gsap.timeline({ paused: true, onUpdate: paint });
        openTl.to({}, { duration: 0.3 });
        paths.forEach((_, i) => {
          const points = allPoints[i];
          const pathDelay = DELAY_PER_PATH * i;
          for (let j = 0; j < NUM_POINTS; j++) {
            openTl.fromTo(
              points,
              { [j]: 100 },
              { [j]: 0, duration: 1, ease: "power2.inOut" },
              0.3 + delays[j] + pathDelay
            );
          }
        });

        ScrollTrigger.create({
          trigger: toEl,
          start: "top bottom",
          end: "top top",
          scrub: 0.85,
          snap: SEAM_SNAP,
          animation: openTl,
          onUpdate: (self) => {
            if (self.direction === 0) return;
            const next = self.direction === 1;
            if (next !== covering) {
              covering = next;
              paint();
            }
          },
          onEnter: () => {
            covering = true;
            paint();
            gsap.set(root, { autoAlpha: 1 });
          },
          onLeave: () => {
            gsap.set(root, { autoAlpha: 0 });
            onCompleteRef.current?.();
          },
          onEnterBack: () => {
            covering = false;
            paint();
            gsap.set(root, { autoAlpha: 1 });
            onCompleteRef.current?.();
          },
          onLeaveBack: () => gsap.set(root, { autoAlpha: 0 }),
        });

        ScrollTrigger.refresh();
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        paths.forEach((path) => {
          path.setAttribute("d", buildPathD(Array(NUM_POINTS).fill(0), true));
        });
        gsap.set(root, { autoAlpha: 0 });
        onCompleteRef.current?.();
      });

      return () => mm.revert();
    },
    { dependencies: [from, to] }
  );

  return (
    <div
      ref={rootRef}
      aria-hidden
      data-seam="campaign-welcome"
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`${uid}-g2`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e6b325" />
            <stop offset="100%" stopColor="#1f355e" />
          </linearGradient>
          <linearGradient id={`${uid}-g1`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1f355e" />
            <stop offset="100%" stopColor="#0a1220" />
          </linearGradient>
        </defs>
        <path
          ref={(el) => {
            pathRefs.current[0] = el;
          }}
          fill={`url(#${uid}-g2)`}
        />
        <path
          ref={(el) => {
            pathRefs.current[1] = el;
          }}
          fill={`url(#${uid}-g1)`}
        />
      </svg>
    </div>
  );
}
