"use client";

import { useRef } from "react";
import { AboutCTA } from "@/components/AboutCTA";
import { CopyReveal } from "@/components/CopyReveal";
import { DiveStorySection } from "@/components/DiveStory";
import FadeContent from "@/components/FadeContent";
import { OnScrollFilter } from "@/components/OnScrollFilter";
import TrueFocus from "@/components/TrueFocus";
import { TeamShowcase } from "@/components/TeamShowcase";
import { ThePoint } from "@/components/ThePoint";
import VariableProximity from "@/components/reactbits/VariableProximity";

const STORY_LAYERS = [
  {
    body: "*Strategy* with one. *Advertising* with another.\n*Creative* handled by someone else.\nEveryone delivered a piece,\nbut **no one saw the whole picture.**",
  },
  {
    body: "About time you had someone who had your **brand's back.**\nSomeone who covers **every side,**\nwithout compromising **the standard.**",
  },
  {
    body: "Someone who becomes **an extension of your brand.**\nNot another *vendor.*",
  },
  {
    body: "You need a **brand behind the brand.**\n*Hungry* enough to make it happen.\n*Curious* enough to ask the right questions.",
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
 * About — storytelling run inspired by the line-reveal editorial layout.
 * Continuous pointer/filter effects stripped so scroll stays crisp over Peach.
 */
export function AboutPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={pageRef} className="relative overflow-x-hidden">
      {/* Hero — display statement between two metadata rails. */}
      <section className="relative -mt-20 flex h-[100svh] items-center justify-center px-6 pb-10 pt-28 sm:px-10 sm:pb-14 lg:px-16">
        {/* Centred and full-width, sized off the viewport rather than a
            character count, so it commands the whole frame. */}
        <div ref={heroRef} className="w-full text-center">
          <h1 className="font-sans text-[clamp(2.75rem,10.5vw,9rem)] font-light leading-[0.94] tracking-[-0.04em] text-cream">
            <VariableProximity
              label="Built because brands deserved"
              containerRef={heroRef as React.RefObject<HTMLElement>}
              fromFontVariationSettings="'wght' 300"
              toFontVariationSettings="'wght' 800"
              radius={220}
              falloff="gaussian"
              style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
            />{" "}
            <span className="font-serif italic text-gold">
              <VariableProximity
                label="better."
                containerRef={heroRef as React.RefObject<HTMLElement>}
                fromFontVariationSettings="'wght' 300"
                toFontVariationSettings="'wght' 800"
                radius={220}
                falloff="gaussian"
                style={{ fontFamily: "var(--font-merriweather), serif" }}
              />
            </span>
          </h1>
        </div>

      </section>

      {/* Observation — eyebrow over an indented display line. */}
      <section className="relative flex flex-col px-6 py-28 sm:px-10 sm:py-32 lg:px-16">
        <div className="w-full max-w-6xl">
          <CopyReveal>
            <h2 className="indent-[12%] font-serif text-[clamp(1.65rem,3.6vw,3.1rem)] font-light leading-[1.15] tracking-[-0.02em] text-cream sm:indent-[18%] lg:indent-[25%]">
              Adversado began with a simple observation: too many businesses
              were spending on marketing while their brands slowly lost{" "}
              <span className="text-gold">direction.</span>
            </h2>
          </CopyReveal>
        </div>
      </section>

      {/* Story — GSAP DOM dive (no WebGL) */}
      <DiveStorySection
        layers={[...STORY_LAYERS]}
        vhPerPlane={45}
        caption="The Story"
      />

      {/* Curiosity — diagonal TrueFocus, centered */}
      <section className="relative flex min-h-[70svh] items-center justify-center px-4 py-24 sm:px-8 lg:px-12">
        <TrueFocus
          sentence="Curiosity Built This Agency"
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

      {/* Beliefs — Aceternity expandable-card interaction, Adversado skin. */}
      <ThePoint />

      {/* Difference — on-scroll mask reveal (no turbulence) */}
      <OnScrollFilter items={DIFFERENCES} />

      {/* Team — Framer Team Showcase interaction, real roles from the deck. */}
      <TeamShowcase />

      {/* The invitation, as the close of the narrative. */}
      <AboutCTA />
    </div>
  );
}
