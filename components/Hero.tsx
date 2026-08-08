"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "motion/react";
import { TextReveal } from "@/components/TextReveal";
import { ScrollHint } from "@/components/ScrollHint";
import { Typewriter } from "@/components/Typewriter";

// Brand book palette.
const GOLD = "#e6b325";

const HEADLINE_2 = "SO DO MOST BRANDS.";
/** The whole of the second line now — one word doing the work a sentence used
 *  to. Typed into a gold marker stroke, which is why it is set in navy. */
const SUBHEADING = "WHY?";

const REVEAL_STAGGER = 0.08;
const REVEAL_DURATION = 0.5;

// The tunnel hands off mid-rush, so the hero has to arrive rather than fade
// in — and it has to arrive from a long way off, on the same move.
//
// Apparent size is 1/z, so each layer is given a depth to start at and they
// all converge on z = 1. The block opens at a tenth of full size and covers
// most of its travel late, the way something actually approaching does. The
// headline and subheading then sit at their own depths *within* the block, so
// they don't arrive together — the subheading is nearest, grows the most, and
// lands last. That spread is the parallax.
const ARRIVE_MS = 2600;
/** The block's own depth — 1/10th size at the start of the approach. */
const BLOCK_Z = 10;
/** Depths within the block, multiplied on top of it. */
const HEADLINE_Z = 1.5;
const SUB_Z = 2.9;
/** Fast off the mark, then decelerating into place, so the last stretch settles
 * rather than slamming. */
const ARRIVE_EASE = [0.2, 0.45, 0.3, 1] as const;
/** Roughly when the block is close enough to read. The subheading waits for it
 * — no point typing a sentence while it's still a smudge in the distance. */
const ARRIVE_SETTLE_MS = 1800;
/** The t = 0 frame of the arrival, authored into the markup. The block mounts
 * the instant the tunnel starts opening, and the driver below is an effect —
 * without this it would paint once at full size before the first update. */
const ARRIVE_START = {
  transform: `scale(${1 / BLOCK_Z}) translateY(9%)`,
  opacity: 0.2,
  filter: "blur(12px)",
} as const;

// "So do most brands." is four words; the last finishes at 3*stagger +
// duration*2. The subheading starts typing once that has fully landed.
const HEADLINE_2_DONE_MS = (3 * REVEAL_STAGGER + REVEAL_DURATION * 2) * 1000;
// Offset past the arrival below: the headline's blocks can sweep while it is
// still closing, but the subheading shouldn't start typing until there is
// something legible to type underneath.
const TYPE_DELAY_MS = ARRIVE_SETTLE_MS + HEADLINE_2_DONE_MS + 250;
// One character at a time, slowly — four letters rattled out at the default
// speed would be over before the eye reached them.
const TYPE_SPEED_MS = 200;
// The scroll cue lands right behind the last character: by the time the
// question is on screen, the hero has said everything it has to say, and the
// next thing to communicate is "keep going".
const TYPE_RUN_MS = SUBHEADING.length * TYPE_SPEED_MS;
const SCROLL_HINT_DELAY_MS = TYPE_DELAY_MS + TYPE_RUN_MS + 400;

export function Hero({ active = true }: { active?: boolean }) {
  // The disappearing headline and its countdown now open the site, inside the
  // preloader, and end with the lights going out. The hero picks the thought
  // up on the other side of that blackout — "So do most brands." is the
  // answer to a line the reader has just watched vanish.
  const [phase, setPhase] = useState<"idle" | "second">("idle");
  // Gates the marker stroke behind the question, so it arrives with the first
  // character rather than sitting empty through the whole approach.
  const [typing, setTyping] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hero renders from page load, underneath the preloader/transition — but
    // its reveal must not play until those have handed off, or it is long
    // over by the time anyone can see it.
    if (!active) return;
    const t = setTimeout(() => setPhase("second"), 0);
    const ink = setTimeout(() => setTyping(true), TYPE_DELAY_MS);
    return () => {
      clearTimeout(t);
      clearTimeout(ink);
    };
  }, [active]);

  useEffect(() => {
    if (phase !== "second") return;
    const el = contentRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // The block is authored already far away (see ARRIVE_START below) so it
      // can't flash at full size for a frame before the driver takes over.
      // With no driver coming, that has to be undone here instead.
      el.style.cssText = "";
      return;
    }
    // The preloader's tunnel push ends carrying the reader forward; this picks
    // that motion up rather than starting a fresh reveal. Each layer closes
    // from its own distance and settles on its own beat — that spread is the
    // parallax, and it's what sells the handoff as one continuous rush rather
    // than a second, separate zoom starting cold.
    const headline = headlineRef.current;
    const sub = subRef.current;
    const scrim = scrimRef.current;

    // One driver for the whole arrival rather than a tween per layer — every
    // layer has to read off the same camera position or the depths stop
    // agreeing with each other and the parallax falls apart.
    const controls = animate(0, 1, {
      duration: ARRIVE_MS / 1000,
      ease: ARRIVE_EASE,
      onUpdate: (t) => {
        /** Apparent size of something that started at depth `z0`. */
        const size = (z0: number) => 1 / (z0 + (1 - z0) * t);
        const away = 1 - t;

        el.style.transform = `scale(${size(BLOCK_Z)}) translateY(${away * 9}%)`;
        el.style.opacity = String(Math.min(1, 0.2 + t * 3));
        // Only the block carries the blur — the distance haze belongs to the
        // whole thing, and per-layer filters would just stack over each other.
        el.style.filter = `blur(${Math.max(0, 1 - t * 1.6) * 12}px)`;

        if (headline) headline.style.transform = `scale(${size(HEADLINE_Z)}) translateY(${away * -5}%)`;
        // The near layer: grows the most and drops the furthest, so it peels
        // away from the headline on the way in instead of tracking it.
        if (sub) sub.style.transform = `scale(${size(SUB_Z)}) translateY(${away * 26}%)`;
        // The scrim is the air being flown through, so it goes the other way —
        // wide open at distance, closing down as the block lands.
        if (scrim) {
          scrim.style.transform = `scale(${1 + away * 1.6})`;
          scrim.style.opacity = String(0.2 + t * 0.8);
        }
      },
    });
    return () => controls.stop();
  }, [phase]);

  return (
    <section className="relative flex h-screen w-full items-center justify-center overflow-hidden">
      {/* No background of its own. The page's cinematic scene is fixed to the
          viewport and sits behind this too, so the hero opens in the same
          space every section below it lives in — the story starts in the room
          rather than cutting into it. A field here would only have been
          painted over by that scene anyway, at the cost of a WebGL context. */}

      {/* Soft navy scrim, so a star or a stray highlight never lands straight
          through the headline and eats its contrast. Falls off well before
          the edges, keeping the field continuous. */}
      <div
        ref={scrimRef}
        aria-hidden
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(ellipse 62% 46% at 50% 48%, rgba(31,53,94,0.78), rgba(31,53,94,0) 72%)",
        }}
      />

      <div className="relative z-10 flex w-full flex-col items-center px-4 text-center">
        {phase === "second" && (
          <div
            ref={contentRef}
            className="flex w-full max-w-full flex-col items-center gap-10"
            style={ARRIVE_START}
          >
            <h1
              ref={headlineRef}
              className="text-[clamp(2.5rem,8vw,6.5rem)] font-bold leading-[1.02] tracking-tight text-cream"
            >
              <TextReveal
                text={HEADLINE_2}
                blockColor={GOLD}
                stagger={REVEAL_STAGGER}
                duration={REVEAL_DURATION}
                emphasis="brands"
              />
            </h1>
            <p
              ref={subRef}
              className="font-sans text-[clamp(3.5rem,13vw,10rem)] font-black leading-none tracking-tight"
            >
              {/* The marker stroke is its own span rather than classes on the
                  Typewriter: that component absolutely positions the typed
                  copy over an invisible spacer with `inset-0`, so any padding
                  of its own would offset the two from each other.

                  Faded in on the same beat the typing starts — the block is
                  sized for the finished word from the first frame, and an
                  empty gold rectangle sitting through the whole arrival reads
                  as a bug rather than a highlight. */}
              <span
                className="inline-block rounded-[0.08em] bg-gold px-[0.16em] pb-[0.06em] text-navy"
                style={{
                  opacity: typing ? 1 : 0,
                  transition: "opacity 450ms ease",
                }}
              >
                {/* The caret defaults to gold, which is invisible on gold. */}
                <Typewriter
                  text={SUBHEADING}
                  delay={TYPE_DELAY_MS}
                  speed={TYPE_SPEED_MS}
                  className="[&_.caret]:text-navy"
                />
              </span>
            </p>

            {/* Directly under the question, not pinned to the bottom of the
                section: the cue is the answer to "WHY?" — it points at where
                the answer is. */}
            <ScrollHint delay={SCROLL_HINT_DELAY_MS} />
          </div>
        )}
      </div>
    </section>
  );
}
