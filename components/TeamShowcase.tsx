"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Tilt3D } from "@/components/Tilt3D";

/**
 * Team Behind Your Brand — the Framer "Team Showcase" interaction model.
 *
 * Structure follows that reference: a row of overlapping cards that fan apart,
 * one card standing forward as the active member, name/role typography scaling
 * with the selection, and a staggered entrance. Everything else is Adversado —
 * navy card grounds, gold rules, Montserrat display, Merriweather italic.
 *
 * Content constraint, deliberately visible in the design: the company deck
 * (p.13, "TEAM BEHIND YOUR BRAND / CURIOUS. HUNGRY. TALENTED.") supplies eight
 * roles and NO names or portraits, and the website content doc leaves the grid
 * as "[Name] [Role]" placeholders. So no person is invented here — the cards
 * carry the role as the headline, which is also the truthful thing to show for
 * a team that is described as senior by default rather than by personality.
 * The portrait plate is a typographic monogram of the role, not a stock face.
 *
 * The Cat is the ninth card, exactly as the content doc specifies ("Final grid
 * cell, styled like a team card").
 */

const MEMBERS = [
  { role: "Strategy Head", initials: "SH" },
  { role: "Creative Head", initials: "CH" },
  { role: "Performance Manager", initials: "PM" },
  { role: "Growth Head", initials: "GH" },
  { role: "Account Lead", initials: "AL" },
  { role: "Project Manager", initials: "PJ" },
  { role: "Social Media Head", initials: "SM" },
  { role: "Post Production Head", initials: "PP" },
] as const;

/** The Cat sits apart — it is the one card with copy of its own. */
const CAT = {
  role: "Chief Curiosity Officer",
  name: "The Cat",
  line: "Sees everything. Says nothing. Judges quietly. The only team member allowed on the table during meetings.",
} as const;

export function TeamShowcase() {
  const [active, setActive] = useState(0);

  return (
    <section
      aria-label="Team behind your brand"
      /* Bone ground: same inversion as the gold spread. */
      data-nav-light
      className="relative bg-bone px-6 py-32 text-navy sm:px-10 sm:py-40 lg:px-16"
    >
      <div className="mx-auto max-w-[1500px]">
        <div className="flex flex-wrap items-baseline justify-between gap-x-12 gap-y-4 border-b border-navy/20 pb-5">
          <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-navy">
            Team behind your brand
          </p>
          <p className="font-sans text-[0.7rem] uppercase tracking-[0.28em] text-navy/45">
            Curious. Hungry. Talented.
          </p>
        </div>

        <h2 className="mt-16 max-w-[18ch] font-sans text-[clamp(2.25rem,6.4vw,5.25rem)] font-light leading-[0.98] tracking-[-0.035em] text-navy">
          The people behind the brands behind the{" "}
          <span className="font-serif italic">brands.</span>
        </h2>

        <p className="mt-14 max-w-[38ch] border-l-2 border-navy/70 pl-6 font-sans text-[clamp(1.05rem,1.7vw,1.4rem)] font-light leading-[1.7] tracking-[-0.01em] text-navy/85 sm:pl-8">
          <span className="font-serif italic">Small by design.</span>{" "}
          <span className="font-serif italic">Senior by default.</span>{" "}
          Everyone at this table has shipped{" "}
          <span className="font-medium text-navy">real work</span> in the{" "}
          <span className="font-medium text-navy">real world</span>:{" "}
          <span className="border-b border-navy/40 text-navy">FMCG</span> shelves,{" "}
          <span className="border-b border-navy/40 text-navy">pharma</span> regulations,{" "}
          <span className="border-b border-navy/40 text-navy">hotel</span> lobbies,{" "}
          <span className="border-b border-navy/40 text-navy">event</span> floors,{" "}
          <span className="border-b border-navy/40 text-navy">ad accounts</span> with actual money in
          them.
        </p>

        {/* The fan. Cards overlap into a single band and separate around the
            active one; on touch the overlap is dropped for a scroll-snap row,
            because a fan you cannot hover is just a pile. */}
        {/* The stagger is driven from this container, not from each card.
            Below `lg` the row is a horizontal scroller, so cards past the
            second sit off-screen sideways and never intersect the viewport —
            per-card `whileInView` left them stuck at opacity 0 forever. */}
        <motion.div
          role="tablist"
          aria-label="Team roles"
          initial="hidden"
          whileInView="shown"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: {},
            shown: { transition: { staggerChildren: 0.06 } },
          }}
          className="mt-20 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-6 lg:gap-0 lg:overflow-visible lg:pb-0"
        >
          {MEMBERS.map((m, i) => {
            const on = i === active;
            return (
              <Tilt3D
                key={m.role}
                className={`shrink-0 ${on ? "z-20" : "z-10"} lg:-ml-5 lg:flex-1 lg:first:ml-0`}
                max={10}
                lift={30}
              >
              <motion.button
                role="tab"
                data-cursor="View"
                aria-selected={on}
                tabIndex={on ? 0 : -1}
                onClick={() => setActive(i)}
                onFocus={() => setActive(i)}
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse") setActive(i);
                }}
                variants={{
                  hidden: { opacity: 0, y: 28 },
                  shown: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
                  },
                }}
                /* min-height, not aspect alone: at eight-across the cards get
                   narrow enough that a three-word role ("Post Production
                   Head") wraps to three lines, and a pure aspect ratio clips
                   it. */
                className={`group relative flex aspect-[3/4] min-h-[19rem] w-[62vw] snap-start flex-col justify-end overflow-hidden border p-5 text-left outline-none transition-[border-color,background-color,transform] duration-500 ease-out sm:w-[38vw] lg:w-full ${
                  on
                    ? "border-gold/60 bg-navy shadow-[0_28px_60px_-24px_rgba(31,53,94,0.65)] lg:-translate-y-3"
                    : "border-navy/15 bg-navy/80 hover:border-navy/40"
                }`}
              >
                {/* Monogram plate — stands in for a portrait without pretending
                    to be one. */}
                <span
                  aria-hidden
                  className={`absolute inset-x-0 top-0 flex h-[58%] items-center justify-center font-sans text-[clamp(2.25rem,4vw,3.5rem)] font-extralight tracking-[-0.04em] transition-colors duration-500 ${
                    on ? "text-gold/70" : "text-cream/15"
                  }`}
                >
                  {m.initials}
                </span>

                <span
                  aria-hidden
                  className={`mb-4 block h-px w-full origin-left transition-all duration-500 ease-out ${
                    on ? "scale-x-100 bg-gold" : "scale-x-[0.25] bg-cream/25"
                  }`}
                />

                <span
                  className={`font-sans text-[clamp(0.95rem,1.25vw,1.15rem)] font-light leading-[1.2] tracking-[-0.01em] transition-colors duration-500 ${
                    on ? "text-cream" : "text-cream/55"
                  }`}
                >
                  {m.role}
                </span>
              </motion.button>
              </Tilt3D>
            );
          })}
        </motion.div>

        {/* The Cat — the one card with its own copy, held back from the fan so
            the discovery still feels separate. */}
        <div className="mt-28 grid gap-10 border-t border-navy/20 pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div
            tabIndex={0}
            className="group outline-none"
          >
            <p className="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-navy/60">
              {CAT.role}
            </p>
            <p className="mt-4 font-sans text-[clamp(1.75rem,3.4vw,2.75rem)] font-light uppercase leading-[1] tracking-[-0.02em] text-navy transition-opacity duration-500 group-hover:opacity-70 group-focus-visible:opacity-70">
              {CAT.name}
            </p>
            <p className="mt-6 max-w-[38ch] font-serif text-[clamp(0.98rem,1.35vw,1.15rem)] font-light italic leading-[1.75] text-navy/60">
              {CAT.line}
            </p>

            {/* Hidden until looked for — the wordmark's own trick. */}
            <span
              aria-hidden
              className="mt-8 block h-[clamp(3.5rem,6vw,5.5rem)] w-[clamp(6.5rem,11vw,10rem)] bg-navy opacity-0 [clip-path:inset(100%_0_0_0)] transition-all duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] [mask-image:url('/images/cat.svg')] [mask-position:left_bottom] [mask-repeat:no-repeat] [mask-size:contain] group-hover:opacity-100 group-hover:[clip-path:inset(0%_0_0_0)] group-focus-visible:opacity-100 group-focus-visible:[clip-path:inset(0%_0_0_0)] motion-reduce:transition-none"
            />
          </div>

          <div className="lg:self-end">
            <p className="max-w-[34ch] font-sans text-[clamp(1rem,1.5vw,1.2rem)] font-light leading-[1.8] text-navy/65">
              Want to be on this page? We hire people who flinch at the word{" "}
              <span className="font-serif italic text-navy">&ldquo;synergy.&rdquo;</span>
            </p>
            <Link
              href="/contact"
              className="group mt-10 inline-flex items-center gap-4 bg-navy px-8 py-4 font-sans text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-bone transition-colors duration-300 hover:bg-charcoal"
            >
              Start a conversation
              <span
                aria-hidden
                className="transition-transform duration-300 ease-out group-hover:translate-x-1.5"
              >
                →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
