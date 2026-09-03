"use client";

import { motion } from "motion/react";
import { EV } from "./palette";

/* Stock for now — swap for the studio's own workshop and floor shots. */
const SHOTS = [
  {
    src: "https://images.unsplash.com/photo-1531058020387-3be344556be6?q=80&w=2070&auto=format&fit=crop",
    alt: "Crew rigging a stage before doors",
  },
  {
    src: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop",
    alt: "Conference floor mid-session",
  },
];

const PILLARS = [
  { n: "01", label: "Fabrication", line: "We build the stages ourselves, in our own workshop." },
  { n: "02", label: "Film", line: "Cameras, livestream and post sit on the same floor." },
  { n: "03", label: "PR", line: "The press desk runs from the room, not from an agency brief." },
];

/**
 * 02 — Why Adversado Events. Bone spread between the navy about grid and the
 * services slider, so the run of sections breathes rather than stacking three
 * dark stages back to back.
 */
export function WhySection() {
  return (
    <section
      aria-label="Why Adversado Events"
      data-nav-light
      className="relative z-40 px-6 py-28 sm:px-10 sm:py-36 lg:px-16"
      style={{ background: EV.bone }}
    >
      <div className="mx-auto max-w-[1500px]">
        <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-charcoal/45">
          02 — Why Adversado Events
        </p>

        <div className="mt-12 grid gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-end">
          <h2 className="max-w-[16ch] font-sans text-[clamp(2rem,5vw,4rem)] font-light leading-[1.02] tracking-[-0.03em] text-charcoal">
            Built on experience,{" "}
            <span className="font-serif italic text-navy">structured for scale.</span>
          </h2>

          <p className="max-w-[46ch] border-l border-charcoal/25 pl-6 font-serif text-[clamp(1rem,1.5vw,1.2rem)] font-light leading-[1.9] text-charcoal/75 sm:pl-8">
            Our crew has run corporate floors, conferences, concerts and gaming
            arenas for fifteen years, and we still build the stages ourselves.
            Fabrication, film and PR are in-house, which makes us one of the few
            event production companies in Kerala that owns the whole job.
          </p>
        </div>

        <ul className="mt-20 grid gap-x-10 gap-y-10 sm:grid-cols-3">
          {PILLARS.map((p, i) => (
            <motion.li
              key={p.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-12%" }}
              transition={{ duration: 0.55, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="border-t-[3px] border-charcoal pt-6"
            >
              <span className="font-sans text-[0.68rem] font-black tracking-[0.24em] text-gold">
                {p.n}
              </span>
              <p className="mt-4 font-sans text-[clamp(1.1rem,1.8vw,1.5rem)] font-black uppercase leading-[1.1] tracking-[-0.01em] text-charcoal">
                {p.label}
              </p>
              <p className="mt-3 max-w-[30ch] font-sans text-[0.95rem] font-medium leading-[1.7] text-charcoal/65">
                {p.line}
              </p>
            </motion.li>
          ))}
        </ul>

        <div className="mt-20 grid gap-6 sm:grid-cols-2">
          {SHOTS.map((s, i) => (
            <motion.div
              key={s.src}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="relative aspect-[16/10] overflow-hidden border-[4px] border-charcoal shadow-[10px_10px_0_0_#212121]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.src}
                alt={s.alt}
                className="h-full w-full object-cover grayscale-[35%] transition-[filter] duration-500 hover:grayscale-0"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
