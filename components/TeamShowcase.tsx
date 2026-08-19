"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";

/**
 * Team Behind Your Brand — neobrutalist portrait wall.
 *
 * Roles come from the filenames in `public/team`, which is the only source of
 * truth we have for who is on the team: the company deck lists roles with no
 * names or photographs, and the website content doc leaves the grid as
 * "[Name] [Role]" placeholders. So the card headline is the role, and no
 * person's name is invented.
 *
 * Neobrutalist treatment: thick charcoal borders, flat offset shadows with no
 * blur, no rounded corners, fixed per-index tilt so the wall reads as pinned
 * photographs rather than a CSS grid. Portraits sit in duotone at rest and
 * snap to full colour on hover/focus — the colour arriving is the reward, and
 * it doubles as the affordance that the card is interactive.
 *
 * The Cat is the final cell, exactly as the content doc specifies ("Final grid
 * cell, styled like a team card").
 */

type Member = { role: string; file: string; tilt: string; accent: string };

/* `file` is the on-disk name in public/team, URL-encoded at point of use —
   the filenames contain spaces. */
/* Duotone wash, alternating the book's two active colours. It was five
   different tints before — three of them pastels off the brand entirely, and
   `bg-cream` multiplied to nothing, so that one portrait sat in full colour
   while the rest were tinted. Gold/navy alternating gives the grid a rhythm
   and every tile the same weight. */
const MEMBERS: Member[] = [
  { role: "Creative Head", file: "Creative Head.jpeg", tilt: "-2deg", accent: "bg-gold" },
  { role: "Growth Head", file: "Growth Head.jpeg", tilt: "1.5deg", accent: "bg-navy" },
  { role: "Performance Manager", file: "Performance Manager.jpeg", tilt: "-1.2deg", accent: "bg-gold" },
  { role: "Account Lead", file: "Account Lead.jpeg", tilt: "2.1deg", accent: "bg-navy" },
  { role: "Social Media Manager", file: "Social Media Manager.jpeg", tilt: "-1.7deg", accent: "bg-gold" },
  { role: "Post Production Head", file: "Post Production Head.jpeg", tilt: "1.1deg", accent: "bg-navy" },
];

const CAT = {
  role: "Chief Curiosity Officer",
  name: "The Cat",
  line: "Sees everything. Says nothing. Judges quietly. The only team member allowed on the table during meetings.",
} as const;

export function TeamShowcase() {
  return (
    <section
      aria-label="Team behind your brand"
      /* Navy ground, so no nav-ground tag: the chrome's default gold wordmark
         and cream menu are already legible on it. `data-nav-navy` would paint
         the mark navy-on-navy — that flag is for navy type over a light spread. */
      className="relative bg-navy px-6 py-32 text-cream sm:px-10 sm:py-40 lg:px-16"
    >
      <div className="mx-auto max-w-[1500px]">
        <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-5">
          <span className="inline-block -rotate-2 border-[3px] border-charcoal bg-charcoal px-3 py-1.5 font-sans text-[0.7rem] font-black uppercase tracking-[0.28em] text-gold shadow-[5px_5px_0_0_#212121]">
            Team behind your brand
          </span>
          <span className="inline-block rotate-1 border-[3px] border-charcoal bg-gold px-3 py-1.5 font-sans text-[0.7rem] font-black uppercase tracking-[0.24em] text-charcoal shadow-[4px_4px_0_0_#212121]">
            Curious. Hungry. Talented.
          </span>
        </div>

        {/* The hero's own two-part device, reused: light Montserrat in cream,
            then the line that matters in serif italic gold. The repeat is the
            point of the headline, and this is how the landing page already
            marks the turn — a sticker on the second "brands" was a third
            treatment doing the same job louder. */}
        <h2 className="mt-14 font-sans text-[clamp(2.25rem,7vw,5.75rem)] font-light leading-[1.06] tracking-[-0.03em] text-cream">
          The people
          <span className="mt-2 block">
            behind the brands,{" "}
            <span className="whitespace-nowrap font-serif italic tracking-[-0.02em] text-gold">
              behind the brands
            </span>
          </span>
        </h2>

        <p className="mt-12 max-w-[42ch] border-l-[5px] border-gold pl-6 font-sans text-[clamp(1.05rem,1.7vw,1.4rem)] font-bold leading-[1.6] tracking-[-0.01em] text-cream sm:pl-8">
          <span className="text-gold">Small by design.</span>{" "}
          <span className="text-gold">Senior by default.</span> Everyone at this
          table has shipped real work in the real world: FMCG shelves, pharma
          regulations, hotel lobbies, event floors, ad accounts with actual
          money in them.
        </p>

        <motion.ul
          initial="hidden"
          whileInView="shown"
          viewport={{ once: true, amount: 0.15 }}
          variants={{ hidden: {}, shown: { transition: { staggerChildren: 0.07 } } }}
          className="mt-20 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3"
        >
          {MEMBERS.map((m) => (
            <motion.li
              key={m.role}
              variants={{
                hidden: { opacity: 0, y: 24 },
                shown: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
                },
              }}
              className="flex"
            >
              <div
                tabIndex={0}
                style={{ rotate: m.tilt }}
                className="group relative w-full border-[4px] border-charcoal bg-cream shadow-[9px_9px_0_0_#212121] outline-none transition-[transform,box-shadow] duration-200 ease-out hover:-translate-x-1 hover:-translate-y-1.5 hover:shadow-[15px_15px_0_0_#212121] focus-visible:-translate-x-1 focus-visible:-translate-y-1.5 focus-visible:shadow-[15px_15px_0_0_#212121] motion-reduce:transition-none"
              >
                {/* Tape strip, overhanging the top edge — the photo is stuck up,
                    not laid out. */}
                <span
                  aria-hidden
                  className="absolute -top-4 left-1/2 z-10 h-8 w-24 -translate-x-1/2 -rotate-3 border-y-2 border-charcoal/25 bg-cream/60 shadow-[2px_2px_0_0_rgba(33,33,33,0.25)]"
                />

                <div className="relative aspect-[4/5] w-full overflow-hidden border-b-[4px] border-charcoal">
                  <Image
                    src={`/team/${encodeURIComponent(m.file)}`}
                    alt={m.role}
                    fill
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                    /* Duotone at rest, full colour on approach. `grayscale` +
                       a gold wash reads as one flat treatment rather than a
                       photo with a filter bolted on. */
                    className="object-cover grayscale contrast-125 transition-[filter] duration-300 ease-out group-hover:grayscale-0 group-focus-visible:grayscale-0 motion-reduce:transition-none"
                  />
                  <span
                    aria-hidden
                    className={`pointer-events-none absolute inset-0 mix-blend-multiply opacity-45 transition-opacity duration-300 ease-out group-hover:opacity-0 group-focus-visible:opacity-0 ${m.accent}`}
                  />
                </div>

                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <p className="font-sans text-[clamp(0.95rem,1.3vw,1.15rem)] font-black uppercase leading-[1.15] tracking-[-0.01em] text-charcoal">
                    {m.role}
                  </p>
                  <span
                    aria-hidden
                    className="shrink-0 border-[3px] border-charcoal bg-transparent px-2 py-0.5 font-sans text-[0.6rem] font-black uppercase tracking-[0.2em] text-charcoal transition-colors duration-200 group-hover:bg-charcoal group-hover:text-gold group-focus-visible:bg-charcoal group-focus-visible:text-gold"
                  >
                    →
                  </span>
                </div>
              </div>
            </motion.li>
          ))}

          {/* The Cat — final cell, the one with copy of its own. */}
          <motion.li
            variants={{
              hidden: { opacity: 0, y: 24 },
              shown: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
              },
            }}
            className="flex sm:col-span-2 lg:col-span-3"
          >
            <div
              tabIndex={0}
              className="group grid w-full gap-8 border-[4px] border-charcoal bg-charcoal p-7 shadow-[9px_9px_0_0_#e6b325] outline-none sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-10"
            >
              <div>
                <span className="inline-block border-[3px] border-gold bg-gold px-2.5 py-1 font-sans text-[0.62rem] font-black uppercase tracking-[0.26em] text-charcoal">
                  {CAT.role}
                </span>
                <p className="mt-5 font-sans text-[clamp(1.75rem,3.4vw,2.75rem)] font-black uppercase leading-[1] tracking-[-0.02em] text-cream">
                  {CAT.name}
                </p>
                <p className="mt-5 max-w-[40ch] font-sans text-[clamp(0.98rem,1.35vw,1.15rem)] font-bold leading-[1.6] text-cream/70">
                  {CAT.line}
                </p>
              </div>

              {/* Hidden until looked for — the wordmark's own trick. Rendered
                  as a real <img>, not a CSS mask: the source SVG carries its
                  own colors and a always-running SMIL loop, both of which a
                  mask (alpha-only, and hostile to live SVG content) destroys. */}
              <img
                src="/images/cat_team.svg"
                alt=""
                aria-hidden
                className="block h-[clamp(4rem,7vw,6.5rem)] w-[clamp(7rem,13vw,12rem)] justify-self-start object-contain object-bottom opacity-0 [clip-path:inset(100%_0_0_0)] transition-all duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-100 group-hover:[clip-path:inset(0%_0_0_0)] group-focus-visible:opacity-100 group-focus-visible:[clip-path:inset(0%_0_0_0)] motion-reduce:transition-none sm:justify-self-end"
              />
            </div>
          </motion.li>
        </motion.ul>

        <div className="mt-20 flex flex-col gap-8 border-t-[4px] border-cream/25 pt-10 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-[34ch] font-sans text-[clamp(1rem,1.5vw,1.2rem)] font-bold leading-[1.65] text-cream/75">
            Want to be on this page? We hire people who flinch at the word{" "}
            <span className="text-gold">&ldquo;synergy.&rdquo;</span>
          </p>
          <Link
            href="/contact"
            className="group inline-flex shrink-0 items-center gap-4 border-[4px] border-charcoal bg-gold px-8 py-4 font-sans text-[0.72rem] font-black uppercase tracking-[0.24em] text-charcoal shadow-[6px_6px_0_0_#212121] transition-[transform,box-shadow] duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0_0_#212121]"
          >
            Start a conversation
            <span
              aria-hidden
              className="transition-transform duration-200 ease-out group-hover:translate-x-1.5"
            >
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
