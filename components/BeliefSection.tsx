"use client";

import { useEffect, useRef, useState } from "react";
import Spline from "@splinetool/react-spline";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { COMMIT_SNAP } from "@/components/Hero";
import { RepelText } from "@/components/Interactions";
import { Magnify } from "@/components/Magnify";
import { ScrollReveal } from "@/components/ScrollReveal";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** The size the scene is framed for. Spline positions its camera in world
 *  units rather than CSS pixels, so shrinking the canvas crops the scene
 *  instead of zooming it out — on a phone that cut the keyboard in half. */
const SCENE_W = 800;
const SCENE_H = 1000;

/** Renders the scene at its design size and scales the whole canvas to fit the
 *  available box, so the framing is identical on a phone and a desktop. */
function FitScene({ scene }: { scene: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setScale(Math.min(width / SCENE_W, height / SCENE_H));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={box} className="relative min-h-0 flex-1 overflow-hidden">
      <div
        className="absolute left-1/2 top-1/2 origin-center"
        style={{
          width: SCENE_W,
          height: SCENE_H,
          // Held invisible until the first measurement, or it paints once at
          // full size and jumps.
          visibility: scale ? "visible" : "hidden",
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        <Spline scene={scene} className="h-full w-full" />
      </div>
    </div>
  );
}

/** A word in the closing statement that carries the weight, in brand gold. */
function Hit({ children }: { children: React.ReactNode }) {
  return <span className="font-bold text-gold">{children}</span>;
}

/**
 * The Belief, in four stacked rows: the headline across the top, then the
 * object beside the argument, then the statement full-bleed, then the line
 * it all resolves to. Hairlines instead of panels, and no background of its
 * own — the page's scene runs straight through underneath, which is what
 * keeps the site reading as one space rather than a stack of coloured bands.
 */
export function BeliefSection() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-reveal]", {
          autoAlpha: 0,
          y: 24,
          duration: 1,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: ref.current, start: "top 72%", once: true },
        });

        // The receiving half of the hero's fly-through (Hero.tsx). The hero is
        // pinned and flown past for one viewport of scroll; this section is
        // waiting on the far side of it, small and far off, and closes on the
        // camera as it rises. Scrubbed, so scrolling back reverses it exactly.
        //
        // Animating the inner block, not the <section>: the section is the
        // trigger, and ScrollTrigger measures a trigger's *transformed* box —
        // scaling the thing whose position decides the progress feeds back on
        // itself and the scrub jitters. The section stays untransformed and
        // only what's inside it moves.
        //
        // Origin near the top rather than dead centre: this block runs well
        // past a viewport tall, so a centred origin at 0.42 scale would park
        // its first line hundreds of pixels below the fold and eat most of the
        // runway before anything was visible. No blur here either — the Spline
        // canvas in row two would be re-rastered every frame for it.
        gsap.from("[data-zoom]", {
          scale: 0.42,
          opacity: 0,
          transformOrigin: "50% 10%",
          ease: "none",
          scrollTrigger: {
            trigger: ref.current,
            start: "top bottom",
            end: "top 18%",
            scrub: true,
            // Same rule as the hero's half, imported rather than restated —
            // the two are one move and a snap that behaved differently on
            // each side of the handoff would read as two.
            snap: COMMIT_SNAP,
          },
        });
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <section ref={ref} className="relative px-6 py-28 sm:px-10 sm:py-36 lg:px-16">
      <div data-zoom className="mx-auto max-w-[1500px]">
        {/* ── Row 1: the headline, across the whole width ───────────────── */}
        {/* Matched to every other section's eyebrow (gold, `text-sm`,
            `0.35em`). It was the only one set in cream at `Micro` size, and
            the only one carrying a number — with no 02 or 03 anywhere on the
            page, the "01 //" was sequence notation for a sequence that
            doesn't exist. */}
        <p data-reveal className="mb-8 text-center text-sm uppercase tracking-[0.35em] text-gold">
          The Belief
        </p>
        <h2
          data-reveal
          className="mx-auto max-w-[22ch] text-center font-serif text-[clamp(2.5rem,5.5vw,4.75rem)] font-light leading-[1.1] tracking-[-0.01em] text-cream"
        >
          Brands aren’t built in <Hit>launches.</Hit>
        </h2>

        {/* ── Row 2: the argument, then the object ──────────────────────── */}
        <div className="mt-20 grid items-stretch gap-10 md:mt-28 md:grid-cols-2 md:gap-0">
          {/* Hairline between the two, the way the schematic draws it. Only
              once there is a side-by-side to divide — and it stays on this
              column rather than the scene's: this one stretches to the row's
              full height, where the scene's height is fixed by its aspect and
              would leave the rule stopping short. */}
          <div className="flex flex-col justify-center md:border-r md:border-cream/15 md:pr-14">
            <p
              data-reveal
              className="mt-8 max-w-[26ch] font-sans text-[clamp(1.5rem,2.6vw,2.4rem)] font-light leading-[2.5] text-cream/85"
            >
              They’re built in the{" "}
              <Magnify className="font-bold italic text-gold">unglamorous</Magnify> act of
              being unmistakably yourself, everywhere, every time, for years.
            </p>
          </div>

          {/* The panel the object lives in. Sized by aspect rather than
              viewport height: the Spline camera is framed to the scene's own
              proportions, so a box that changes shape between a phone and a
              desktop crops or strands it. `max-h` is the only vh here, and it
              just stops a tall column on a short screen. */}
          <div
            data-reveal
            className="flex w-full flex-col gap-6 aspect-[4/5] max-h-[85vh] md:aspect-[3/4] md:pl-14"
          >
            <style>{`.spline-watermark { display: none !important; }`}</style>

            {/* In flow above the scene rather than absolutely over it — as an
                overlay it landed on the keys at every width below md. Set at
                reading weight with the gold marker landing on the words the
                keys underneath are literally pressing. */}
            <div className="shrink-0 space-y-3">
              <p className="font-sans text-[clamp(0.95rem,2.1vw,1.3rem)] font-bold leading-snug tracking-tight text-cream/80">
                {/* `box-decoration-break: clone` so the marker keeps its ends
                    when the phrase wraps in the narrow mobile column. */}
                <span className="rounded-[0.3em] bg-gold/18 px-[0.22em] py-[0.04em] text-gold [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
                  Copy + paste
                </span>{" "}
                doesn’t work. <span className="text-gold">We build what stays.</span>
              </p>
            </div>

            <FitScene scene="https://prod.spline.design/GLgtPJT5x743jtOQ/scene.splinecode" />
          </div>
        </div>

        {/* ── Row 3: the statement, full width and loud ─────────────────── */}
        <div data-reveal className="mt-24 md:mt-32">
          <span className="block h-px w-full bg-cream/15" />
        </div>
        {/* No `data-reveal` here: the section's own fade would be writing
            opacity to the same element the word scrub is animating, and the
            two would fight. This paragraph reveals itself. */}
        <ScrollReveal className="mt-12 font-sans text-[clamp(1.85rem,4.4vw,4rem)] font-light leading-[2] tracking-[-0.015em] text-cream/70">
          The campaign <Hit>ends.</Hit> The event gets <Hit>packed down.</Hit> The post{" "}
          <Hit>scrolls away.</Hit> What stays is whatever people <Hit>remember.</Hit> So
          that’s what we build for. The <Hit>memory,</Hit> not the applause.
        </ScrollReveal>

        {/* ── Row 4: what it all resolves to ───────────────────────────── */}
        <p
          data-reveal
          className="mt-24 text-center font-serif text-[clamp(1.75rem,3.8vw,3rem)] leading-[1.2] text-gold md:mt-32"
        >
          <RepelText text="Attention is rented. Memory is owned." radius={110} strength={16} />
        </p>
      </div>
    </section>
  );
}
