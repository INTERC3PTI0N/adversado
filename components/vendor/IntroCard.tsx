"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Atropos from "atropos/react";
import "atropos/css";

/* The Introduction. Wordmark + tagline + argument on the page starfield.
 * Atropos tilts the whole stack on desktop.
 *
 * The argument's payload phrases are set in the serif italic at the same size,
 * weight and colour as the sentence around them. They used to be gold type on
 * a gold-tinted chip, three times over — three highlights in one paragraph is
 * no emphasis at all, just noise. The face change alone carries it. */

const GOLD = "#e6b325";

type Run = { text: string; mark?: boolean };

/* Three sentences, three lines — one marked phrase per line. */
const BODY: Run[][] = [
  [
    { text: "Bringing branding, advertising, marketing, events, and performance " },
    { text: "under one roof.", mark: true },
  ],
  [
    { text: "Because your customers don't experience your business " },
    { text: "in departments.", mark: true },
  ],
  [
    { text: "Why should your " },
    { text: "marketing work that way?", mark: true },
  ],
];

export function IntroCard({ className }: { className?: string }) {
  const [useAtropos, setUseAtropos] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px) and (prefers-reduced-motion: no-preference)");
    const sync = () => setUseAtropos(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const inner = (
    <>
      <h2 className="flex w-full flex-wrap items-center justify-center gap-x-[0.32em] gap-y-3 font-sans text-[clamp(2rem,min(5.8vw,7vh),4.5rem)] font-light leading-[1.05] tracking-[-0.03em] text-cream">
        <span className="shrink-0">Welcome to</span>
        <span
          /* Both axes in `em` so the wordmark tracks the heading. Width was a
             separate rem clamp, which left it sized for the old display scale
             and a dead gap to its right once the heading came down. 4.35em is
             the logo's own 2368:448 ratio applied to the 0.82em height. */
          className="relative inline-flex h-[0.82em] w-[4.35em] shrink-0 items-center"
          data-atropos-offset="6"
        >
          <Image
            src="/logo.svg"
            alt="Adversado"
            width={2368}
            height={448}
            className="h-full w-full object-contain object-left"
            priority
            draggable={false}
          />
        </span>
      </h2>

      <p
        className="mt-5 shrink-0 font-serif text-[clamp(1rem,1.7vw,1.45rem)] font-light italic tracking-[-0.01em] sm:mt-7"
        data-atropos-offset="3"
      >
        <span style={{ color: GOLD }}>Brand Behind the Brands</span>
      </p>

      <div
        className="mt-12 flex w-full max-w-none flex-col gap-y-4 font-sans text-[clamp(1.15rem,min(2.4vw,3.1vh),2rem)] font-light leading-[1.7] tracking-[-0.02em] text-cream/80 sm:mt-16 sm:gap-y-5 sm:leading-[1.65]"
        data-atropos-offset="2"
      >
        {BODY.map((sentence, si) => (
          <p key={si} className="w-full text-balance">
            {sentence.map(({ text, mark }, i) => {
              if (mark) {
                return (
                  <span key={i} className="font-serif italic text-gold">
                    {text}
                  </span>
                );
              }
              return <span key={i}>{text}</span>;
            })}
          </p>
        ))}
      </div>
    </>
  );

  const shellClass = `flex w-full max-w-none flex-col items-center text-center text-cream ${className ?? ""}`;

  if (!useAtropos) {
    return <div className={shellClass}>{inner}</div>;
  }

  return (
    <Atropos
      className={`atropos-welcome w-full max-w-none ${className ?? ""}`}
      shadow={false}
      highlight={false}
      rotateTouch={false}
      rotateXMax={10}
      rotateYMax={10}
      activeOffset={28}
      innerClassName="flex w-full max-w-none flex-col items-center text-center text-cream"
    >
      {inner}
    </Atropos>
  );
}
