"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { motion, useReducedMotion } from "motion/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * The slide breaker between the verticals and the process — the one place on
 * the site that stops being a transparent pane of type over the starfield and
 * becomes a solid object. Everything else here is cream and gold on near-black;
 * this is a full-bleed slab of brand gold with the type knocked out of it in
 * navy, so it reads as a hard cut in the film rather than another section.
 *
 * Two libraries, each doing what it is actually good at:
 *
 *   motion  — the reveal. The slab opens vertically from a hairline (`scaleY`
 *             off a centre origin) as it enters view, and the line inside it
 *             rises behind that edge. Declarative, viewport-triggered, done.
 *   gsap    — the loop and the physics. An infinite marquee that reads the
 *             scrollbar's velocity every frame and answers it: faster scroll
 *             drives the belt faster, scrolling up runs it backwards, and the
 *             whole strip skews into the direction of travel and relaxes back
 *             out when the page settles. That is a continuous per-frame
 *             response to an input, which is GSAP's job, not a transition's.
 */

const LINE = "We build brands that live rent-free in customers’ minds.";
/** How many copies make up one belt. The track holds two belts and travels
 *  exactly half its width, so the seam always lands off-screen. */
const COPIES = 3;
/** Seconds for one full belt pass at rest. */
const CYCLE = 22;

/** One copy of the line. `rent-free` is the payload, so it gets the inversion —
 *  navy chip, gold type — which is the page's gold-marker device with the two
 *  colours swapped, since here the ground is already gold. */
function Phrase() {
  return (
    <span className="flex shrink-0 items-center gap-[0.35em] px-[0.35em]">
      <span>We build brands that live</span>
      <span className="rounded-[0.12em] bg-navy px-[0.18em] pb-[0.06em] text-gold">
        rent-free
      </span>
      <span>in customers’ minds.</span>
      {/* Braced: a bare `//` in a children position parses as a comment. */}
      <span aria-hidden className="px-[0.4em] text-navy/35">
        {"//"}
      </span>
    </span>
  );
}

export function SlideBreaker() {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const el = track.current;
      if (!el || reduced) return;

      // The belt. `xPercent` rather than `x` so it stays correct at any width
      // without measuring, and the modifier wraps the value instead of the
      // tween restarting — a restart would visibly hitch at the seam.
      const belt = gsap.to(el, {
        xPercent: -50,
        duration: CYCLE,
        ease: "none",
        repeat: -1,
        modifiers: { xPercent: (v) => `${parseFloat(v) % 50}` },
      });

      // Velocity is in px/sec and spikes into the thousands on a flick, so it
      // is divided down and clamped before it drives anything. Sign carries
      // direction: scrolling up runs the belt backwards.
      const st = ScrollTrigger.create({
        trigger: root.current,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          const v = self.getVelocity();
          const boost = gsap.utils.clamp(-6, 6, 1 + v / 900);
          gsap.to(belt, { timeScale: boost, duration: 0.5, overwrite: true });
          gsap.to(el, {
            skewX: gsap.utils.clamp(-14, 14, v / -220),
            duration: 0.5,
            ease: "power2.out",
            overwrite: "auto",
          });
        },
        // Nothing is driving the skew once the page stops, so it has to be
        // told to come home — otherwise it holds whatever the last frame of
        // the flick left it at.
        onScrubComplete: () => gsap.to(el, { skewX: 0, duration: 0.6 }),
      });

      return () => {
        belt.kill();
        st.kill();
      };
    },
    { scope: root, dependencies: [reduced] }
  );

  return (
    // Full-bleed: the slab has to touch both edges or it reads as a card. The
    // parent run of sections is `overflow-x-hidden`, so 100vw can't introduce
    // a scrollbar here.
    <div
      ref={root}
      className="relative left-1/2 my-24 w-screen -translate-x-1/2 sm:my-32"
      aria-label={LINE}
      role="img"
    >
      <motion.div
        className="origin-center overflow-hidden bg-gold py-6 sm:py-9"
        initial={reduced ? undefined : { scaleY: 0 }}
        whileInView={reduced ? undefined : { scaleY: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          initial={reduced ? undefined : { y: "110%" }}
          whileInView={reduced ? undefined : { y: "0%" }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.9, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* `flex w-max` so the track is exactly its content's width and the
              -50% travel lands on the identical second belt. */}
          <div
            ref={track}
            aria-hidden
            className="flex w-max font-sans text-[clamp(2rem,7vw,5.5rem)] font-black uppercase not-italic leading-none tracking-tight text-navy will-change-transform"
          >
            {Array.from({ length: COPIES * 2 }, (_, i) => (
              <Phrase key={i} />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
