"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import AnimatedContent from "@/components/AnimatedContent";
import BlurText from "@/components/BlurText";
import ClickSpark from "@/components/ClickSpark";
import { CopyReveal } from "@/components/CopyReveal";
import DecryptedText from "@/components/DecryptedText";
import { DiveFieldSection } from "@/components/DiveField";
import ElectricBorder from "@/components/ElectricBorder";
import FadeContent from "@/components/FadeContent";
import Magnet from "@/components/Magnet";
import Noise from "@/components/Noise";
import ScrollFloat from "@/components/ScrollFloat";
import StarBorder from "@/components/StarBorder";
import TrueFocus from "@/components/TrueFocus";
import { ExpandOnHoverList } from "@/components/ExpandOnHoverList";
import { OnScrollFilter } from "@/components/OnScrollFilter";
import { Magnify } from "@/components/Magnify";
import { InverseStoryText } from "@/components/InverseStoryText";
import VariableProximity from "@/components/reactbits/VariableProximity";
import SplashCursor from "@/components/reactbits/SplashCursor";

const GOLD = "#e6b325";
const NAVY = "#1f355e";
const CREAM = "#f9f7f2";
const SPLASH_COLORS = [GOLD, NAVY, CREAM];

const STORY_LAYERS = [
  {
    body: "**Strategy** sat with one agency. **Advertising** with another. Digital, events and creative",
  },
  {
    body: "each handled by someone else. Every partner delivered their piece of the puzzle, and **nobody was responsible for the picture.**",
  },
  {
    body: "We built **Adversado** to be the alternative. One integrated creative agency, born in Kochi and built for brands across India",
  },
  {
    body: "with **one clear direction**, **one consistent voice** and **one uncompromising standard.**",
  },
  {
    body: "We **don't hand over deliverables and disappear.**",
  },
  {
    body: "We become part of the business: the team that **challenges assumptions**, solves the hard brand problems",
  },
  {
    body: "and holds the **whole picture** together.",
  },
  {
    body: "The work carries our **clients' names.** The thinking behind it carries **ours.**",
  },
  {
    body: "That's what **The Brand Behind The Brands** means.",
  },
] as const;

const BELIEFS = [
  {
    title: "Strategy is not a phase.",
    line: "It comes before everything, or it isn't strategy.",
  },
  {
    title: "Work that doesn't perform isn't creative.",
    line: "It's decoration. Expensive decoration, usually.",
  },
  {
    title: "A brand is not a logo.",
    line: "It's every touchpoint, connected and considered.",
  },
  {
    title: "Consistency is competitive advantage.",
    line: "Brands are remembered through repetition, not reinvention.",
  },
  {
    title: "Honest conversations win.",
    line: "Transparency, constructive disagreement, mutual respect.",
  },
  {
    title: "Premium is a standard, not a price.",
    line: "A logo gets the same rigour as a national campaign.",
  },
] as const;

const DIFFERENCES = [
  {
    up: "Whole",
    down: "Picture",
    text: "Most agencies own a slice of the brand. We own the whole thing, which means nothing gets lost in the handoffs. There are no handoffs.",
    layout: 1 as const,
  },
  {
    up: "Strategy",
    down: "First",
    text: "Not a discovery-phase formality. The actual starting point of every engagement.",
    layout: 2 as const,
  },
  {
    up: "One",
    down: "Room",
    text: "Our team has built brands across FMCG, pharma, hospitality, events and marketing. Whatever the brand, whatever the situation, someone here has already lived it.",
    layout: 3 as const,
  },
  {
    up: "Won't",
    down: "Flex",
    text: "Same rigour on a logo as on a launch. If that sounds expensive, wait until you price inconsistency.",
    layout: 4 as const,
  },
] as const;

/**
 * About — storytelling run inspired by the line-reveal editorial layout:
 * full-viewport chapters, indented display type, two-column story body.
 * Existing React Bits / GSAP motions stay woven into that structure.
 */
export function AboutPage() {
  const heroRef = useRef<HTMLDivElement>(null);

  return (
    <ClickSpark sparkColor="#e6b325" sparkSize={12} sparkRadius={22} sparkCount={10} duration={450}>
      <SplashCursor
        RAINBOW_MODE={false}
        COLORS={SPLASH_COLORS}
        COLOR_SCALE={0.24}
        SPLAT_RADIUS={0.24}
        SPLAT_FORCE={6200}
        DENSITY_DISSIPATION={2.2}
        VELOCITY_DISSIPATION={1.6}
        CURL={5}
        COLOR_UPDATE_SPEED={14}
      />
      <div className="relative overflow-x-hidden">
        <div aria-hidden className="pointer-events-none fixed inset-0 z-[4] opacity-40">
          <Noise patternAlpha={10} patternRefreshInterval={3} />
        </div>

        {/* Hero — centered display over the scene */}
        <section className="relative -mt-20 flex min-h-[100svh] items-center justify-center px-6 pt-20 sm:px-10 lg:px-16">
          <div ref={heroRef} className="mx-auto w-full max-w-3xl -translate-y-[8vh] text-center lg:max-w-[50%]">
            <FadeContent duration={0.7} blur className="mb-8">
              <p className="text-sm uppercase tracking-[0.35em] text-gold">About</p>
            </FadeContent>

            <h1 className="text-balance font-sans text-[clamp(2.75rem,7vw,5.75rem)] font-black leading-[1.02] tracking-[-0.03em] text-cream">
              <VariableProximity
                label="Built because brands deserved"
                containerRef={heroRef as React.RefObject<HTMLElement>}
                fromFontVariationSettings="'wght' 500"
                toFontVariationSettings="'wght' 900"
                radius={220}
                falloff="gaussian"
                style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
              />{" "}
              <span className="text-gold">
                <VariableProximity
                  label="better."
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

        {/* Observation — full viewport, eyebrow top / indented display bottom */}
        <section className="relative flex min-h-[100svh] flex-col justify-between px-6 pb-10 pt-28 sm:px-10 sm:pb-14 sm:pt-32 lg:px-16">
          <CopyReveal>
            <p className="text-sm uppercase tracking-[0.35em] text-gold">
              Design &amp; strategy for brands that want one partner
            </p>
          </CopyReveal>

          <div className="w-full max-w-6xl pb-4">
            <InverseStoryText lensSize={260} className="cursor-none">
              <CopyReveal>
                <h2 className="indent-[12%] font-serif text-[clamp(1.65rem,3.6vw,3.1rem)] font-light leading-[1.15] tracking-[-0.02em] text-cream sm:indent-[18%] lg:indent-[25%]">
                  Adversado began with a simple observation: too many businesses
                  were spending on marketing while their brands slowly lost{" "}
                  <span className="text-gold">direction.</span>
                </h2>
              </CopyReveal>
            </InverseStoryText>
          </div>
        </section>

        {/* Story — label, then sticky full-viewport dive */}
        <div className="relative z-[2] px-6 pb-6 pt-20 sm:px-10 sm:pb-8 sm:pt-28 lg:px-16">
          <p className="font-sans text-sm font-medium uppercase tracking-[0.4em] text-gold">
            The Story
          </p>
        </div>
        <DiveFieldSection
          layers={[...STORY_LAYERS]}
          vhPerPlane={90}
          textColor="#f9f7f2"
          accent="#e6b325"
          rgbShift={0}
          rgbShiftVel={0}
          wobble={0.004}
          damping={0.55}
          sideMargin={0.04}
          lineHeight={1.15}
          letterSpacing={-0.04}
          fontFamily="Montserrat, ui-sans-serif, system-ui, sans-serif"
          fontWeight={800}
          fontSize={64}
          caption="Scroll through the planes"
        />

        {/* Name / philosophy — centered hierarchy */}
        <section className="relative flex min-h-[100svh] flex-col items-center justify-center px-6 py-28 text-center sm:px-10 sm:py-32 lg:px-16">
          <CopyReveal>
            <p className="mb-10 text-sm uppercase tracking-[0.35em] text-gold">
              About the name
            </p>
          </CopyReveal>

          <div className="mx-auto w-full max-w-4xl space-y-6">
            <CopyReveal>
              <h2 className="flex flex-wrap items-center justify-center gap-x-[0.55em] gap-y-3 font-serif text-[clamp(1.85rem,4.2vw,3.5rem)] font-light leading-[1.12] tracking-[-0.02em] text-cream">
                <span>People misread</span>
                <Image
                  src="/logo_nocat.svg"
                  alt="Adversado"
                  width={320}
                  height={60}
                  className="mx-[0.12em] inline-block h-[0.8em] w-auto -translate-y-[0.08em]"
                />
                <span>as adversary.</span>
              </h2>
            </CopyReveal>

            <CopyReveal>
              <p className="font-serif text-[clamp(1.35rem,2.6vw,2rem)] font-light leading-[1.25] tracking-[-0.015em] text-cream/85">
                Let them. We are one — the adversary
              </p>
            </CopyReveal>

            <CopyReveal>
              <p className="mx-auto max-w-2xl font-sans text-[clamp(1.05rem,1.7vw,1.25rem)] font-light leading-[1.7] text-cream/70">
                of{" "}
                <DecryptedText
                  text="average"
                  animateOn="view"
                  sequential
                  speed={35}
                  className="font-semibold text-gold"
                  encryptedClassName="text-gold/40"
                  parentClassName="inline"
                />
                , of vendor-thinking, of work that looks good on the day and
                means nothing six months later.
              </p>
            </CopyReveal>

            <AnimatedContent distance={24} duration={0.7} className="pt-6">
              <div className="text-cream">
                <TrueFocus
                  sentence="Curiosity built this agency"
                  manualMode
                  blurAmount={4}
                  borderColor="#e6b325"
                  glowColor="rgba(230, 179, 37, 0.45)"
                  animationDuration={0.55}
                  pauseBetweenAnimations={1.1}
                />
              </div>
            </AnimatedContent>
          </div>
        </section>

        {/* Beliefs — expand-on-hover numbered list */}
        <section className="relative px-6 py-20 sm:px-10 sm:py-28 lg:px-16">
          <div className="mx-auto max-w-5xl">
            <CopyReveal>
              <p className="mb-8 text-sm uppercase tracking-[0.35em] text-gold">
                What we believe
              </p>
            </CopyReveal>

            <BlurText
              text="The point of it all."
              delay={60}
              animateBy="words"
              direction="top"
              className="font-sans text-[clamp(2.25rem,5vw,4rem)] font-black leading-[1.05] tracking-[-0.02em] text-cream"
            />

            <ExpandOnHoverList
              className="mt-14 sm:mt-16"
              items={BELIEFS.map((b) => ({
                title: b.title,
                description: b.line,
              }))}
            />
          </div>
        </section>

        {/* Difference — on-scroll SVG filter + Flip titles */}
        <OnScrollFilter items={DIFFERENCES} />

        {/* Team */}
        <section className="relative px-6 py-20 sm:px-10 sm:py-28 lg:px-16">
          <div className="mx-auto max-w-5xl">
            <CopyReveal>
              <p className="mb-8 text-sm uppercase tracking-[0.35em] text-gold">
                The Team
              </p>
            </CopyReveal>

            <div className="space-y-3 sm:space-y-4">
              <ScrollFloat
                animationDuration={1}
                ease="power2.out"
                scrollStart="top bottom-=5%"
                scrollEnd="center center"
                stagger={0.02}
                containerClassName="!my-0 overflow-visible"
                textClassName="!text-[clamp(1.85rem,4.2vw,3.25rem)] !font-sans !font-medium !leading-[1.15] !tracking-[-0.02em] !text-cream"
              >
                The people behind the brands
              </ScrollFloat>

              <div className="max-w-4xl">
                <h2 className="font-serif text-[clamp(2.5rem,7vw,5.5rem)] font-light italic leading-[0.95] tracking-[-0.02em] text-gold">
                  Behind the Brands
                </h2>
              </div>
            </div>

            <AnimatedContent distance={36} duration={0.8} className="mt-10 w-full max-w-5xl sm:mt-12">
              <p className="font-sans text-[clamp(1.45rem,2.6vw,2rem)] font-light leading-[1.85] tracking-[0.005em] text-cream/80">
                <span className="font-serif font-light italic text-gold">
                  Small by design.
                </span>{" "}
                <span className="font-serif font-light italic text-gold">
                  Senior by default.
                </span>{" "}
                Everyone at this table has shipped{" "}
                <span className="font-medium text-cream">real work</span> in the{" "}
                <span className="font-medium text-cream">real world</span>:{" "}
                <span className="text-gold">FMCG</span> shelves,{" "}
                <span className="text-gold">pharma</span> regulations,{" "}
                <span className="text-gold">hotel</span> lobbies,{" "}
                <span className="text-gold">event</span> floors,{" "}
                <span className="text-gold">ad accounts</span> with actual money
                in them.
              </p>
            </AnimatedContent>

            <div className="relative mt-16">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-5 left-1/2 z-10 flex -translate-x-1/2 gap-3"
              >
                <span className="block h-5 w-3.5 origin-bottom -rotate-[18deg] rounded-t-full bg-gold/80" />
                <span className="block h-5 w-3.5 origin-bottom rotate-[18deg] rounded-t-full bg-gold/80" />
              </div>

              <AnimatedContent distance={56} duration={0.9} scale={0.96}>
                <ElectricBorder
                  color="#e6b325"
                  speed={0.8}
                  chaos={0.08}
                  borderRadius={20}
                  className="w-full"
                >
                  <article className="bg-[#120f17]/90 px-6 py-10 sm:px-8 sm:py-12">
                    <p className="font-sans text-2xl font-black uppercase tracking-[0.12em] text-cream">
                      The Cat
                    </p>
                    <p className="mt-2 font-sans text-xs font-medium uppercase tracking-[0.3em] text-gold">
                      Chief Curiosity Officer
                    </p>
                    <p className="mt-6 max-w-[36ch] font-serif text-lg font-light italic leading-relaxed text-cream/70">
                      Sees everything. Says nothing. Judges quietly. The only team
                      member allowed on the table during meetings.
                    </p>
                  </article>
                </ElectricBorder>
              </AnimatedContent>
            </div>

            <FadeContent duration={0.8} className="mt-14">
              <p className="font-sans text-[clamp(1.2rem,2vw,1.45rem)] font-light leading-[1.85] text-cream/70">
                Want to be on this page? We hire people who flinch at the word{" "}
                <Magnify className="font-semibold text-gold">&ldquo;synergy.&rdquo;</Magnify>
              </p>
            </FadeContent>

            <Magnet padding={80} magnetStrength={3} wrapperClassName="mt-8 inline-block">
              <StarBorder
                as="div"
                color="#e6b325"
                speed="5s"
                thickness={2}
                className="!rounded-none"
              >
                <Link
                  href="/contact"
                  className="inline-block bg-gold px-8 py-4 font-sans text-sm font-medium uppercase tracking-[0.22em] text-charcoal transition-colors duration-300 hover:bg-cream"
                >
                  Start a conversation →
                </Link>
              </StarBorder>
            </Magnet>
          </div>
        </section>
      </div>
    </ClickSpark>
  );
}
