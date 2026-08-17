"use client";

import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

/**
 * Pointer-driven 3D tilt.
 *
 * The page was reading flat because every surface sat on the same plane and
 * only ever changed colour on hover. This gives a card an actual axis: the
 * pointer's offset from centre drives rotateX/rotateY through a spring, and an
 * inner layer lifts on translateZ so the content parallaxes against its own
 * card rather than rotating rigidly with it.
 *
 * Spring constants follow Skiper UI's mouse-follow set (skiper61) — low mass,
 * moderate damping — so the surface answers the cursor immediately instead of
 * sliding after it. Adapted from https://skiper-ui.com (free tier, attribution
 * required); imported from `motion/react` since that is the copy of the library
 * this project already ships.
 *
 * Cost is two composited transforms on one element. No layout, no paint, and
 * the whole thing is skipped on touch (no hover to drive it) and under reduced
 * motion.
 */

const SPRING = { mass: 0.1, damping: 10, stiffness: 131 } as const;

export function Tilt3D({
  children,
  className,
  /** Degrees of rotation at the very edge of the card. */
  max = 9,
  /** Pixels the inner layer floats above the card face. */
  lift = 26,
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  lift?: number;
  as?: "div" | "li";
}) {
  const ref = useRef<HTMLDivElement>(null);
  // -0.5 … 0.5 across each axis.
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  const sx = useSpring(px, SPRING);
  const sy = useSpring(py, SPRING);

  const rotateY = useTransform(sx, [-0.5, 0.5], [-max, max]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [max, -max]);

  const Motion = As === "li" ? motion.li : motion.div;

  return (
    <Motion
      ref={ref as never}
      className={className}
      style={{ perspective: 900 }}
      onPointerMove={(e: React.PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        px.set((e.clientX - r.left) / r.width - 0.5);
        py.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onPointerLeave={() => {
        px.set(0);
        py.set(0);
      }}
    >
      <motion.div
        className="h-full w-full motion-reduce:!transform-none"
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Inner layer rides forward so the content separates from the face —
            this is what reads as depth rather than as a rotating rectangle. */}
        <div
          className="h-full w-full"
          style={{ transform: `translateZ(${lift}px)`, transformStyle: "preserve-3d" }}
        >
          {children}
        </div>
      </motion.div>
    </Motion>
  );
}
