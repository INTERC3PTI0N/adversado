"use client";

import { motion } from "motion/react";
import { EV } from "./palette";

/* The reveal is driven from the container, not from each rule.
   `whileInView` on the rules themselves could never fire: their `initial`
   collapses them to `scaleX: 0`, and an element with a zero-area bounding box
   never intersects, so the observer that would start the animation never
   reports them visible. The whole grid stayed invisible. The container has
   real area, so it observes reliably and the children follow by variant. */
function CornerHandle({
  top,
  bottom,
  left,
  right,
  delay = 0,
}: {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  delay?: number;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, scale: 0 },
        shown: { opacity: 1, scale: 1, transition: { duration: 0.4, delay } },
      }}
      className="absolute z-10 h-[9px] w-[9px] border-[3px]"
      style={{ top, bottom, left, right, borderColor: EV.gold, background: EV.navy }}
    />
  );
}

/** Draw-on variants for the frame rules and the three dividers. */
const rule = (duration: number, delay = 0) => ({
  hidden: { scaleX: 0 },
  shown: { scaleX: 1, transition: { duration, delay, ease: "easeInOut" as const } },
});

const ruleY = (duration: number, delay = 0) => ({
  hidden: { scaleY: 0 },
  shown: { scaleY: 1, transition: { duration, delay, ease: "easeInOut" as const } },
});

/**
 * 01 — About us. Draughtsman's grid: a gold frame that draws itself in,
 * quartered by two dividers, with corner handles snapping in behind. Two of
 * the quadrants hold video, two hold type.
 */
export function AboutSection() {
  return (
    <div
      data-nav-navy
      className="relative z-50 min-h-[100vh] w-full overflow-hidden text-cream"
      style={{ background: EV.navy }}
    >
      {/* Grain */}
      <svg className="pointer-events-none absolute inset-0 z-50 h-full w-full opacity-[0.2] mix-blend-screen">
        <filter id="events-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#events-noise)" />
      </svg>

      {/* Background smudges */}
      <div
        className="pointer-events-none absolute left-[10%] top-[30%] h-[50vw] w-[60vw] rounded-[100%] opacity-20 mix-blend-screen blur-[100px]"
        style={{ background: EV.navyLift }}
      />
      <div
        className="pointer-events-none absolute left-[30%] top-[50%] h-[40vw] w-[50vw] rounded-[100%] opacity-10 mix-blend-screen blur-[120px]"
        style={{ background: EV.navyLift }}
      />

      <div className="pointer-events-none absolute inset-0 z-30 flex h-full w-full flex-col p-4 md:p-8 lg:p-12">
        <motion.div
          initial="hidden"
          whileInView="shown"
          viewport={{ once: true, margin: "-10%" }}
          className="relative h-full w-full"
        >
          {/* Frame */}
          <motion.div
            variants={rule(1.5)}
            className="absolute left-0 right-0 top-0 h-[3px] origin-left"
            style={{ background: EV.gold }}
          />
          <motion.div
            variants={rule(1.5)}
            className="absolute bottom-0 left-0 right-0 h-[3px] origin-right"
            style={{ background: EV.gold }}
          />
          <motion.div
            variants={ruleY(1.5)}
            className="absolute bottom-0 left-0 top-0 w-[3px] origin-top"
            style={{ background: EV.gold }}
          />
          <motion.div
            variants={ruleY(1.5)}
            className="absolute bottom-0 right-0 top-0 w-[3px] origin-bottom"
            style={{ background: EV.gold }}
          />

          {/* Dividers */}
          <motion.div
            variants={ruleY(1.2, 0.2)}
            className="absolute bottom-0 left-[45%] top-0 hidden w-[3px] origin-top md:block"
            style={{ background: EV.gold }}
          />
          <motion.div
            variants={rule(1.2, 0.4)}
            className="absolute left-0 top-[25%] hidden h-[3px] w-[45%] origin-left md:block"
            style={{ background: EV.gold }}
          />
          <motion.div
            variants={rule(1.2, 0.6)}
            className="absolute left-[45%] right-0 top-[75%] hidden h-[3px] origin-right md:block"
            style={{ background: EV.gold }}
          />

          {/* Corner handles */}
          <CornerHandle top="-3px" left="-3px" delay={1.0} />
          <CornerHandle top="-3px" right="-3px" delay={1.1} />
          <CornerHandle bottom="-3px" left="-3px" delay={1.2} />
          <CornerHandle bottom="-3px" right="-3px" delay={1.3} />

          <div className="hidden md:block">
            <CornerHandle top="-3px" left="calc(45% - 3px)" delay={1.4} />
            <CornerHandle bottom="-3px" left="calc(45% - 3px)" delay={1.4} />
            <CornerHandle top="calc(25% - 3px)" left="-3px" delay={1.5} />
            <CornerHandle top="calc(25% - 3px)" left="calc(45% - 3px)" delay={1.5} />
            <CornerHandle top="calc(75% - 3px)" left="calc(45% - 3px)" delay={1.6} />
            <CornerHandle top="calc(75% - 3px)" right="-3px" delay={1.6} />
          </div>

          <div className="absolute left-0 top-0 p-3 font-sans text-[3vw] font-bold uppercase leading-[0.9] tracking-[-0.05em] text-cream md:p-5 md:text-[1.2vw]">
            01 — About us
            <br />
            Adversado Events
            <br />
            Est. Kochi®
          </div>

          <div className="absolute left-[45%] top-0 -translate-x-full p-3 font-sans text-[3vw] font-bold uppercase leading-[0.9] tracking-[-0.05em] text-cream md:p-5 md:text-[1.2vw]">
            [KOCHI] STUDIO
          </div>

          <div className="pointer-events-none absolute bottom-4 left-4 w-[45%] md:bottom-8 md:left-8">
            <div className="max-w-[90%] md:max-w-[80%]">
              <h4
                className="mb-4 font-sans text-[2.5vw] font-bold uppercase tracking-[0.2em] opacity-90 md:text-[0.85vw]"
                style={{ color: EV.gold }}
              >
                The advantage is integration.
              </h4>
              <p className="font-sans text-[3.5vw] font-medium leading-[1.3] tracking-[-0.02em] text-cream md:text-[1.35vw]">
                We design and build events under one roof, so nothing gets lost
                between suppliers, because there are none. The crew, the
                workshop, the cameras and the press desk sit in one building in
                Kochi, which is how we ended up called the best event company
                in Kerala.
              </p>
            </div>
          </div>

          <div className="pointer-events-auto absolute bottom-[25%] left-[45%] right-0 top-0 flex items-center justify-center overflow-hidden p-3 md:p-5">
            {/* Stock for now — swap for the studio's own floor coverage. */}
            <motion.img
              initial={{ opacity: 0, scale: 1.05 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              src="https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=2069&auto=format&fit=crop"
              alt="Corporate floor mid-event"
              className="h-full w-full object-cover opacity-80"
            />
          </div>

          <div className="pointer-events-auto absolute bottom-0 left-[45%] right-0 top-[75%] flex items-center justify-center overflow-hidden p-3 md:p-5">
            {/* Stock for now — swap for the studio's own workshop coverage. */}
            <motion.img
              initial={{ opacity: 0, scale: 1.05 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              src="https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=2070&auto=format&fit=crop"
              alt="Stage build in the workshop"
              className="h-full w-full object-cover opacity-80"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
