"use client";

import { useRef } from "react";
import Link from "next/link";
import { AboutSnap } from "@/components/AboutSnap";
import { CopyReveal } from "@/components/CopyReveal";
import { DiveStorySection } from "@/components/DiveStory";
import FadeContent from "@/components/FadeContent";
import TrueFocus from "@/components/TrueFocus";
import { ExpandOnHoverList } from "@/components/ExpandOnHoverList";
import { OnScrollFilter } from "@/components/OnScrollFilter";
import { InverseStoryText } from "@/components/InverseStoryText";
import VariableProximity from "@/components/reactbits/VariableProximity";

const STORY_LAYERS = [
  {
    body: "*Foundation* builds what you stand on.\nBefore campaigns and launches —\n**what does this brand stand for,**\nand why should anyone care?",
  },
  {
    body: "*Marketing* says it so people listen.\nA strong position nobody hears\nis a *secret,* not a strategy.\n**Same voice. Bigger rooms.**",
  },
  {
    body: "*Reach* finds the right people.\nBrilliant and invisible\nis still invisible.\n**Compound, don't just spend.**",
  },
  {
    body: "*Experience* makes them feel it.\nPeople forget campaigns.\nThey remember *moments.*\n**Nobody ever fell in love with a PDF.**",
  },
] as const;

const VERTICALS = [
  {
    title: "Brand Foundation",
    line: "Strategy, naming, identity, packaging, guidelines — the ground everything else stands on.",
  },
  {
    title: "Brand Marketing",
    line: "ATL & BTL campaigns, copy, social, media planning — the voice people hear.",
  },
  {
    title: "Brand Reach",
    line: "Performance, SEO, PR, web, analytics — so the right people actually find you.",
  },
  {
    title: "Brand Experience",
    line: "Launches, activations, events, exhibitions — the moments they remember.",
  },
] as const;

const DIFFERENCES = [
  {
    up: "Brand",
    down: "Foundation",
    text: "Before the campaigns, the content and the launches — what does this brand stand for, and why should anyone care? Answered properly, in writing, before a single deliverable is designed.",
    layout: 1 as const,
  },
  {
    up: "Brand",
    down: "Marketing",
    text: "Campaigns, content and conversations that sound unmistakably like you, everywhere they show up. The advertising agency side of Adversado — same voice, bigger rooms.",
    layout: 2 as const,
  },
  {
    up: "Brand",
    down: "Reach",
    text: "Performance, search, PR and digital presence working together so the brand compounds instead of just spends. Brilliant and invisible is still invisible.",
    layout: 3 as const,
  },
  {
    up: "Brand",
    down: "Experience",
    text: "Launches, events and activations designed with the same strategy that built the identity — so the brand people meet is the brand we built.",
    layout: 4 as const,
  },
] as const;

/**
 * Services — same Peach + full-page snap language as About.
 * Four verticals as the narrative run; one standard across every panel.
 */
export function ServicesPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={pageRef} className="relative overflow-x-hidden">
      <AboutSnap scope={pageRef} />

      {/* Hero */}
      <section
        data-about-snap
        className="relative -mt-20 flex h-[100svh] items-center justify-center px-6 pt-20 sm:px-10 lg:px-16"
      >
        <div
          ref={heroRef}
          className="mx-auto w-full max-w-3xl -translate-y-[8vh] text-center lg:max-w-[50%]"
        >
          <FadeContent duration={0.7} className="mb-8">
            <p className="text-sm uppercase tracking-[0.35em] text-gold">
              Services
            </p>
          </FadeContent>

          <h1 className="text-balance font-sans text-[clamp(2.75rem,7vw,5.75rem)] font-black leading-[1.02] tracking-[-0.03em] text-cream">
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
      </section>

      {/* Observation-style thesis */}
      <section
        data-about-snap
        className="relative flex h-[100svh] flex-col justify-between px-6 pb-10 pt-28 sm:px-10 sm:pb-14 sm:pt-32 lg:px-16"
      >
        <CopyReveal>
          <p className="text-sm uppercase tracking-[0.35em] text-gold">
            Four verticals. One journey. One standard.
          </p>
        </CopyReveal>

        <div className="w-full max-w-6xl pb-4">
          <InverseStoryText lensSize={260} className="cursor-none">
            <CopyReveal>
              <h2 className="indent-[12%] font-serif text-[clamp(1.65rem,3.6vw,3.1rem)] font-light leading-[1.15] tracking-[-0.02em] text-cream sm:indent-[18%] lg:indent-[25%]">
                Engage one vertical or all four — from the first strategic
                decision to the experience people remember. Every engagement
                starts with an audit. Everything we produce holds{" "}
                <span className="text-gold">one standard.</span>
              </h2>
            </CopyReveal>
          </InverseStoryText>
        </div>
      </section>

      {/* Story dive — four vertical beats */}
      <DiveStorySection
        layers={[...STORY_LAYERS]}
        vhPerPlane={100}
        caption="The Verticals"
      />

      {/* Lockup */}
      <section
        data-about-snap
        className="relative flex h-[100svh] items-center justify-center px-4 sm:px-8 lg:px-12"
      >
        <TrueFocus
          sentence="One Partner Every Touchpoint"
          layout="diagonal"
          highlightFirstLetter
          indentEm={1.2}
          blurAmount={4}
          borderColor="#e6b325"
          glowColor="rgba(230, 179, 37, 0.45)"
          animationDuration={0.55}
          pauseBetweenAnimations={1.1}
          wordClassName="block text-[clamp(2.75rem,11vw,9rem)] font-black leading-[1.02] tracking-[-0.04em]"
        />
      </section>

      {/* Vertical index */}
      <section
        data-about-snap
        className="relative flex h-[100svh] flex-col justify-center overflow-y-auto px-6 py-16 sm:px-10 sm:py-20 lg:px-16"
      >
        <div className="mx-auto max-w-5xl">
          <CopyReveal>
            <p className="mb-8 text-sm uppercase tracking-[0.35em] text-gold">
              What we offer
            </p>
          </CopyReveal>

          <CopyReveal>
            <h2 className="font-sans text-[clamp(2.25rem,5vw,4rem)] font-black leading-[1.05] tracking-[-0.02em] text-cream">
              The <span className="text-gold">Work</span> of it all.
            </h2>
          </CopyReveal>

          <ExpandOnHoverList
            className="mt-14 sm:mt-16"
            items={VERTICALS.map((v) => ({
              title: v.title,
              description: v.line,
            }))}
          />
        </div>
      </section>

      {/* Difference-style vertical deep-dives */}
      <OnScrollFilter items={DIFFERENCES} eyebrow="Inside each vertical" />

      {/* Close — how they connect */}
      <section
        data-about-snap
        className="relative flex h-[100svh] flex-col justify-center overflow-y-auto px-6 py-16 sm:px-10 sm:py-20 lg:px-16"
      >
        <div className="mx-auto max-w-5xl">
          <CopyReveal>
            <p className="mb-8 text-sm uppercase tracking-[0.35em] text-gold">
              How the verticals connect
            </p>
          </CopyReveal>

          <div className="space-y-3 sm:space-y-4">
            <CopyReveal>
              <p className="font-sans text-[clamp(1.85rem,4.2vw,3.25rem)] font-medium leading-[1.15] tracking-[-0.02em] text-cream">
                One journey, walked all the way through
              </p>
            </CopyReveal>

            <div className="max-w-4xl">
              <h2 className="font-serif text-[clamp(2.5rem,7vw,5.5rem)] font-light italic leading-[0.95] tracking-[-0.02em] text-gold">
                Foundation. Marketing. Reach. Experience.
              </h2>
            </div>
          </div>

          <FadeContent duration={0.85} className="mt-10 w-full max-w-5xl sm:mt-12">
            <p className="font-sans text-[clamp(1.45rem,2.6vw,2rem)] font-light leading-[1.85] tracking-[0.005em] text-cream/80">
              <span className="font-serif font-light italic text-gold">
                Foundation
              </span>{" "}
              builds what the brand stands on.{" "}
              <span className="font-serif font-light italic text-gold">
                Marketing
              </span>{" "}
              makes sure people hear it.{" "}
              <span className="font-serif font-light italic text-gold">
                Reach
              </span>{" "}
              makes sure the right people find it.{" "}
              <span className="font-serif font-light italic text-gold">
                Experience
              </span>{" "}
              makes sure they feel it.
            </p>
          </FadeContent>

          <FadeContent duration={0.8} className="mt-10">
            <p className="font-sans text-[clamp(1.2rem,2vw,1.45rem)] font-light leading-[1.85] text-cream/70">
              Start anywhere. What doesn&apos;t change is where we start — with
              an{" "}
              <span className="font-semibold text-gold">audit</span> — and the
              standard that holds across every single thing we produce.
            </p>
          </FadeContent>

          <Link
            href="/contact"
            className="mt-8 inline-block bg-gold px-8 py-4 font-sans text-sm font-medium uppercase tracking-[0.22em] text-charcoal transition-colors duration-300 hover:bg-cream"
          >
            Start with the audit →
          </Link>
        </div>
      </section>
    </div>
  );
}
