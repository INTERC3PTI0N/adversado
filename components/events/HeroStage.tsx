"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
  type MotionValue,
} from "motion/react";
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

function Copy({ tone, hidden }: { tone: Tone; hidden?: boolean }) {
  return (
    <div
      {...(hidden ? { "aria-hidden": true } : {})}
      /* Bottom padding clears the CTA, which is drawn on its own layer above
         these two and would otherwise sit on top of the sub-line. */
      className="absolute inset-0 flex flex-col items-center justify-between px-6 pb-44 pt-24 text-center sm:px-10 sm:pb-48 sm:pt-28 lg:px-16"
    >
      <div className="flex max-w-[52rem] flex-col items-center">
        <p
          className="font-sans text-[0.58rem] font-bold uppercase leading-[1.9] tracking-[0.28em] sm:text-[0.68rem] sm:tracking-[0.3em]"
          style={{ color: tone.eyebrow }}
        >
          {EYEBROW}
        </p>

        <h1
          className="mt-7 max-w-[15ch] font-sans text-[clamp(2.1rem,5.4vw,4.25rem)] font-light leading-[1.02] tracking-[-0.03em]"
          style={{ color: tone.head }}
        >
          The room empties.{" "}
          <span className="font-serif italic" style={{ color: tone.accent }}>
            The event shouldn&apos;t.
          </span>
        </h1>
      </div>

      <p
        className="max-w-[42ch] font-serif text-[clamp(0.95rem,1.5vw,1.2rem)] font-light leading-[1.8]"
        style={{ color: tone.sub }}
      >
        Corporate events, conferences, concerts and launches, built in Kochi and
        run across India.
      </p>
    </div>
  );
}

/**
 * Hero stage.
 *
 * A bone ground with a navy plate clipped into a V that tracks the pointer.
 * The headline, eyebrow and sub-line are drawn twice — once dark on the bone
 * layer, once light inside the clipped plate — so the copy reads white-and-gold
 * wherever navy covers it and navy-and-charcoal wherever it doesn't. The mask
 * does the colour switching; nothing measures anything per frame.
 *
 * The prototype's 17vw ADVERSADO wordmark along the bottom edge is gone: it
 * dwarfed the site's own top-left mark and ran straight through the sub-line
 * and the CTA.
 */
export function HeroStage({
  scrollProgress,
}: {
  scrollProgress: MotionValue<number>;
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

  // Copy clears out as the showreel card grows to full bleed.
  const copyOpacity = useTransform(scrollProgress, [0, 0.16], [1, 0]);
  const copyY = useTransform(scrollProgress, [0, 0.16], [0, -40]);

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
    <>
      <div className="absolute inset-0 z-0" style={{ background: EV.bone }} />

      {/* Dark-on-bone reading. This is the copy assistive tech announces. */}
      <motion.div
        style={{ opacity: copyOpacity, y: copyY }}
        className="pointer-events-none absolute inset-0 z-[36]"
      >
        <Copy tone={ON_LIGHT} />
      </motion.div>

      {/* Navy plate, and the light reading of the same words inside it. */}
      <motion.div
        style={{ clipPath, background: EV.navy }}
        className="pointer-events-none absolute inset-0 z-[37]"
      >
        <motion.div style={{ opacity: copyOpacity, y: copyY }} className="absolute inset-0">
          <Copy tone={ON_DARK} hidden />
        </motion.div>
      </motion.div>

      {/* The button sits above both plates: gold on a charcoal border reads on
          either ground, so it needs no second copy — and it has to stay
          clickable, which the plates above are not. */}
      <motion.div
        style={{ opacity: copyOpacity, y: copyY }}
        className="pointer-events-none absolute inset-x-0 bottom-[6.5rem] z-[38] flex justify-center sm:bottom-28"
      >
        <Link
          href="#talk"
          className="pointer-events-auto inline-flex items-center gap-4 border-[4px] border-charcoal bg-gold px-8 py-4 font-sans text-[0.72rem] font-black uppercase tracking-[0.24em] text-charcoal shadow-[6px_6px_0_0_#212121] transition-[transform,box-shadow] duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0_0_#212121] motion-reduce:transition-none"
        >
          Talk to us
          <span aria-hidden>→</span>
        </Link>
      </motion.div>
    </>
  );
}
