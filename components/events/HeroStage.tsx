"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
  type MotionValue,
} from "motion/react";
import { ShowreelCard } from "./Showreel";
import { EV } from "./palette";

const EYEBROW =
  "Corporate Events · Conferences · Entertainment · Gaming · Brand Events";

type Tone = {
  eyebrow: string;
  head: string;
  accent: string;
  sub: string;
};

/* Two readings of the same words. The navy plate is clipped over the bone
   ground, so wherever it covers the copy the light set shows and wherever it
   doesn't the dark set does — the type inverts exactly at the mask edge
   instead of fighting whichever ground happens to be under it. */
const ON_LIGHT: Tone = {
  eyebrow: "rgba(33,33,33,0.55)",
  head: EV.charcoal,
  accent: EV.navy,
  sub: "rgba(33,33,33,0.72)",
};

const ON_DARK: Tone = {
  eyebrow: "rgba(249,247,242,0.6)",
  head: EV.cream,
  accent: EV.gold,
  sub: "rgba(249,247,242,0.75)",
};

/**
 * One reading of the hero copy, laid out as three rows: type at the top, an
 * empty stage in the middle, type at the bottom. Both readings use the same
 * grid, so the middle row is the same rectangle in each — which is what the
 * card is then sized against.
 *
 * The CTA is drawn in both layers. The plate above is `pointer-events-none`,
 * so a click passes through it to the identical button on the layer beneath;
 * only that one is interactive.
 */
function Copy({
  tone,
  hidden,
  stageRef,
}: {
  tone: Tone;
  hidden?: boolean;
  stageRef?: React.Ref<HTMLDivElement>;
}) {
  return (
    <div
      {...(hidden ? { "aria-hidden": true } : {})}
      className="absolute inset-0 grid grid-rows-[auto_minmax(0,1fr)_auto] justify-items-center gap-y-4 px-6 pb-8 pt-16 text-center sm:gap-y-6 sm:px-10 sm:pb-10 sm:pt-20 lg:px-16"
    >
      <div className="flex max-w-[52rem] flex-col items-center">
        <p
          className="font-sans text-[min(0.52rem,1.6vh)] font-bold uppercase leading-[1.7] tracking-[0.2em] sm:text-[min(0.62rem,1.7vh)] sm:tracking-[0.28em] lg:text-[min(0.68rem,1.8vh)] lg:tracking-[0.3em]"
          style={{ color: tone.eyebrow }}
        >
          {EYEBROW}
        </p>

        <h1
          className="mt-4 max-w-[15ch] font-sans text-[min(clamp(1.6rem,5vw,4.25rem),8.5vh)] font-light leading-[1.05] tracking-[-0.03em] sm:mt-6"
          style={{ color: tone.head }}
        >
          The room empties.{" "}
          <span className="font-serif italic" style={{ color: tone.accent }}>
            The event shouldn&apos;t.
          </span>
        </h1>
      </div>

      {/* The card's box. Empty on purpose — it exists to be measured. */}
      <div ref={stageRef} className="w-full" />

      <div className="flex flex-col items-center">
        <p
          className="max-w-[42ch] font-serif text-[min(clamp(0.82rem,1.5vw,1.2rem),2.5vh)] font-light leading-[1.6]"
          style={{ color: tone.sub }}
        >
          Corporate events, conferences, concerts and launches, built in Kochi to
          run across India.
        </p>

        <Link
          href="#talk"
          tabIndex={hidden ? -1 : undefined}
          className={`mt-4 inline-flex items-center gap-4 border-[4px] border-charcoal bg-gold px-6 py-3 font-sans text-[0.62rem] font-black uppercase tracking-[0.2em] text-charcoal shadow-[6px_6px_0_0_#212121] transition-[transform,box-shadow] duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0_0_#212121] motion-reduce:transition-none sm:mt-6 sm:px-8 sm:py-4 sm:text-[0.72rem] sm:tracking-[0.24em] ${
            hidden ? "pointer-events-none" : "pointer-events-auto"
          }`}
        >
          Talk to us
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}

/**
 * Hero stage.
 *
 * A bone ground with a navy plate clipped into a V that tracks the pointer.
 * The copy is drawn twice — once dark on the bone layer, once light inside the
 * clipped plate — so it reads white-and-gold wherever navy covers it and
 * navy-and-charcoal wherever it doesn't. The mask does the colour switching;
 * nothing measures anything per frame.
 *
 * The card lives here rather than in the page so one component owns the hero's
 * geometry: it is sized to the measured middle row, which is what keeps it off
 * the headline above and the sub-line and CTA below at every viewport instead
 * of being centred independently and hoping.
 */
export function HeroStage({
  scrollProgress,
  playhead,
  onHover,
  onLeave,
}: {
  scrollProgress: MotionValue<number>;
  playhead: MotionValue<number>;
  onHover: () => void;
  onLeave: () => void;
}) {
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const smoothX = useSpring(mouseX, { damping: 45, stiffness: 400, mass: 0.4 });
  const smoothY = useSpring(mouseY, { damping: 45, stiffness: 400, mass: 0.4 });

  const topX = useTransform(smoothX, (x) => x * 100 + 15);
  const bottomX = useTransform(smoothX, (x) => x * 100 - 15);
  const mouseXPct = useTransform(smoothX, (x) => x * 100);
  const mouseYPct = useTransform(smoothY, (y) => y * 100);

  const clipPath = useMotionTemplate`polygon(100% 0%, 100% 100%, ${bottomX}% 100%, ${mouseXPct}% ${mouseYPct}%, ${topX}% 0%)`;

  // Copy clears out as the card grows to full bleed.
  const copyOpacity = useTransform(scrollProgress, [0, 0.16], [1, 0]);
  const copyY = useTransform(scrollProgress, [0, 0.16], [0, -40]);

  /* The gap left between the two blocks of type, measured rather than guessed:
     the headline rewraps with viewport width, so a fixed reserve would be
     wrong at most sizes. */
  const stageRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState({ width: 520, height: 320, top: 0 });

  useEffect(() => {
    const el = stageRef.current;
    const root = rootRef.current;
    if (!el || !root) return;

    /* Top is stored as well as size. Centring the card on the hero instead of
       on this row put it into the headline whenever the two blocks of type
       differed in height — a short, wide viewport being the worst case. */
    let raf = 0;

    /* Deferred a frame, and re-run on window resize as well as on the
       observer. Reading straight out of the ResizeObserver callback catches
       the row mid-reflow, which left the card positioned against a stale
       rect — visible as an overlap that only appeared after a resize. */
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const base = root.getBoundingClientRect();
        setStage((prev) =>
          Math.abs(prev.width - r.width) < 0.5 &&
          Math.abs(prev.height - r.height) < 0.5 &&
          Math.abs(prev.top - (r.top - base.top)) < 0.5
            ? prev
            : { width: r.width, height: r.height, top: r.top - base.top },
        );
      });
    };
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    ro.observe(root);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth);
      mouseY.set(e.clientY / window.innerHeight);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        mouseX.set(e.touches[0].clientX / window.innerWidth);
        mouseY.set(e.touches[0].clientY / window.innerHeight);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [mouseX, mouseY]);

  return (
    <div ref={rootRef} className="absolute inset-0">
      <div className="absolute inset-0 z-0" style={{ background: EV.bone }} />

      {/* Dark-on-bone reading. This is the copy assistive tech announces, and
          the layer whose middle row is measured and whose CTA is clickable. */}
      <motion.div
        style={{ opacity: copyOpacity, y: copyY }}
        className="pointer-events-none absolute inset-0 z-[36]"
      >
        <Copy tone={ON_LIGHT} stageRef={stageRef} />
      </motion.div>

      {/* Navy plate, and the light reading of the same words inside it. */}
      <motion.div
        style={{ clipPath, background: EV.navy }}
        className="pointer-events-none absolute inset-0 z-[37]"
      >
        <motion.div
          style={{ opacity: copyOpacity, y: copyY }}
          className="absolute inset-0"
        >
          <Copy tone={ON_DARK} hidden />
        </motion.div>
      </motion.div>

      {/* The card, above the plate so it is never clipped by it, and sized to
          the measured gap so it never reaches the type. */}
      <div
        className="pointer-events-none absolute inset-x-0 z-[45] flex items-center justify-center"
        style={{ top: stage.top, height: stage.height }}
      >
        <ShowreelCard
          progress={playhead}
          scrollProgress={scrollProgress}
          maxWidth={stage.width}
          maxHeight={stage.height}
          onHover={onHover}
          onLeave={onLeave}
        />
      </div>
    </div>
  );
}
