"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CopyReveal } from "@/components/CopyReveal";
import { DitherReveal } from "@/components/DitherReveal";
import FadeContent from "@/components/FadeContent";
import VariableProximity from "@/components/reactbits/VariableProximity";

/**
 * Services — four verticals, one journey.
 *
 * Quiet page: proximity headline (same as About), hairline grid, numbered
 * run of four, prose. Copy is the services brief verbatim.
 */

const VERTICALS = [
  {
    index: "01",
    name: "Brand Foundation",
    tagline: "Build what you stand on.",
    quip: 'Because "vibes" is not a positioning.',
    body: [
      "Before the campaigns, the content and the launches, there's a harder question: what does this brand stand for, and why should anyone care?",
      "Foundation is where we answer it. **Properly, in writing**, before a single deliverable is designed.",
      "It's the branding agency part of us, and the brand strategy agency part too. They were never meant to be separate.",
    ],
    services: [
      "Brand strategy & positioning",
      "Brand naming",
      "Brand identity design",
      "Visual identity systems",
      "Brand packaging",
      "Brand audit & entry assessment",
      "Brand guidelines",
    ],
  },
  {
    index: "02",
    name: "Brand Marketing",
    tagline: "Say it so people listen.",
    quip: "Talking is not the same as being heard.",
    body: [
      "A strong position nobody hears about is a secret, not a strategy.",
      "Marketing is where the brand finds its voice: **campaigns, content and conversations** that sound unmistakably like you, everywhere they show up.",
      "It's the advertising agency side of Adversado. Same voice, bigger rooms.",
    ],
    services: [
      "Advertising campaigns (ATL & BTL)",
      "Copywriting & content strategy",
      "Social media strategy & management",
      "Campaign planning & execution",
      "Media planning",
    ],
  },
  {
    index: "03",
    name: "Brand Reach",
    tagline: "Make sure the right people find you.",
    quip: "Van Gogh sold one painting in his lifetime. Don't be Van Gogh.",
    body: [
      "Brilliant and invisible is still invisible.",
      "Reach is the engine: **performance, search, PR and digital presence** working together so the brand compounds instead of just spends.",
      "It's what people mean when they search for a digital marketing agency in Kochi, in Kerala or anywhere in India. We just define the job wider.",
    ],
    services: [
      "Performance marketing",
      "SEO & digital presence",
      "PR & media relations",
      "Lead generation & digital marketing",
      "Website design & development",
      "Analytics & performance tracking",
    ],
  },
  {
    index: "04",
    name: "Brand Experience",
    tagline: "Make people feel it.",
    quip: "Nobody ever fell in love with a PDF.",
    body: [
      "People forget campaigns. **They remember moments.**",
      "Experience is where the brand becomes physical: launches, events and activations designed with the same strategy that built the identity.",
      "So the brand people meet is the brand we built.",
    ],
    services: [
      "Event concept & production",
      "Brand activations & pop-ups",
      "Product & brand launches",
      "Corporate events & conferences",
      "Exhibition design & build",
      "Market entry experiences",
    ],
  },
] as const;

/* Splits `**marked**` runs out of a line into gold serif-italic spans — the
   same one-payload-phrase-per-sentence convention used on the About/Belief
   copy, just authored inline here since each vertical's body is data. */
function markBody(line: string) {
  return line.split(/(\*\*[^*]+\*\*)/g).map((run, i) => {
    if (run.startsWith("**") && run.endsWith("**")) {
      return (
        <span key={i} className="font-serif italic text-gold">
          {run.slice(2, -2)}
        </span>
      );
    }
    return <span key={i}>{run}</span>;
  });
}

/* ── Structural furniture ───────────────────────────────────────────────── */

function Rule({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-4 border-t border-cream/15 pt-4">
      <span className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-gold">
        {children}
      </span>
    </div>
  );
}

function VerticalRail({ active }: { active: number }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed left-6 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-4 lg:flex"
    >
      {VERTICALS.map((v, i) => {
        const on = i === active;
        return (
          <div key={v.index} className="flex items-center gap-3">
            <span
              className="h-px transition-all duration-500"
              style={{
                width: on ? 34 : 14,
                backgroundColor: on ? "#e6b325" : "rgba(249,247,242,0.28)",
              }}
            />
            <span
              className="font-sans text-[0.65rem] font-semibold tracking-[0.2em] transition-colors duration-500"
              style={{ color: on ? "#e6b325" : "rgba(249,247,242,0.3)" }}
            >
              {v.index}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── One vertical ───────────────────────────────────────────────────────── */

function VerticalBlock({
  vertical,
  onActive,
}: {
  vertical: (typeof VERTICALS)[number];
  onActive: () => void;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onActive();
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [onActive]);

  return (
    <section
      ref={ref}
      className="relative border-t border-cream/15 px-6 py-20 sm:px-10 sm:py-24 lg:px-16 lg:py-28"
    >
      <div className="mx-auto grid max-w-[1400px] gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="relative">
          <span
            aria-hidden
            className="pointer-events-none block font-sans text-[clamp(4rem,9vw,7.5rem)] font-black leading-[0.8] tracking-[-0.05em] text-cream/[0.07]"
          >
            {vertical.index}
          </span>

          <CopyReveal>
            <h2 className="mt-2 font-sans text-[clamp(2rem,4.6vw,3.5rem)] font-black uppercase leading-[0.95] tracking-[-0.03em] text-cream">
              {vertical.name}
            </h2>
          </CopyReveal>

          <CopyReveal>
            <p className="mt-4 font-serif text-[clamp(1.05rem,2vw,1.5rem)] font-light italic leading-[1.3] text-gold">
              {vertical.tagline}
            </p>
          </CopyReveal>

          <FadeContent duration={0.7} delay={80} className="mt-3">
            <p className="max-w-[36ch] font-sans text-[0.88rem] font-light leading-[1.55] text-cream/50">
              {vertical.quip}
            </p>
          </FadeContent>
        </div>

        <div>
          <FadeContent duration={0.8} threshold={0.25} className="space-y-5">
            {vertical.body.map((line, i) => (
              <p
                key={i}
                className="max-w-[46ch] font-serif text-[clamp(0.98rem,1.35vw,1.1rem)] font-light leading-[1.85] text-cream/75"
              >
                {markBody(line)}
              </p>
            ))}
          </FadeContent>

          <FadeContent duration={0.9} delay={120} threshold={0.2} className="mt-12">
            <ul className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
              {vertical.services.map((s) => (
                <li key={s} className="border-t border-cream/12">
                  <span className="block origin-left py-3 font-sans text-[0.82rem] font-medium leading-snug tracking-[0.02em] text-cream/85 transition-transform duration-300 ease-out hover:scale-[1.06] hover:text-cream">
                    {s}
                  </span>
                </li>
              ))}
            </ul>
          </FadeContent>
        </div>
      </div>
    </section>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export function ServicesPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  return (
    <div className="relative">
      <VerticalRail active={active} />

      <section className="relative flex min-h-[78svh] items-center px-6 pb-20 pt-16 sm:px-10 sm:pb-24 lg:px-16">
        {/* Copy and image share one row from lg up; below that the image drops
            under the headline, where a wide frame reads better than a tall one. */}
        <div className="mx-auto grid w-full max-w-[1400px] items-center gap-y-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-x-16">
          <div className="min-w-0">
          <FadeContent duration={0.7}>
            <Rule>Services</Rule>
          </FadeContent>

          <div ref={heroRef} className="mt-8 max-w-[22ch]">
            <h1 className="font-sans text-[clamp(2.75rem,8vw,6.5rem)] font-black uppercase leading-[0.92] tracking-[-0.04em] text-cream">
              <VariableProximity
                label="Everything,"
                containerRef={heroRef as React.RefObject<HTMLElement>}
                fromFontVariationSettings="'wght' 500"
                toFontVariationSettings="'wght' 900"
                radius={220}
                falloff="gaussian"
                style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
              />{" "}
              <span className="text-gold">
                <VariableProximity
                  label="connected."
                  containerRef={heroRef as React.RefObject<HTMLElement>}
                  fromFontVariationSettings="'wght' 500"
                  toFontVariationSettings="'wght' 900"
                  radius={220}
                  falloff="gaussian"
                  style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
                />
              </span>
            </h1>
          </div>

          <FadeContent duration={0.9} delay={200} className="mt-10">
            <p className="max-w-[58ch] font-serif text-[clamp(1rem,1.5vw,1.2rem)] font-light leading-[1.8] text-cream/75">
              Four verticals covering a brand&apos;s complete journey, from the
              first strategic decision to the experience people remember. Engage
              one vertical or all four. Every engagement starts with an audit,
              and everything we produce holds one standard. One integrated
              branding, digital marketing and advertising agency, working from
              Kochi with brands across India.
            </p>
          </FadeContent>
          </div>

          <FadeContent duration={0.9} delay={140} className="min-w-0">
            <DitherReveal
              image="/images/handshake.png"
              alt="Two low-poly hands, one navy and one gold, meeting in a handshake wired into a network of nodes"
              fit="contain"
              dotSize={2}
              revealRadius={230}
              revealSoftness={55}
              waveDensity={100}
              waveSpeed={50}
              ink="#f9f7f2"
              keyWhite
              className="aspect-[16/9] w-full sm:aspect-[2/1] lg:aspect-[16/9]"
            />
          </FadeContent>
        </div>
      </section>

      <div>
        <section className="relative border-t border-cream/15 px-6 pt-16 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-[1400px]">
            <FadeContent duration={0.7}>
              <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-cream/45">
                The four verticals
              </p>
            </FadeContent>
          </div>
        </section>

        {VERTICALS.map((v, i) => (
          <VerticalBlock
            key={v.index}
            vertical={v}
            onActive={() => setActive(i)}
          />
        ))}
      </div>

      <section className="relative border-t border-cream/15 px-6 py-24 text-center sm:px-10 sm:py-28 lg:px-16">
        <div className="mx-auto max-w-[900px]">
          <FadeContent duration={0.7}>
            <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-cream/45">
              How the verticals connect
            </p>
          </FadeContent>

          <CopyReveal>
            <p className="mx-auto mt-8 max-w-[20ch] font-sans text-[clamp(1.85rem,4.4vw,3.5rem)] font-black uppercase leading-[1.02] tracking-[-0.03em] text-cream">
              One journey, walked all the way through.
            </p>
          </CopyReveal>

          <FadeContent duration={0.9} delay={150} className="mx-auto mt-12 max-w-[46ch] space-y-7">
            <p className="font-serif text-[clamp(1.05rem,1.7vw,1.35rem)] font-light leading-[1.9] text-cream/80">
              <span className="text-gold">Foundation</span> builds what the
              brand stands on. <span className="text-gold">Marketing</span>{" "}
              makes sure people hear it. <span className="text-gold">Reach</span>{" "}
              makes sure the right people find it.{" "}
              <span className="text-gold">Experience</span> makes sure they
              feel it.
            </p>
            <p className="font-sans text-[clamp(0.9rem,1.2vw,1rem)] font-light leading-[1.85] tracking-[0.01em] text-cream/60">
              Start anywhere. What doesn&apos;t change is where we start (with
              an audit) and where everything ends: a standard that holds
              across every single thing we produce. One creative agency in
              Kochi, built for brands across India.
            </p>
          </FadeContent>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gold px-6 py-16 sm:px-10 sm:py-20 lg:px-16">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-navy/60">
              Where every engagement starts
            </p>
            <p className="mt-5 max-w-[24ch] font-sans text-[clamp(1.85rem,4.2vw,3.25rem)] font-black uppercase leading-[0.98] tracking-[-0.03em] text-navy">
              Every engagement starts with an audit.
            </p>
            <p className="mt-4 font-serif text-[clamp(1.05rem,1.8vw,1.4rem)] font-light italic text-navy/75">
              No exceptions.
            </p>
          </div>

          {/* Cat sits centred over the button, not the section — its own
              relative anchor, so it tracks the button through both the
              stacked-mobile and end-aligned-row layouts. */}
          <div className="relative shrink-0">
            <img
              src="/images/cat.svg"
              alt=""
              aria-hidden
              className="pointer-events-none absolute bottom-full left-1/2 hidden w-[clamp(11rem,15vw,17rem)] -translate-x-1/2 translate-y-6 opacity-90 sm:block"
            />
            <Link
              href="/contact#audit"
              className="relative inline-flex items-center gap-3 border border-navy bg-navy px-8 py-4 font-sans text-[0.75rem] font-semibold uppercase tracking-[0.24em] text-gold transition-colors duration-300 hover:bg-transparent hover:text-navy"
            >
              Start with the audit
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
