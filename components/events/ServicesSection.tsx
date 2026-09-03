"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { EV } from "./palette";

type Service = {
  n: string;
  name: string;
  /** The sub-types, set as one serif line — the reference's second column. */
  types: string;
  /** The promise, then the positioning line, both from the copy deck. */
  promise: string;
  claim: string;
  ground: string;
  ink: string;
  muted: string;
  accent: string;
  image: string;
  alt: string;
};

/* Grounds alternate through the book's light tones so each band separates from
   the last without introducing a colour the brand doesn't own. Stock imagery
   throughout — every frame is a placeholder for the studio's own coverage. */
const LIGHT = { ink: EV.charcoal, muted: "rgba(33,33,33,0.7)", accent: EV.navy };
const DARK = { ink: EV.cream, muted: "rgba(249,247,242,0.7)", accent: EV.gold };

const SERVICES: Service[] = [
  {
    n: "01",
    name: "Corporate Events",
    types: "Annual meetings, Dealer meets, Awards, High-value celebrations",
    promise: "Business moments, staged with intent.",
    claim: "One of the best corporate event companies in India.",
    ground: EV.bone,
    ...LIGHT,
    image:
      "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=2069&auto=format&fit=crop",
    alt: "Corporate floor mid-event",
  },
  {
    n: "02",
    name: "Conferences",
    types: "Conference design, Speaker flow, LED content, Technical production",
    promise: "Conversations, fully produced.",
    claim: "A conference management company built for India's toughest agendas.",
    ground: EV.cream,
    ...LIGHT,
    image:
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=2000&auto=format&fit=crop",
    alt: "Conference hall with a speaker on stage",
  },
  {
    n: "03",
    name: "Entertainment",
    types:
      "Concerts and cultural shows, Celebrity acts, Show direction, Backstage operations",
    promise: "Live energy, precisely managed.",
    claim: "An entertainment production company trusted on India's biggest stages.",
    ground: EV.navy,
    ...DARK,
    image:
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=2070&auto=format&fit=crop",
    alt: "Concert crowd under stage lighting",
  },
  {
    n: "04",
    name: "Gaming / Esports",
    types:
      "Tournament experience, LAN zones, Sponsor visibility, Broadcast-ready production",
    promise: "Built for the arena and the stream.",
    claim:
      "An esports and gaming event company built for India's fastest-growing audience.",
    ground: EV.bone,
    ...LIGHT,
    image:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop",
    alt: "Esports arena during a tournament",
  },
  {
    n: "05",
    name: "Brand Events",
    types:
      "Product launches, Brand activations, Exhibitions, Retail and mall activations",
    promise: "Launches that perform like campaigns.",
    claim: "A brand activation and experiential marketing agency in India.",
    ground: EV.gold,
    ...LIGHT,
    image:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop",
    alt: "Product launch activation space",
  },
  {
    n: "06",
    name: "Film & PR",
    types:
      "Launch films, Aftermovies, Livestreaming, Post-production, Campaign planning, Media relations, Live event media desk",
    promise: "The story doesn't end when the lights go down.",
    claim: "Among the best film PR agencies in Kochi.",
    ground: EV.navy,
    ...DARK,
    image:
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=2069&auto=format&fit=crop",
    alt: "Camera operator filming an event",
  },
];

function Card({ s, index }: { s: Service; index: number }) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  /* 0 while the card's top is still a viewport away, 1 once it has pinned.
     Sticky doesn't break this: a pinned element's rect top is 0, which is
     exactly the end of the range. */
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "start start"],
  });

  // Odd cards arrive from the right, even from the left.
  const dir = index % 2 === 0 ? 1 : -1;
  const x = useTransform(scrollYProgress, [0, 1], [dir * 180, 0]);
  const rotate = useTransform(scrollYProgress, [0, 1], [dir * 7, 0]);

  return (
    /* Sticky and one viewport tall, with a stacking z-index, so each card pins
       while the next rides up over it. The section itself is transparent — the
       opaque panel is the card inside, which is what lets the deck show at the
       edges as it builds. */
    <section
      ref={ref}
      aria-label={s.name}
      /* No nav-ground flag: the section is transparent, so what actually sits
         under the header here is the deck's dark ground, not the card. */
      className="sticky top-0 flex h-screen items-center px-6 sm:px-10 lg:px-16"
      style={{ zIndex: index + 1 }}
    >
      <motion.div
        style={reduced ? { background: s.ground } : { x, rotate, background: s.ground }}
        className="mx-auto w-full max-w-[1500px] origin-center border-[4px] border-charcoal px-6 py-10 shadow-[14px_14px_0_0_#212121] sm:px-10 sm:py-12 lg:px-14"
      >
        <h3
          className="font-sans text-[clamp(2rem,5vw,4rem)] font-light leading-[1] tracking-[-0.03em]"
          style={{ color: s.ink }}
        >
          {s.name}
        </h3>

        <div className="mt-8 grid gap-x-14 gap-y-8 lg:mt-10 lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,0.8fr)] lg:items-start">
          <p
            className="font-sans text-[clamp(1.75rem,3.4vw,2.85rem)] font-black leading-none tracking-[-0.04em]"
            style={{ color: s.ink }}
          >
            {s.n}
          </p>

          <div>
            <p
              className="max-w-[26ch] font-serif text-[clamp(1.05rem,1.8vw,1.5rem)] font-light leading-[1.35] tracking-[-0.01em]"
              style={{ color: s.ink }}
            >
              {s.types}
            </p>
            <p
              className="mt-6 max-w-[42ch] font-sans text-[clamp(0.9rem,1.2vw,1.02rem)] font-medium leading-[1.7]"
              style={{ color: s.muted }}
            >
              {s.promise}
            </p>
            <p
              className="mt-3 max-w-[42ch] font-serif text-[clamp(0.85rem,1.1vw,0.95rem)] font-light italic leading-[1.6]"
              style={{ color: s.accent }}
            >
              {s.claim}
            </p>
          </div>

          <div className="relative hidden aspect-[5/4] max-h-[42vh] overflow-hidden lg:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={s.image}
              alt={s.alt}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/**
 * 03 — Services, as a stack of sticky cards.
 *
 * The slider it replaced showed one service at a time and hid the other five
 * behind a click, which for the section listing what the company sells is the
 * wrong trade: five of six lines of work were invisible to a reader and to a
 * crawler. Every card is in the document now; scroll just decides which one is
 * on top.
 *
 * Each card pins for a viewport while the next rides up over it. Worth noting
 * that the named reference does not actually do this — its cards are plain
 * stacked colour bands with no pinning — so this is the described behaviour
 * rather than a copy of that implementation.
 */
export function ServicesSection() {
  return (
    /* The deck sits on one dark ground; horizontal clip because the cards
       translate sideways on the way in. */
    <div className="relative z-40 overflow-x-clip" style={{ background: EV.ink }}>
      <section
        aria-label="What we do"
        data-nav-light
        className="px-6 pb-6 pt-28 sm:px-10 sm:pt-36 lg:px-16"
        style={{ background: EV.bone }}
      >
        <div className="mx-auto max-w-[1500px]">
          <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-charcoal/45">
            03 — Services
          </p>
          <h2 className="mt-8 max-w-[14ch] font-sans text-[clamp(2.5rem,8vw,6rem)] font-light leading-[0.98] tracking-[-0.03em] text-charcoal">
            What{" "}
            <span className="font-serif italic" style={{ color: EV.navy }}>
              we do.
            </span>
          </h2>
        </div>
      </section>

      {SERVICES.map((s, i) => (
        <Card key={s.n} s={s} index={i} />
      ))}
    </div>
  );
}
