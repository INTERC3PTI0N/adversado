"use client";

import { useRef } from "react";
import Atropos from "atropos/react";
import "atropos/css";

import { useNearViewport } from "@/components/Interactions";
import { Typewriter } from "@/components/Typewriter";
import ShinyText from "@/components/reactbits/ShinyText";
import VariableProximity from "@/components/reactbits/VariableProximity";

/* The Introduction. No card, no shader face any more — just the wordmark,
 * tagline and argument sitting directly on the page's own starfield, the way
 * every other section on the site does. What's left from the card version:
 *
 *   React Bits' ShinyText carries a slow shine across the tagline.
 *   React Bits' VariableProximity runs the body copy, thickening each letter
 *     as the cursor nears it — it reads the pointer off `window`, so it needs
 *     no hover target and works exactly the same with nothing behind it.
 */

const GOLD = "#e6b325";
const CREAM = "#f9f7f2";

/* The body copy: three sentences, each its own line, each cut into runs so the
 * phrases that carry the argument can be marked or otherwise set apart.
 * VariableProximity takes a plain string, so a highlight can't live inside one
 * — instead each run is its own instance and the marked ones are wrapped. Runs
 * within a sentence sit inline and share that sentence's container, so the
 * proximity maths measures against the actual line rather than the whole
 * paragraph. */
type Run = { text: string; mark?: boolean; emphasis?: boolean };
const BODY: Run[][] = [
  [{ text: "Bringing branding, advertising, marketing, events and performance " }, { text: "under one roof.", mark: true }],
  [{ text: "Because your customers don’t experience your business " }],
  [{ text: "in departments.", mark: true }],
  [{ text: "Why should your " }, { text: "marketing", emphasis: true }, { text: " ?" }],
];

export function IntroCard({ className }: { className?: string }) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [headRef, headNear] = useNearViewport<HTMLHeadingElement>("0px");

  return (
    <Atropos
      className={className}
      shadow={false}
      highlight={false}
      rotateTouch={false}
      rotateXMax={9}
      rotateYMax={9}
      innerClassName="flex w-full flex-col items-center gap-6 text-center text-cream"
    >
      {/* Typed out once the section has actually been scrolled to, not on
          mount — `useNearViewport` latches the first time this heading nears
          the viewport and stays true, so it never retypes on scroll-back. */}
      <h2
        ref={headRef}
        className="font-sans text-[clamp(2.2rem,6vw,5rem)] font-black uppercase tracking-tight text-gold"
      >
        {headNear && <Typewriter text="Welcome to Adversado" speed={38} />}
      </h2>
      <p className=" shrink-0 font-serif text-[clamp(1.05rem,1.9vw,1.7rem)] font-normal italic tracking-[0.18em] uppercase">
        <ShinyText text="Brand Behind the Brands" color={GOLD} shineColor={CREAM} speed={4} spread={100} />
      </p>

      {/* The card's real content, still. Big enough to be the section rather
          than a caption under one, and set in the brand's own Montserrat —
          which next/font already serves as a variable face, so the proximity
          interaction rides its `wght` axis and needs no extra font loaded.
          One sentence per line, with line spacing matched to the Belief
          section's `leading-[2.5]` read — the reference for what this site
          considers readable body copy. Full width, same as the rest of the
          page's sections. */}
      <div
        ref={bodyRef}
        className="flex w-full flex-col gap-y-2 font-sans text-[clamp(1.6rem,3.6vw,3.4rem)] leading-[2.15] tracking-[-0.02em] sm:gap-y-3"
      >
        {BODY.map((sentence, si) => (
          <p key={si}>
            {sentence.map(({ text, mark, emphasis }, i) => {
              const run = (
                <VariableProximity
                  label={text}
                  containerRef={bodyRef as React.RefObject<HTMLElement>}
                  /* Light at rest so the thickening under the cursor is a real
                     change rather than a nudge between two bolds. */
                  fromFontVariationSettings="'wght' 350"
                  toFontVariationSettings="'wght' 900"
                  radius={140}
                  falloff="gaussian"
                  style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
                />
              );
              if (mark) {
                return (
                  <span
                    key={i}
                    /* `box-decoration-break: clone` so a marked phrase that
                       wraps gets the bar and its rounding on both lines
                       instead of one long band with square inner ends. */
                    className="rounded-[0.3em] bg-gold/18 px-[0.16em] py-[0.02em] text-gold [box-decoration-break:clone] [-webkit-box-decoration-break:clone]"
                  >
                    {run}
                  </span>
                );
              }
              if (emphasis) {
                return (
                  <span key={i} className="italic text-gold underline decoration-2 underline-offset-[0.14em]">
                    {run}
                  </span>
                );
              }
              return <span key={i}>{run}</span>;
            })}
          </p>
        ))}
      </div>
    </Atropos>
  );
}
