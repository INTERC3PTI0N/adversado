"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "motion/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { RevealWord } from "@/components/TextReveal";
import { useBlockReveal } from "@/components/useBlockReveal";
import VariableProximity from "@/components/reactbits/VariableProximity";
import { ScrollHint } from "@/components/ScrollHint";
import { Typewriter } from "@/components/Typewriter";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Brand book palette.
const GOLD = "#e6b325";

const HEADLINE_2 = "So do most brands.";
/** The whole of the second line now — one word doing the work a sentence used
 *  to. The pairing carries it: the statement is set in the sans, the question
 *  answers back in the serif italic. That face change is the entire emphasis —
 *  no weight, no colour, no marker stroke behind it. */
const SUBHEADING = "Why?";

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

/** The hand-off zoom. The hero doesn't scroll away — it is pinned and flown
 *  *through*, and the Belief picks the same camera move up on the other side
 *  (BeliefSection.tsx). Scrubbed, so the scrollbar is the camera position and
 *  dragging back runs it in reverse for free. */
const FLY_THROUGH_SCALE = 6.5;

/** How much scroll the fly-through is given, as a share of the viewport.
 *
 *  This was 22% originally, which asked a 6.5× zoom to happen inside a fifth
 *  of a screen — the move was over before it read as a move. It then went to
 *  145%, which was smooth but made the reader scroll most of two screens
 *  before the Belief showed up.
 *
 *  85% is the balance: still ~4× the original travel, so the camera has room
 *  to glide, but the pin releases about three-quarters of a screen in and the
 *  next section is right there behind it. Smoothness here comes from the
 *  scrub easing and the absent snap, not from sheer length. */
const FLY_THROUGH_RUNWAY = "+=85%";

/** Seconds the scrub takes to catch up to the scrollbar.
 *
 *  `scrub: true` is a rigid 1:1 binding — every wheel tick lands on the
 *  animation the same frame, so the camera inherits the wheel's own
 *  steppiness. A numeric scrub eases toward the scroll position instead,
 *  which is what turns a sequence of discrete notches into one continuous
 *  glide. Shared with the Belief's arrival so both halves of the handoff
 *  track the scrollbar with the same weight.
 *
 *  Kept proportionate to the runway above. At 1.35 against a short runway the
 *  reader can scroll the whole move faster than the scrub can follow, so the
 *  zoom carries on after they have stopped — smoothing turns into lag. */
export const FLY_THROUGH_SCRUB = 0.9;

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
  const sectionRef = useRef<HTMLElement>(null);
  // Separate from `contentRef` on purpose: that one is owned frame-by-frame by
  // the motion arrival above, and two drivers writing the same `transform`
  // would fight. This wrapper holds the scrim *and* the copy, so the whole
  // hero — air included — flies as one object.
  const zoomRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLSpanElement>(null);

  // The block reveal is driven from here rather than from inside TextReveal,
  // because each word now wraps a VariableProximity instead of a bare string
  // and the two have to share one set of `[data-reveal-*]` pairs. Keyed on
  // `phase` — the headline does not exist in the DOM until the hero arrives,
  // so on Hero's own mount there is nothing for the hook to find.
  useBlockReveal(
    revealRef,
    { stagger: REVEAL_STAGGER, duration: REVEAL_DURATION },
    [phase]
  );

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

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: FLY_THROUGH_RUNWAY,
            pin: true,
            // No snap. An auto-complete that fires at 6% progress turns a
            // scrubbed camera into a cut: the reader nudges the wheel and the
            // whole move is yanked through in under half a second, which is
            // exactly the snappiness this pass is removing. With a real
            // runway, resting mid-zoom is a legitimate frame of the shot
            // rather than a state to be rescued from.
            scrub: FLY_THROUGH_SCRUB,
            // The pin freezes the section, so the layout below has to be told
            // to remeasure once the runway length changes with the viewport.
            invalidateOnRefresh: true,
          },
        });
        // Scale runs linear across the whole pin — that is the camera, and a
        // camera that eases is a camera that stutters against the scrollbar.
        tl.to(zoomRef.current, { scale: FLY_THROUGH_SCALE, ease: "none", duration: 1 }, 0)
          // Held legible through the first stretch, then dissolved across the
          // middle of the move. Starting the fade at 0 (as this did) meant the
          // copy was gone by the time the zoom had really begun, so the long
          // runway would otherwise just be empty stars.
          .to(
            zoomRef.current,
            { opacity: 0, filter: "blur(16px)", ease: "power1.inOut", duration: 0.6 },
            // Ends at 0.95 of the pin rather than 0.85. Finishing earlier left
            // the last stretch of the runway as bare starfield before the
            // Belief edge entered — the copy should still be dissolving as
            // the next section starts climbing into view.
            0.35
          );
      });
      return () => mm.revert();
    },
    { scope: sectionRef }
  );

  return (
    // `z-20`: pinning swaps the section to `position: fixed`, which promotes it
    // into the positioned-element layer alongside the page's fixed black
    // ground (z-0, HomeSections) — and that ground comes later in the DOM, so
    // at equal z-index it would paint straight over the pinned hero.
    <section
      id="hero"
      ref={sectionRef}
      className="relative z-20 flex h-screen w-full items-center justify-center overflow-hidden"
    >
      {/* No background of its own. The page's cinematic scene is fixed to the
          viewport and sits behind this too, so the hero opens in the same
          space every section below it lives in — the story starts in the room
          rather than cutting into it. A field here would only have been
          painted over by that scene anyway, at the cost of a WebGL context. */}

      <div ref={zoomRef} className="absolute inset-0 flex items-center justify-center">
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
              className="font-sans text-[clamp(2.25rem,7vw,5.75rem)] font-light leading-[1.06] tracking-[-0.03em] text-cream"
            >
              {/* Same pointer-reactive weighting the About hero carries: each
                  letter rides the font's `wght` axis as the cursor nears it.
                  The range starts at 300 rather than the About page's 500, so
                  the line still sits at the light weight it is set in and only
                  thickens under the pointer. */}
              <span ref={revealRef}>
                {HEADLINE_2.split(" ").map((word, i) => (
                  <RevealWord key={i} blockColor={GOLD}>
                    <VariableProximity
                      label={word}
                      containerRef={headlineRef as React.RefObject<HTMLElement>}
                      fromFontVariationSettings="'wght' 300"
                      toFontVariationSettings="'wght' 700"
                      radius={220}
                      falloff="gaussian"
                      style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
                    />
                  </RevealWord>
                ))}
              </span>
            </h1>
            <p
              ref={subRef}
              className="font-serif text-[clamp(3rem,9vw,7rem)] font-light italic leading-none tracking-[-0.02em] text-gold"
            >
              {/* Faded in on the same beat the typing starts — the line is
                  sized for the finished word from the first frame, so without
                  this there is a held gap through the whole arrival. */}
              <span
                className="inline-block"
                style={{
                  opacity: typing ? 1 : 0,
                  transition: "opacity 450ms ease",
                }}
              >
                {/* The caret already defaults to gold, which is what the word
                    is now set in, so it needs no override. */}
                <Typewriter
                  text={SUBHEADING}
                  delay={TYPE_DELAY_MS}
                  speed={TYPE_SPEED_MS}
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
      </div>
    </section>
  );
}
