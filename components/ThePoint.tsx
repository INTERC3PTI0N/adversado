"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useOutsideClick } from "@/hooks/use-outside-click";

/**
 * The Point of It All — the six beliefs as pinned-up paper, neobrutalist.
 *
 * The conceit: the beliefs are the things stuck to the wall above the desk, so
 * each one is a post-it in a slightly different colour, tacked at a slightly
 * different angle, held by a paperclip or a strip of tape. Nothing is aligned
 * to a perfect grid, because a wall of notes never is — but the rotations are
 * fixed per index rather than random so the layout is stable across renders
 * and doesn't reshuffle on every keystroke in dev.
 *
 * Neobrutalist rules held throughout: hard 3–4px charcoal borders, flat offset
 * shadows with no blur, no rounded corners on the frame, no gradients. Lift on
 * hover is a translate + a longer shadow, i.e. the note peeling off the wall —
 * not a scale or a glow.
 *
 * Interaction is still the Aceternity expandable-card pattern
 * (@aceternity/expandable-card-demo-standard): `layoutId` promotes the tapped
 * note into a centred panel, Escape and outside-click close it, and Lenis is
 * stopped rather than `body { overflow: hidden }` because Lenis drives scroll
 * off its own rAF loop and ignores that entirely.
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

/** Per-note paper stock + pin. Fixed by index, never random — a wall that
 *  reshuffles on re-render reads as a bug, not as charm. */
const NOTES = [
  { paper: "bg-[#f7e15f]", tilt: "-2.2deg", pin: "clip" },
  { paper: "bg-cream", tilt: "1.6deg", pin: "tape" },
  { paper: "bg-[#f7b8c4]", tilt: "-1.1deg", pin: "clip" },
  { paper: "bg-[#9fd8cb]", tilt: "2.4deg", pin: "tape" },
  { paper: "bg-[#f7e15f]", tilt: "-1.8deg", pin: "tape" },
  { paper: "bg-[#b8c9f7]", tilt: "1.2deg", pin: "clip" },
] as const;

/** Bent-wire paperclip. Two nested rounded rects read as the loop-back-on-
 *  itself shape at this size far better than an accurate wire path would. */
function Paperclip() {
  return (
    <svg
      viewBox="0 0 28 46"
      aria-hidden
      className="h-11 w-7 drop-shadow-[2px_2px_0_rgba(33,33,33,0.45)]"
    >
      <rect
        x="5"
        y="3"
        width="18"
        height="40"
        rx="9"
        fill="none"
        stroke="#212121"
        strokeWidth="3"
      />
      <rect
        x="11"
        y="11"
        width="6"
        height="24"
        rx="3"
        fill="none"
        stroke="#212121"
        strokeWidth="3"
      />
    </svg>
  );
}

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
        <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-5">
          <span className="inline-block -rotate-2 border-[3px] border-charcoal bg-charcoal px-3 py-1.5 font-sans text-[0.7rem] font-black uppercase tracking-[0.28em] text-gold shadow-[5px_5px_0_0_#212121]">
            What we believe
          </span>
          <span className="inline-block rotate-1 border-[3px] border-charcoal bg-cream px-3 py-1.5 font-sans text-[0.7rem] font-black uppercase tracking-[0.24em] text-charcoal shadow-[4px_4px_0_0_#212121]">
            Six, non-negotiable
          </span>
        </div>

        <h2 className="mt-14 max-w-[13ch] font-sans text-[clamp(2.75rem,9vw,7.5rem)] font-black uppercase leading-[0.9] tracking-[-0.03em] text-charcoal">
          The{" "}
          <span className="relative inline-block">
            point
            {/* Marker underline, drawn slightly off-true like a real one. */}
            <span
              aria-hidden
              className="absolute inset-x-[-2%] bottom-[0.06em] -z-10 block h-[0.22em] -rotate-1 bg-charcoal/85"
            />
          </span>{" "}
          of it all.
        </h2>

        <p className="mt-8 font-sans text-[0.72rem] font-bold uppercase tracking-[0.24em] text-charcoal/55">
          Pick one up ↓
        </p>

        {/* The wall. Notes sit on a loose grid with per-note rotation; the
            paperclip/tape overhangs the top edge so the paper reads as held
            rather than drawn. */}
        <ul className="mt-14 grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {BELIEFS.map((b, i) => {
            const note = NOTES[i % NOTES.length];
            return (
              <li key={b.n} className="relative flex">
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
                  style={{ rotate: note.tilt }}
                  className={`group relative flex min-h-[15rem] w-full flex-col items-start gap-6 border-[4px] border-charcoal px-6 pb-6 pt-9 text-left outline-none shadow-[8px_8px_0_0_#212121] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-x-1 hover:-translate-y-1.5 hover:shadow-[14px_14px_0_0_#212121] focus-visible:-translate-x-1 focus-visible:-translate-y-1.5 focus-visible:shadow-[14px_14px_0_0_#212121] motion-reduce:transition-none ${note.paper}`}
                >
                  {/* Fastener, overhanging the top edge. */}
                  {note.pin === "clip" ? (
                    <span
                      aria-hidden
                      className="absolute -top-5 right-6 rotate-[8deg] transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:rotate-[2deg]"
                    >
                      <Paperclip />
                    </span>
                  ) : (
                    <span
                      aria-hidden
                      className="absolute -top-4 left-1/2 h-8 w-24 -translate-x-1/2 -rotate-3 border-y-2 border-charcoal/25 bg-cream/55 shadow-[2px_2px_0_0_rgba(33,33,33,0.25)] backdrop-saturate-50"
                    />
                  )}

                  <motion.span
                    layoutId={`n-${b.n}-${id}`}
                    className="border-[3px] border-charcoal bg-charcoal px-2 py-0.5 font-sans text-[0.65rem] font-black uppercase tracking-[0.28em] text-gold"
                  >
                    {b.n}
                  </motion.span>

                  <motion.span
                    layoutId={`title-${b.n}-${id}`}
                    className="max-w-[15ch] font-sans text-[clamp(1.35rem,2.4vw,1.95rem)] font-black uppercase leading-[1.05] tracking-[-0.02em] text-charcoal"
                  >
                    {b.title}
                  </motion.span>

                  <span
                    aria-hidden
                    className="mt-auto inline-flex items-center gap-2 border-[3px] border-charcoal bg-transparent px-3 py-1 font-sans text-[0.62rem] font-black uppercase tracking-[0.24em] text-charcoal transition-colors duration-200 group-hover:bg-charcoal group-hover:text-gold group-focus-visible:bg-charcoal group-focus-visible:text-gold"
                  >
                    Read
                    <span className="transition-transform duration-200 ease-out group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                </motion.button>
              </li>
            );
          })}
        </ul>
      </div>

      <AnimatePresence>
        {active ? (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-charcoal/80"
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {active ? (
          <div className="fixed inset-0 z-[100] grid place-items-center p-5 sm:p-8">
            {/* The note, pulled off the wall and flattened out to read. */}
            <motion.div
              layoutId={`card-${active.n}-${id}`}
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label={active.title}
              className="relative w-full max-w-[46rem] border-[5px] border-charcoal bg-cream px-7 py-12 shadow-[16px_16px_0_0_#212121] sm:px-14 sm:py-16"
            >
              <span
                aria-hidden
                className="absolute -top-6 left-10 rotate-[6deg]"
              >
                <Paperclip />
              </span>

              <div className="flex items-start justify-between gap-8">
                <motion.span
                  layoutId={`n-${active.n}-${id}`}
                  className="border-[3px] border-charcoal bg-charcoal px-2 py-0.5 font-sans text-[0.65rem] font-black uppercase tracking-[0.28em] text-gold"
                >
                  {active.n}
                </motion.span>

                <button
                  ref={closeRef}
                  type="button"
                  onClick={() => setActive(null)}
                  aria-label="Close"
                  className="-mt-1 -mr-1 shrink-0 border-[3px] border-charcoal bg-cream px-3 py-1.5 font-sans text-[0.62rem] font-black uppercase tracking-[0.24em] text-charcoal shadow-[4px_4px_0_0_#212121] outline-none transition-[transform,box-shadow] duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#212121] focus-visible:-translate-x-0.5 focus-visible:-translate-y-0.5"
                >
                  Close
                </button>
              </div>

              <motion.h3
                layoutId={`title-${active.n}-${id}`}
                className="mt-10 max-w-[15ch] font-sans text-[clamp(1.85rem,4.6vw,3.25rem)] font-black uppercase leading-[0.98] tracking-[-0.02em] text-charcoal"
              >
                {active.title}
              </motion.h3>

              {/* The approved second line for each belief — the payload of the
                  expand, nothing added. */}
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.16 } }}
                exit={{ opacity: 0, transition: { duration: 0.05 } }}
                className="mt-8 max-w-[32ch] border-l-[5px] border-charcoal bg-[#f7e15f] px-5 py-4 font-sans text-[clamp(1.05rem,1.8vw,1.4rem)] font-bold leading-[1.5] text-charcoal"
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
