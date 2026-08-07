"use client";

import { useRef } from "react";
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
          <div
            data-reveal
            className="relative h-[42vh] min-h-[200px] md:h-[90vh] md:pr-14"
          >
            <Spline scene="https://prod.spline.design/0jHViobWfk5chD2D/scene.splinecode" />

            <span className="pointer-events-none absolute left-0 top-1/2 origin-left -translate-y-1/2 -rotate-90">
              <Micro>Memory, not applause</Micro>
            </span>
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
