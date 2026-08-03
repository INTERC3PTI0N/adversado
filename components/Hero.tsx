"use client";

import { useEffect, useRef, useState } from "react";
import { TextReveal, RevealWord } from "@/components/TextReveal";
import { TopographicPulse } from "@/components/TopographicPulse";
import { useBlockReveal } from "@/components/useBlockReveal";
import { ScrollHint } from "@/components/ScrollHint";
import { Typewriter } from "@/components/Typewriter";

// Brand book palette.
const NAVY = "#1f355e";
const GOLD = "#e6b325";

const HEADLINE_1_LEAD = ["This", "headline", "will", "vanish", "in"];
const HEADLINE_2 = "So do most brands.";
const SUBHEADING =
  "Adversado builds the ones that stay. Strategy to execution, one team, end to end.";

const REVEAL_STAGGER = 0.08;
const REVEAL_DURATION = 0.5;
// Last word of headline 1 (index 6, "seconds.") starts at 6*stagger and both
// reveal phases take duration*2 — this is when the wordmark is fully in.
const REVEAL_DONE_MS = (6 * REVEAL_STAGGER + REVEAL_DURATION * 2) * 1000;
const COUNT_STEP_MS = 1000;
const FADE_MS = 400;

// "So do most brands." is four words; the last finishes at 3*stagger +
// duration*2. The subheading starts typing once that has fully landed.
const HEADLINE_2_DONE_MS = (3 * REVEAL_STAGGER + REVEAL_DURATION * 2) * 1000;
const TYPE_DELAY_MS = HEADLINE_2_DONE_MS + 250;
// Roughly how long the typed line takes, so the scroll cue waits it out.
const TYPE_RUN_MS = 4200;
const SCROLL_HINT_DELAY_MS = TYPE_DELAY_MS + TYPE_RUN_MS + 5000;

const COUNT_WORDS: Record<number, string> = { 3: "three", 2: "two", 1: "one" };

export function Hero({ active = true }: { active?: boolean }) {
  const [count, setCount] = useState(3);
  const [firstVisible, setFirstVisible] = useState(true);
  const [phase, setPhase] = useState<"idle" | "first" | "second">("idle");

  const headlineRef = useRef<HTMLHeadingElement>(null);
  useBlockReveal(headlineRef, { stagger: REVEAL_STAGGER, duration: REVEAL_DURATION }, [phase]);

  useEffect(() => {
    // Hero renders (background and all) from page load, underneath the
    // preloader/transition — but the countdown must not start ticking until
    // those have handed off, or it's long over by the time anyone can see it.
    if (!active) return;
    const timers = [
      setTimeout(() => setPhase("first"), 0),
      setTimeout(() => setCount(2), REVEAL_DONE_MS + COUNT_STEP_MS),
      setTimeout(() => setCount(1), REVEAL_DONE_MS + COUNT_STEP_MS * 2),
      setTimeout(() => setFirstVisible(false), REVEAL_DONE_MS + COUNT_STEP_MS * 3),
      setTimeout(() => setPhase("second"), REVEAL_DONE_MS + COUNT_STEP_MS * 3 + FADE_MS),
    ];
    return () => timers.forEach(clearTimeout);
  }, [active]);

  return (
    <section className="relative flex h-screen w-full items-center justify-center overflow-hidden">
      <TopographicPulse className="absolute inset-0 z-0" />

      {/* Soft navy scrim: the contours wander wherever the noise takes them,
          so without this a gold streak occasionally lands straight through
          the headline and eats its contrast. Falls off well before the edges
          so the field still reads as one continuous background. */}
      <div
        aria-hidden
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(ellipse 62% 46% at 50% 48%, rgba(31,53,94,0.78), rgba(31,53,94,0) 72%)",
        }}
      />

      <div className="relative z-10 flex w-full flex-col items-center px-4 text-center">
        {phase === "first" && (
          // Sized in vw and held to a single line: the joke only works if the
          // whole sentence is taken in at once, and a wrap puts the counting
          // word on its own row where the change is easy to miss.
          <h1
            ref={headlineRef}
            className="whitespace-nowrap text-[clamp(0.62rem,3vw,2.5rem)] font-bold uppercase leading-[1.15] tracking-tight text-cream"
            style={{ opacity: firstVisible ? 1 : 0, transition: `opacity ${FADE_MS}ms ease` }}
          >
            {HEADLINE_1_LEAD.map((w, i) => (
              <RevealWord key={i} blockColor={NAVY}>
                {w}
              </RevealWord>
            ))}
            <RevealWord blockColor={NAVY} textClassName="text-stroke-white">
              {COUNT_WORDS[count]}
            </RevealWord>
            <RevealWord blockColor={NAVY}>{count === 1 ? "second." : "seconds."}</RevealWord>
          </h1>
        )}
        {phase === "second" && (
          <div className="flex w-full max-w-3xl flex-col items-center gap-8">
            <h1 className="font-serif text-[clamp(2rem,6vw,4.5rem)] leading-[1.1] text-cream">
              <TextReveal
                text={HEADLINE_2}
                blockColor={GOLD}
                stagger={REVEAL_STAGGER}
                duration={REVEAL_DURATION}
                emphasis="brands"
              />
            </h1>
            <p className="max-w-2xl text-[clamp(1.05rem,2.1vw,1.65rem)] leading-relaxed text-cream/90">
              <Typewriter text={SUBHEADING} delay={TYPE_DELAY_MS} />
            </p>
          </div>
        )}
      </div>

      {phase === "second" && <ScrollHint delay={SCROLL_HINT_DELAY_MS} />}
    </section>
  );
}
