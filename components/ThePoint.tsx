"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useOutsideClick } from "@/hooks/use-outside-click";

/**
 * The Point of It All — the six beliefs as expandable editorial cards, on a
 * full-bleed gold spread.
 *
 * The ground shift is the point. Every other section of this site sits on the
 * same dark starfield, which is why the page read as one long scroll rather
 * than a sequence of spreads. This section cuts to solid brand gold with
 * charcoal type — the hardest contrast the palette can make — so the beliefs
 * land as the confrontational centre of the page. The book's register is
 * "bold, takes positions, doesn't hedge"; a whispered dark section could not
 * carry that.
 *
 * Interaction is the Aceternity expandable-card pattern
 * (@aceternity/expandable-card-demo-standard): a `layoutId` shared-element
 * transition promotes the tapped card into a centred panel, Escape and
 * outside-click close it. Two departures from the demo:
 *
 * 1. The demo locks the page with `document.body.style.overflow = "hidden"`.
 *    Lenis drives scroll here off its own rAF loop and ignores that entirely,
 *    so Lenis is stopped and started instead.
 * 2. The demo's cards are image-led. There is no photography for the beliefs
 *    and none may be invented, so the card is type only.
 *
 * All copy is verbatim from the website content doc (SECTION: WHAT WE BELIEVE).
 */

const BELIEFS = [
  { n: "01", title: "Strategy is not a phase.", line: "It comes before everything, or it isn't strategy." },
  { n: "02", title: "Work that doesn't perform isn't creative.", line: "It's decoration. Expensive decoration, usually." },
  { n: "03", title: "A brand is not a logo.", line: "It's every touchpoint, connected and considered." },
  { n: "04", title: "Consistency is competitive advantage.", line: "Brands are remembered through repetition, not reinvention." },
  { n: "05", title: "Honest conversations win.", line: "Transparency, constructive disagreement, mutual respect." },
  { n: "06", title: "Premium is a standard, not a price.", line: "A logo gets the same rigour as a national campaign." },
] as const;

type Belief = (typeof BELIEFS)[number];

export function ThePoint() {
  const [active, setActive] = useState<Belief | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const originRef = useRef<HTMLButtonElement | null>(null);
  const id = useId();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };

    if (active) {
      window.__lenis?.stop();
      closeRef.current?.focus();
    } else {
      window.__lenis?.start();
      originRef.current?.focus();
      originRef.current = null;
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  useEffect(() => () => window.__lenis?.start(), []);

  useOutsideClick(panelRef, () => setActive(null));

  return (
    <section
      aria-label="The point of it all"
      /* Gold ground: chrome inverts to the navy wordmark and navy menu. */
      data-nav-light
      className="relative bg-gold px-6 py-32 text-charcoal sm:px-10 sm:py-40 lg:px-16"
    >
      <div className="mx-auto max-w-[1500px]">
        <div className="flex flex-wrap items-baseline justify-between gap-x-12 gap-y-4 border-b border-charcoal/25 pb-5">
          <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-charcoal">
            What we believe
          </p>
          <p className="font-sans text-[0.7rem] uppercase tracking-[0.28em] text-charcoal/50">
            Six, non-negotiable
          </p>
        </div>

        <h2 className="mt-16 max-w-[13ch] font-sans text-[clamp(2.75rem,9vw,7.5rem)] font-light leading-[0.94] tracking-[-0.04em] text-charcoal">
          The{" "}
          <span className="font-serif italic">point</span> of it all.
        </h2>

        {/* Cards ruled in charcoal on the gold ground — no tiles, no shadows,
            no rounded corners. The grid is the composition. */}
        <ul className="mt-24 grid border-t border-charcoal/25 sm:grid-cols-2 lg:grid-cols-3">
          {BELIEFS.map((b) => (
            <li key={b.n} className="relative">
              <motion.button
                data-cursor="Read"
                layoutId={`card-${b.n}-${id}`}
                type="button"
                onClick={(e) => {
                  originRef.current = e.currentTarget as HTMLButtonElement;
                  setActive(b);
                }}
                aria-expanded={active?.n === b.n}
                aria-label={`${b.title} — expand`}
                className="group flex h-full w-full flex-col items-start gap-12 border-b border-charcoal/25 px-0 pb-14 pt-9 text-left outline-none transition-colors duration-500 hover:bg-charcoal/[0.06] focus-visible:bg-charcoal/[0.06] sm:px-7"
              >
                <motion.span
                  layoutId={`n-${b.n}-${id}`}
                  className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.3em] text-charcoal/55"
                >
                  {b.n}
                </motion.span>

                <motion.span
                  layoutId={`title-${b.n}-${id}`}
                  className="max-w-[15ch] font-sans text-[clamp(1.45rem,2.6vw,2.15rem)] font-medium leading-[1.1] tracking-[-0.025em] text-charcoal"
                >
                  {b.title}
                </motion.span>

                <span
                  aria-hidden
                  className="mt-auto inline-flex items-center gap-3 font-sans text-[0.62rem] font-bold uppercase tracking-[0.26em] text-charcoal/45 transition-colors duration-500 group-hover:text-charcoal group-focus-visible:text-charcoal"
                >
                  Read
                  <span className="transition-transform duration-500 ease-out group-hover:translate-x-1.5">
                    →
                  </span>
                </span>
              </motion.button>
            </li>
          ))}
        </ul>
      </div>

      <AnimatePresence>
        {active ? (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-charcoal/70 backdrop-blur-[3px]"
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {active ? (
          <div className="fixed inset-0 z-[100] grid place-items-center p-5 sm:p-8">
            {/* Panel inverts back to charcoal — the belief steps off the gold
                page and onto its own ground when you open it. */}
            <motion.div
              layoutId={`card-${active.n}-${id}`}
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label={active.title}
              className="relative w-full max-w-[48rem] border-t-2 border-gold bg-charcoal px-7 py-14 shadow-[0_50px_140px_-30px_rgba(0,0,0,0.9)] sm:px-16 sm:py-20"
            >
              <div className="flex items-start justify-between gap-8">
                <motion.span
                  layoutId={`n-${active.n}-${id}`}
                  className="font-sans text-[0.65rem] font-bold uppercase tracking-[0.3em] text-gold"
                >
                  {active.n}
                </motion.span>

                <button
                  ref={closeRef}
                  type="button"
                  onClick={() => setActive(null)}
                  aria-label="Close"
                  className="-mt-3 -mr-3 shrink-0 p-3 font-sans text-[0.62rem] font-bold uppercase tracking-[0.26em] text-cream/50 outline-none transition-colors duration-300 hover:text-gold focus-visible:text-gold"
                >
                  Close
                </button>
              </div>

              <motion.h3
                layoutId={`title-${active.n}-${id}`}
                className="mt-12 max-w-[15ch] font-sans text-[clamp(2rem,5vw,3.75rem)] font-light leading-[1.02] tracking-[-0.035em] text-cream"
              >
                {active.title}
              </motion.h3>

              {/* The approved second line for each belief — the payload of the
                  expand, nothing added. */}
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.16 } }}
                exit={{ opacity: 0, transition: { duration: 0.05 } }}
                className="mt-10 max-w-[32ch] border-l-2 border-gold pl-7 font-serif text-[clamp(1.15rem,2vw,1.6rem)] font-light italic leading-[1.55] text-cream/85"
              >
                {active.line}
              </motion.p>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
