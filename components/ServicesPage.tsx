"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CopyReveal } from "@/components/CopyReveal";
import FadeContent from "@/components/FadeContent";
import VariableProximity from "@/components/reactbits/VariableProximity";

/**
 * Services — the four verticals, as the brand book states them.
 *
 * Deliberately the quietest page on the site. Home sells and About charms;
 * Services is read by someone deciding whether to spend money, so the only
 * pointer-reactive thing on it is the headline (the same treatment as About's,
 * so the two hubs open in the same register). Everything below is a hairline
 * grid, a numbered run of four, and prose — reveals are fades and line lifts,
 * nothing that pins, hijacks or lenses.
 *
 * Copy is the brand book's own, verbatim where it exists: vertical names and
 * taglines from "Everything, Connected" (p13), the puzzle passage from "The
 * Problem With Everyone Else" (p5), the four-clause close from p13's standfirst.
 */

const VERTICALS = [
  {
    index: "01",
    name: "Brand Foundation",
    tagline: "Build what you stand on.",
    body: "Before a single deliverable is designed, two questions get answered in writing: what does this brand stand for, and why should anyone care. Position, name, identity and the guidelines that keep it intact — the ground the other three verticals stand on.",
    services: [
      "Brand strategy & positioning",
      "Brand naming",
      "Brand identity design",
      "Visual identity system",
      "Brand packaging",
      "Brand audit & entry assessment",
      "Brand guidelines",
    ],
  },
  {
    index: "02",
    name: "Brand Communication",
    tagline: "Say it so people listen.",
    body: "A position nobody hears is a secret, not a strategy. Campaigns, content and media that sound unmistakably like you in every room you show up in — above the line and below it, paid and earned.",
    services: [
      "Advertising (ATL & BTL)",
      "Copywriting & content strategy",
      "Social media strategy & management",
      "Performance marketing",
      "SEO & digital presence",
      "PR & media relations",
      "Campaign planning & execution",
    ],
  },
  {
    index: "03",
    name: "Brand Growth",
    tagline: "Build the engine to scale.",
    body: "Attention that never converts is activity, not growth. This vertical builds the machinery underneath the brand — route to market, site, search, pipeline, measurement — so spend compounds instead of resetting every quarter.",
    services: [
      "Growth & GTM strategy",
      "Sales enablement",
      "Lead generation & digital marketing",
      "Website design & development",
      "Analytics & performance",
      "Market expansion planning",
    ],
  },
  {
    index: "04",
    name: "Brand Experience",
    tagline: "Make people feel it.",
    body: "People forget campaigns. They remember rooms. Launches, activations and exhibitions built from the same strategy that produced the identity — so the brand people meet is the brand we wrote down.",
    services: [
      "Event concept & production",
      "Activations & pop-ups",
      "Product & brand launches",
      "Corporate events & conferences",
      "Exhibition design & build",
      "Market entry experiences",
      "Experiential campaigns",
    ],
  },
] as const;

/* ── Structural furniture ───────────────────────────────────────────────── */

/** Hairline-ruled label. The page's one repeated typographic device. */
function Rule({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-4 border-t border-cream/15 pt-4">
      <span className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-gold">
        {children}
      </span>
    </div>
  );
}

/**
 * Fixed progress rail — which vertical you're in, and how many are left.
 * Borrowed from the page spec; it exists because a reader four screens into a
 * list of 27 services has legitimately lost their place.
 */
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
      // Middle band of the viewport, so the rail changes when the block owns
      // the screen rather than when its first pixel appears.
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
        {/* Left — the claim */}
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
        </div>

        {/* Right — what it actually is, then what you actually get */}
        <div>
          <FadeContent duration={0.8} threshold={0.25}>
            <p className="max-w-[46ch] font-serif text-[clamp(0.98rem,1.35vw,1.1rem)] font-light leading-[1.85] text-cream/75">
              {vertical.body}
            </p>
          </FadeContent>

          <FadeContent duration={0.9} delay={120} threshold={0.2} className="mt-10">
            <ul className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
              {vertical.services.map((s) => (
                <li
                  key={s}
                  className="border-t border-cream/12 py-3 font-sans text-[0.82rem] font-medium leading-snug tracking-[0.02em] text-cream/85"
                >
                  {s}
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

      {/* ── Hero. Same proximity headline as About, so the two hubs open in
             the same voice. It is the only pointer-driven thing here. ── */}
      <section className="relative flex min-h-[78svh] items-center px-6 pb-20 pt-16 sm:px-10 sm:pb-24 lg:px-16">
        <div className="mx-auto w-full max-w-[1400px]">
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
            <p className="max-w-[52ch] font-serif text-[clamp(1rem,1.5vw,1.2rem)] font-light leading-[1.8] text-cream/75">
              Adversado is a branding agency, digital marketing agency and
              advertising agency in one building — based in Kochi, working with
              brands across India. Four verticals, one standard, and one team
              accountable for the whole picture.
            </p>
          </FadeContent>
        </div>
      </section>

      {/* ── The premise. Brutalist ledger: label left, argument right. ── */}
      <section className="relative border-t border-cream/15 px-6 py-20 sm:px-10 sm:py-24 lg:px-16">
        <div className="mx-auto grid max-w-[1400px] gap-x-16 gap-y-8 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <FadeContent duration={0.7}>
            <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-cream/45">
              Why it works this way
            </p>
          </FadeContent>

          <div>
            <CopyReveal>
              <p className="max-w-[34ch] font-sans text-[clamp(1.5rem,3.2vw,2.5rem)] font-medium leading-[1.2] tracking-[-0.02em] text-cream">
                Everyone delivered their piece of the puzzle. Nobody was
                responsible for the picture.
              </p>
            </CopyReveal>

            <FadeContent duration={0.9} delay={150} className="mt-8">
              <p className="max-w-[54ch] font-serif text-[clamp(0.98rem,1.35vw,1.1rem)] font-light leading-[1.85] text-cream/70">
                Strategy sat with one agency. Advertising with another. Digital,
                events and creative each handled by someone else. We built the
                alternative — one integrated team, one direction, one voice, and
                a standard that does not flex between a logo and a national
                campaign.
              </p>
            </FadeContent>
          </div>
        </div>
      </section>

      {/* ── The four. Engage one or all of them. ── */}
      <div>
        <section className="relative border-t border-cream/15 px-6 pt-16 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-[1400px]">
            <FadeContent duration={0.7}>
              <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-cream/45">
                The four verticals — engage one, or all of them
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

      {/* ── The close. The four clauses, in the book's own words. ── */}
      <section className="relative border-t border-cream/15 px-6 py-20 sm:px-10 sm:py-24 lg:px-16">
        <div className="mx-auto max-w-[1400px]">
          <FadeContent duration={0.7}>
            <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-cream/45">
              How the verticals connect
            </p>
          </FadeContent>

          <CopyReveal>
            <p className="mt-8 max-w-[30ch] font-sans text-[clamp(1.75rem,4vw,3.25rem)] font-black uppercase leading-[1] tracking-[-0.03em] text-cream">
              One journey, walked all the way through.
            </p>
          </CopyReveal>

          <FadeContent duration={0.9} delay={150} className="mt-10">
            <p className="max-w-[50ch] font-serif text-[clamp(1.05rem,1.7vw,1.35rem)] font-light leading-[1.9] text-cream/80">
              <span className="text-gold">Foundation</span> builds it.{" "}
              <span className="text-gold">Communication</span> makes people hear
              it. <span className="text-gold">Growth</span> makes it compound.{" "}
              <span className="text-gold">Experience</span> makes people feel
              it.
            </p>
          </FadeContent>
        </div>
      </section>

      {/* ── Audit band. Full-bleed gold, ink type, one button. ── */}
      <section className="relative bg-gold px-6 py-16 sm:px-10 sm:py-20 lg:px-16">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-charcoal/60">
              Where every engagement starts
            </p>
            <p className="mt-5 max-w-[24ch] font-sans text-[clamp(1.85rem,4.2vw,3.25rem)] font-black uppercase leading-[0.98] tracking-[-0.03em] text-charcoal">
              Every engagement starts with an audit.
            </p>
            <p className="mt-4 font-serif text-[clamp(1.05rem,1.8vw,1.4rem)] font-light italic text-charcoal/75">
              No exceptions.
            </p>
          </div>

          <Link
            href="/contact#audit"
            className="inline-flex shrink-0 items-center gap-3 border border-charcoal bg-charcoal px-8 py-4 font-sans text-[0.75rem] font-semibold uppercase tracking-[0.24em] text-gold transition-colors duration-300 hover:bg-transparent hover:text-charcoal"
          >
            Start with the audit
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
