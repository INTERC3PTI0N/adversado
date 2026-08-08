"use client";

import { useEffect, useRef, useState } from "react";
import Spline from "@splinetool/react-spline";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { RepelText } from "@/components/Interactions";
import { Magnify } from "@/components/Magnify";
import { ScrollReveal } from "@/components/ScrollReveal";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Small uppercase HUD label. Montserrat, per the brand book's primary face. */
function Micro({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`block text-[0.6rem] font-medium uppercase tracking-[0.25em] text-cream/50 ${className ?? ""}`}
    >
      {children}
    </span>
  );
}

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
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <section ref={ref} className="relative px-6 py-28 sm:px-10 sm:py-36 lg:px-16">
      <div className="mx-auto max-w-[1500px]">
        {/* ── Row 1: the headline, across the whole width ───────────────── */}
        <div data-reveal className="text-center">
          <Micro>01 // The Belief</Micro>
        </div>
        <h2
          data-reveal
          className="mx-auto mt-8 max-w-[22ch] text-center font-serif text-[clamp(2.5rem,5.5vw,4.75rem)] font-light leading-[1.1] tracking-[-0.01em] text-cream"
        >
          Brands aren’t built in <Hit>launches.</Hit>
        </h2>

        {/* ── Row 2: the object, then the argument ──────────────────────── */}
        <div className="mt-20 grid items-stretch gap-10 md:mt-28 md:grid-cols-2 md:gap-0">
          {/* The panel the tower lives in. A real box now rather than a
              full-height pane, so the camera is framed to its aspect. */}
          {/* Sized by aspect rather than viewport height: the Spline camera is
              framed to the scene's own proportions, so a box that changes shape
              between a phone and a desktop crops or strands it. `max-h` is the
              only vh here, and it just stops a tall column on a short screen. */}
          <div
            data-reveal
            className="flex w-full flex-col gap-6 aspect-[4/5] max-h-[85vh] md:aspect-[3/4] md:pr-0"
          >
            <style>{`.spline-watermark { display: none !important; }`}</style>

            {/* In flow above the scene rather than absolutely over it — as an
                overlay it landed on the staircase at every width below md. */}
            <Micro className="shrink-0 !text-[clamp(0.65rem,1.4vw,0.85rem)] !tracking-[0.3em] !text-cream/70">
              * No two brands are alike
            </Micro>

            <FitScene scene="https://prod.spline.design/GLgtPJT5x743jtOQ/scene.splinecode" />
          </div>

          {/* Hairline between the two, the way the schematic draws it. Only
              once there is a side-by-side to divide. */}
          <div className="flex flex-col justify-center md:border-l md:border-cream/15 md:pl-14">
            <p
              data-reveal
              className="mt-8 max-w-[26ch] font-sans text-[clamp(1.5rem,2.6vw,2.4rem)] font-light leading-[2.5] text-cream/85"
            >
              They’re built in the{" "}
              <Magnify className="font-bold italic text-gold">unglamorous</Magnify> act of
              being unmistakably yourself, everywhere, every time, for years.
            </p>
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
