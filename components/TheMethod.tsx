"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The Method — the Six Ds as a user-driven stage sequence.
 *
 * This is the page's "craftsmanship" beat: the one section where the visitor
 * stops scrolling and works the interface themselves. The brand book's own
 * framing does the art direction — "Develop feeds straight back into Discover.
 * It's a loop, not a line" — so the rail closes on itself rather than running
 * left to right and stopping, and the sixth stage points back at the first.
 *
 * Interaction is deliberately one thing: choose a stage, the panel changes.
 * Hover on a pointer, tap on touch, arrow keys on a keyboard. No scroll
 * hijack, no autoplay carousel — the visitor is always the one moving.
 */

const STAGES = [
  {
    n: "01",
    name: "Discover",
    line: "Understand the business — market, ambitions, problems.",
    note: "Replace assumptions with insight.",
  },
  {
    n: "02",
    name: "Debate",
    line: "The insight gets argued before it gets approved.",
    note: "Conviction, not consensus.",
  },
  {
    n: "03",
    name: "Define",
    line: "Set the strategic position that guides every decision after it.",
    note: "One position. Written down.",
  },
  {
    n: "04",
    name: "Design",
    line: "Identity, communication and experience as one connected system.",
    note: "Nothing designed in isolation.",
  },
  {
    n: "05",
    name: "Deliver",
    line: "Consistency measured as strictly as quality, at every touchpoint.",
    note: "The standard doesn't flex.",
  },
  {
    n: "06",
    name: "Develop",
    line: "Measure, refine, improve. Brands are living systems.",
    note: "Feeds straight back into Discover.",
  },
] as const;

export function TheMethod() {
  const [active, setActive] = useState(0);
  const railRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Arrow keys walk the rail once anything in it has focus, and the walk wraps
  // — the loop is the point of the section.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const onKey = (e: KeyboardEvent) => {
      const dir =
        e.key === "ArrowRight" || e.key === "ArrowDown"
          ? 1
          : e.key === "ArrowLeft" || e.key === "ArrowUp"
            ? -1
            : 0;
      if (!dir) return;
      e.preventDefault();
      setActive((i) => {
        const next = (i + dir + STAGES.length) % STAGES.length;
        btnRefs.current[next]?.focus();
        return next;
      });
    };
    rail.addEventListener("keydown", onKey);
    return () => rail.removeEventListener("keydown", onKey);
  }, []);

  const stage = STAGES[active];

  return (
    <section
      aria-label="The Method"
      className="relative border-t border-cream/12 px-6 py-28 sm:px-10 sm:py-36 lg:px-16"
    >
      <div className="mx-auto max-w-[1500px]">
        <div className="flex flex-wrap items-baseline justify-between gap-x-12 gap-y-4">
          <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-gold">
            The Method
          </p>
          <p className="font-sans text-[0.7rem] uppercase tracking-[0.28em] text-cream/35">
            A loop, not a line
          </p>
        </div>

        <h2 className="mt-10 max-w-[16ch] font-sans text-[clamp(2.25rem,6vw,4.75rem)] font-light leading-[1.02] tracking-[-0.03em] text-cream">
          Six Ds,{" "}
          <span className="font-serif italic text-gold">no filler.</span>
        </h2>

        {/* The stage panel sits above the rail so the eye lands on the content
            it is about to change, not on the controls. Fixed min-height keeps
            the rail from jumping as copy length varies between stages. */}
        <div className="mt-20 grid min-h-[15rem] gap-x-16 gap-y-8 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)]">
          <p
            aria-hidden
            className="font-sans text-[clamp(5rem,16vw,13rem)] font-extralight leading-[0.78] tracking-[-0.06em] text-cream/[0.09]"
          >
            {stage.n}
          </p>

          {/* Announced as one region so a screen reader hears the whole stage
              on change rather than six disconnected fragments. */}
          <div aria-live="polite" className="min-w-0 self-center">
            <p
              key={`${stage.name}-name`}
              className="font-sans text-[clamp(2rem,4.6vw,3.5rem)] font-light leading-[1.05] tracking-[-0.03em] text-gold"
            >
              {stage.name}
            </p>
            <p
              key={`${stage.name}-line`}
              className="mt-6 max-w-[34ch] font-serif text-[clamp(1.1rem,1.9vw,1.55rem)] font-light leading-[1.65] text-cream/85"
            >
              {stage.line}
            </p>
            <p
              key={`${stage.name}-note`}
              className="mt-4 max-w-[34ch] font-sans text-[0.85rem] font-light leading-[1.7] tracking-[0.02em] text-cream/45"
            >
              {stage.note}
            </p>
          </div>
        </div>

        {/* Rail — six names on one rule. Wraps to two rows on narrow screens
            rather than scrolling sideways, so nothing is hidden off-canvas on
            a phone. */}
        <div
          ref={railRef}
          role="tablist"
          aria-label="Stages"
          className="mt-20 grid grid-cols-2 gap-px border-t border-cream/12 sm:grid-cols-3 lg:grid-cols-6"
        >
          {STAGES.map((s, i) => {
            const on = i === active;
            return (
              <button
                key={s.name}
                ref={(el) => {
                  btnRefs.current[i] = el;
                }}
                role="tab"
                aria-selected={on}
                tabIndex={on ? 0 : -1}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse") setActive(i);
                }}
                className={`group relative -mt-px flex flex-col items-start gap-2 border-t pt-6 pb-8 pr-4 text-left outline-none transition-colors duration-500 ${
                  on
                    ? "border-gold"
                    : "border-transparent hover:border-cream/30 focus-visible:border-cream/30"
                }`}
              >
                <span
                  className={`font-sans text-[0.65rem] font-semibold uppercase tracking-[0.24em] transition-colors duration-500 ${
                    on ? "text-gold" : "text-cream/30"
                  }`}
                >
                  {s.n}
                </span>
                <span
                  className={`font-sans text-[clamp(0.95rem,1.5vw,1.2rem)] font-light tracking-[-0.01em] transition-colors duration-500 ${
                    on ? "text-cream" : "text-cream/45"
                  }`}
                >
                  {s.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
