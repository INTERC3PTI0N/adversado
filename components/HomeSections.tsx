"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useSectionReveal } from "@/components/useSectionReveal";
import { DotField } from "@/components/DotField";
import { RepelText, useCursorVars, useMagnetic, useTilt } from "@/components/Interactions";
import { ContactDialog } from "@/components/ContactDialog";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Everything below the hero. Copy is verbatim from the website content doc
 * (Adversado_Website_final_SEO); palette and type follow the brand book.
 *
 * Every section carries its own interaction, chosen to suit what the section
 * is saying rather than repeating one effect seven times:
 *   Belief       — letters repelled by the cursor (inverted gravity field)
 *   Introduction — WebGL dot matrix that scatters from the pointer
 *   Verticals    — 3D card tilt with a light source tracking the cursor
 *   Refusals     — hover strikes the line through and swells it
 *   Six Ds       — hovering one step dims the rest
 *   Invitation   — magnetic CTA that leans toward the pointer
 *   Footer       — marquee that slows when you reach into it
 */

const VERTICALS = [
  {
    name: "Brand Foundation",
    tagline: "Build what you stand on.",
    quip: "Because “vibes” is not a positioning.",
  },
  {
    name: "Brand Marketing",
    tagline: "Say it so people listen.",
    quip: "Talking is not the same as being heard.",
  },
  {
    name: "Brand Reach",
    tagline: "Make sure the right people find you.",
    quip: "Van Gogh sold one painting in his lifetime. Don’t be Van Gogh.",
  },
  {
    name: "Brand Experience",
    tagline: "Make people feel it.",
    quip: "Nobody ever fell in love with a PDF.",
  },
];

const REFUSALS = [
  "We don’t execute without strategy.",
  "We don’t say yes to briefs we don’t believe in.",
  "We don’t compete on price.",
];

const SIX_DS = [
  { d: "Discover", line: "We learn the business before we touch the brand." },
  { d: "Debate", line: "The insight gets argued before it gets approved. Conviction, not consensus." },
  { d: "Define", line: "One position that makes every future decision easier." },
  { d: "Design", line: "Identity, communication and experience as one connected system." },
  { d: "Deliver", line: "Consistency measured as strictly as quality." },
  { d: "Develop", line: "Measure, refine, repeat. A brand is a living thing." },
];

/* ── The Belief ─────────────────────────────────────────────────────────── */

function Belief() {
  const ref = useSectionReveal<HTMLElement>();
  const glowRef = useCursorVars<HTMLDivElement>();
  const ruleRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(ruleRef.current, {
          scaleX: 0,
          transformOrigin: "left center",
          ease: "none",
          scrollTrigger: { trigger: ruleRef.current, start: "top 90%", end: "top 45%", scrub: true },
        });
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <section ref={ref} className="relative overflow-hidden bg-charcoal px-6 py-28 sm:py-40">
      <div
        ref={glowRef}
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(520px circle at var(--mx, 50%) var(--my, 30%), rgba(230,179,37,0.07), transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-4xl">
        <p data-reveal className="mb-8 text-xs uppercase tracking-[0.35em] text-gold">
          The Belief
        </p>
        <h2
          data-reveal
          className="font-serif text-[clamp(2rem,5.5vw,3.75rem)] leading-[1.1] text-cream"
        >
          <RepelText text="Brands aren’t built in launches." />
        </h2>
        <p
          data-reveal
          className="mt-8 max-w-3xl text-[clamp(1.05rem,2vw,1.5rem)] leading-relaxed text-cream/75"
        >
          They’re built in the unglamorous act of being unmistakably yourself, everywhere,
          every time, for years.
        </p>
        <p data-reveal className="mt-8 max-w-2xl leading-relaxed text-cream/55">
          The campaign ends. The event gets packed down. The post scrolls away. What stays
          is whatever people remember. So that’s what we build for. The memory, not the
          applause.
        </p>

        <span ref={ruleRef} className="mt-16 block h-px w-full bg-gold/60" />
        <p
          data-reveal
          className="mt-8 font-serif text-[clamp(1.5rem,4vw,2.75rem)] leading-tight text-gold"
        >
          <RepelText text="Attention is rented. Memory is owned." radius={110} strength={16} />
        </p>
      </div>
    </section>
  );
}

/* ── The Introduction ───────────────────────────────────────────────────── */

function Introduction() {
  const ref = useSectionReveal<HTMLElement>();

  return (
    <section
      ref={ref}
      data-nav-light
      className="relative overflow-hidden bg-bone px-6 py-28 text-charcoal sm:py-40"
    >
      <DotField className="absolute inset-0" />

      <div className="relative mx-auto max-w-5xl">
        <p data-reveal className="mb-8 text-xs uppercase tracking-[0.35em] text-navy/60">
          The Introduction
        </p>
        <h2
          data-reveal
          className="max-w-3xl text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.08] tracking-tight text-navy"
        >
          One team. The whole picture.
        </h2>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <p data-reveal className="text-[1.05rem] leading-relaxed text-charcoal/80">
            Adversado brings branding, advertising, marketing, events and performance under
            one roof. It sounds like a service list, but it’s actually a philosophy. Your
            brand should be the same brand everywhere it shows up.
          </p>
          <p data-reveal className="text-[1.05rem] leading-relaxed text-charcoal/80">
            The voice in the strategy room. The ad. The event. The feed. Same voice. Same
            standard. Same slightly obsessive attention to detail.
          </p>
        </div>
        <p
          data-reveal
          className="mt-14 font-serif text-[clamp(1.35rem,3vw,2.25rem)] italic text-navy"
        >
          The Brand Behind The Brands.
        </p>
      </div>
    </section>
  );
}

/* ── The Four Verticals ─────────────────────────────────────────────────── */

function VerticalCard({ v, i }: { v: (typeof VERTICALS)[number]; i: number }) {
  const tiltRef = useTilt<HTMLLIElement>(6);

  return (
    <li
      ref={tiltRef}
      data-reveal
      className="group relative overflow-hidden border border-cream/12 bg-navy p-8 sm:p-10"
    >
      {/* Light source rides the same pointer position the tilt is reading. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), rgba(230,179,37,0.16), transparent 65%)",
        }}
      />
      <div className="relative">
        <span className="font-serif text-sm text-gold/70">
          {String(i + 1).padStart(2, "0")}
        </span>
        <h3 className="mt-5 text-lg font-bold uppercase tracking-[0.14em] text-gold">
          {v.name}
        </h3>
        <p className="mt-4 text-[clamp(1.15rem,2.2vw,1.6rem)] leading-snug text-cream">
          {v.tagline}
        </p>
        <p className="mt-3 font-serif text-sm italic leading-relaxed text-cream/50">
          {v.quip}
        </p>
        <span className="mt-8 block h-px w-full origin-left scale-x-0 bg-gold transition-transform duration-500 group-hover:scale-x-100" />
      </div>
    </li>
  );
}

function Verticals() {
  const ref = useSectionReveal<HTMLElement>({ stagger: 0.1 });

  return (
    <section ref={ref} className="bg-navy px-6 py-28 sm:py-40">
      <div className="mx-auto max-w-6xl">
        <p data-reveal className="mb-8 text-xs uppercase tracking-[0.35em] text-gold">
          The Four Verticals
        </p>
        <h2
          data-reveal
          className="text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.08] tracking-tight text-cream"
        >
          Four verticals. One journey.
        </h2>

        <ul className="mt-16 grid gap-5 sm:grid-cols-2">
          {VERTICALS.map((v, i) => (
            <VerticalCard key={v.name} v={v} i={i} />
          ))}
        </ul>

        <div data-reveal className="mt-14">
          <Link
            href="/services"
            prefetch={false}
            className="group inline-flex items-center gap-3 text-sm uppercase tracking-[0.2em] text-gold"
          >
            Explore the full journey
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── What We Don’t Do ───────────────────────────────────────────────────── */

function Refusals() {
  const ref = useRef<HTMLElement>(null);
  const linesRef = useRef<HTMLUListElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const lines = gsap.utils.toArray<HTMLElement>("li", linesRef.current);
        // Clip-path wipe rather than a fade: the refusals are meant to land
        // like statements being struck onto the page, not drift in.
        gsap.from(lines, {
          clipPath: "inset(0 100% 0 0)",
          duration: 0.8,
          ease: "power4.inOut",
          stagger: 0.15,
          scrollTrigger: { trigger: ref.current, start: "top 70%", once: true },
        });
        gsap.from("[data-reveal]", {
          opacity: 0,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.1,
          scrollTrigger: { trigger: ref.current, start: "top 70%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <section ref={ref} data-nav-light className="bg-gold px-6 py-28 text-charcoal sm:py-40">
      <div className="mx-auto max-w-5xl">
        <p data-reveal className="mb-10 text-xs uppercase tracking-[0.35em] text-charcoal/60">
          What We Don’t Do
        </p>
        <ul ref={linesRef} className="space-y-6">
          {REFUSALS.map((line) => (
            <li key={line} className="group w-fit max-w-full cursor-default">
              {/* Sized to hold the longest refusal on one line from `sm` up.
                  Below that it's allowed to wrap, and the strike still lands
                  correctly because it's painted per line fragment rather than
                  as one bar across the block. */}
              <span className="inline-block origin-left transition-transform duration-500 group-hover:scale-[1.02]">
                <span className="strike-hover text-[clamp(0.95rem,2.4vw,2.2rem)] font-bold leading-[1.25] tracking-tight sm:whitespace-nowrap">
                  {line}
                </span>
              </span>
            </li>
          ))}
        </ul>
        <p data-reveal className="mt-10 font-serif text-sm italic text-charcoal/60">
          Saves everyone time, honestly.
        </p>
      </div>
    </section>
  );
}

/* ── How We Work ────────────────────────────────────────────────────────── */

function SixDs() {
  const ref = useSectionReveal<HTMLElement>({ stagger: 0.08 });
  const trackRef = useRef<HTMLSpanElement>(null);
  const listRef = useRef<HTMLOListElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Gold rail draws downward as the list scrolls past — a literal read
        // of "it's a loop, not a line" from the book's process page.
        gsap.from(trackRef.current, {
          scaleY: 0,
          transformOrigin: "top center",
          ease: "none",
          scrollTrigger: {
            trigger: listRef.current,
            start: "top 70%",
            end: "bottom 80%",
            scrub: 0.5,
          },
        });
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <section ref={ref} className="bg-charcoal px-6 py-28 sm:py-40">
      <div className="mx-auto max-w-4xl">
        <p data-reveal className="mb-8 text-xs uppercase tracking-[0.35em] text-gold">
          How We Work
        </p>
        <h2
          data-reveal
          className="text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.08] tracking-tight text-cream"
        >
          Six Ds. No filler.
        </h2>

        <div className="relative mt-16 pl-8 sm:pl-12">
          <span className="absolute left-0 top-0 h-full w-px bg-cream/12" aria-hidden />
          <span
            ref={trackRef}
            className="absolute left-0 top-0 h-full w-px bg-gold"
            aria-hidden
          />
          <ol ref={listRef} className="focus-list space-y-10">
            {SIX_DS.map(({ d, line }) => (
              // The scroll reveal animates the inner wrapper, not the <li>.
              // `.focus-list` puts a CSS transition on the li's own opacity
              // for the hover dimming, and GSAP writing inline opacity to
              // that same element every frame leaves the two fighting — the
              // tween stalls and the item never becomes visible at all.
              <li key={d} className="group relative cursor-default">
                <div data-reveal>
                  <span
                    className="absolute -left-8 top-2.5 h-1.5 w-1.5 rounded-full bg-gold transition-transform duration-500 group-hover:scale-[2.2] sm:-left-12"
                    aria-hidden
                  />
                  <h3 className="text-lg font-bold uppercase tracking-[0.16em] text-gold">{d}</h3>
                  <p className="mt-2 max-w-2xl leading-relaxed text-cream/70">{line}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <p data-reveal className="mt-14 font-serif text-sm italic text-cream/45">
          Every engagement starts with an audit. No exceptions. Even the ones we like.
        </p>
      </div>
    </section>
  );
}

/* ── The Invitation ─────────────────────────────────────────────────────── */

function Invitation() {
  const ref = useSectionReveal<HTMLElement>();
  const glowRef = useCursorVars<HTMLDivElement>();
  const magnetRef = useMagnetic<HTMLButtonElement>({ strength: 0.4, radius: 110 });
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <section ref={ref} className="relative overflow-hidden bg-navy px-6 py-28 sm:py-40">
      <div
        ref={glowRef}
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(560px circle at var(--mx, 50%) var(--my, 50%), rgba(230,179,37,0.10), transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-4xl text-center">
        <p data-reveal className="mb-8 text-xs uppercase tracking-[0.35em] text-gold">
          The Invitation
        </p>
        <h2
          data-reveal
          className="font-serif text-[clamp(2rem,5.5vw,3.75rem)] leading-[1.1] text-cream"
        >
          We’re not for everyone. That’s deliberate.
        </h2>
        <p
          data-reveal
          className="mx-auto mt-10 max-w-2xl text-[1.05rem] leading-relaxed text-cream/70"
        >
          We do our best work at turning points — launching, relaunching, repositioning,
          expanding. Brands ready to treat branding as an investment, take one partner over
          ten vendors, and hear the honest answer even when a comfortable one is available.
          If reading that felt like relief, we should talk.
        </p>
        <div data-reveal className="mt-12">
          <button
            ref={magnetRef}
            type="button"
            onClick={() => setContactOpen(true)}
            className="group inline-flex items-center gap-3 bg-gold px-9 py-4 text-sm font-bold uppercase tracking-[0.2em] text-charcoal transition-colors duration-300 hover:bg-cream"
          >
            Tell us where it hurts
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </button>
        </div>
      </div>

      <ContactDialog open={contactOpen} onClose={() => setContactOpen(false)} />
    </section>
  );
}

/* ── Footer ─────────────────────────────────────────────────────────────── */

function Footer() {
  const ref = useRef<HTMLElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // The strip holds two identical copies, so sliding exactly one copy
        // width lands on a frame identical to the start — seamless loop.
        const tween = gsap.to(marqueeRef.current, {
          xPercent: -50,
          duration: 28,
          ease: "none",
          repeat: -1,
        });

        // Reaching into the strip slows it to a crawl so the line becomes
        // readable instead of sliding out from under the pointer. Bound
        // imperatively next to the tween rather than through React's
        // onPointerEnter: the handler needs the tween instance, and going
        // via a ref means whichever of the two lands second wins.
        const strip = stripRef.current;
        const slow = () => tween.timeScale(0.15);
        const resume = () => tween.timeScale(1);
        strip?.addEventListener("pointerenter", slow);
        strip?.addEventListener("pointerleave", resume);

        return () => {
          strip?.removeEventListener("pointerenter", slow);
          strip?.removeEventListener("pointerleave", resume);
        };
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <footer ref={ref} className="border-t border-cream/10 bg-charcoal">
      <div ref={stripRef} className="overflow-hidden py-12">
        <div ref={marqueeRef} className="flex w-max gap-16 whitespace-nowrap">
          {Array.from({ length: 2 }).map((_, copy) => (
            <div key={copy} className="flex gap-16" aria-hidden={copy === 1}>
              {Array.from({ length: 4 }).map((__, i) => (
                <span
                  key={i}
                  className="cursor-default font-serif text-[clamp(1.75rem,5vw,3.5rem)] text-cream/15 transition-colors duration-500 hover:text-gold/60"
                >
                  The Brand Behind The Brands.
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 pb-14 sm:flex-row sm:items-end sm:justify-between">
        <p className="max-w-sm leading-relaxed text-cream/60">
          Strategy to execution, end to end.
        </p>
        <p className="text-xs uppercase tracking-[0.2em] text-cream/40">
          Branding <span className="text-gold/60">/</span> Advertising{" "}
          <span className="text-gold/60">/</span> Marketing{" "}
          <span className="text-gold/60">/</span> Events{" "}
          <span className="text-gold/60">/</span> Performance
        </p>
      </div>
    </footer>
  );
}

export function HomeSections() {
  return (
    <>
      <Belief />
      <Introduction />
      <Verticals />
      <Refusals />
      <SixDs />
      <Invitation />
      <Footer />
    </>
  );
}
