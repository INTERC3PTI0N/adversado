"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Atropos from "atropos/react";
import "atropos/css";

import ShinyText from "@/components/reactbits/ShinyText";
import VariableProximity from "@/components/reactbits/VariableProximity";

/* The Introduction. Wordmark + tagline + argument on the page starfield.
 * Atropos tilts the whole stack on desktop. VariableProximity thickens
 * each letter as the cursor nears. Marked phrases carry the argument. */

const GOLD = "#e6b325";
const CREAM = "#f9f7f2";

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
  const bodyRef = useRef<HTMLDivElement>(null);
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
      <h2 className="flex w-full flex-wrap items-center justify-center gap-x-[0.32em] gap-y-3 font-sans text-[clamp(2rem,min(7vw,8.5vh),5.5rem)] font-black uppercase leading-[1.05] tracking-tight text-cream">
        <span className="shrink-0">Welcome to</span>
        <span
          className="relative inline-flex h-[0.82em] w-[clamp(10rem,32vw,24rem)] shrink-0 items-center"
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
        className="mt-5 shrink-0 font-serif text-[clamp(1.05rem,1.9vw,1.7rem)] font-normal italic uppercase tracking-[0.18em] sm:mt-7"
        data-atropos-offset="3"
      >
        <ShinyText text="Brand Behind the Brands" color={GOLD} shineColor={CREAM} speed={4} spread={100} />
      </p>

      <div
        ref={bodyRef}
        className="mt-12 flex w-full max-w-none flex-col gap-y-4 font-sans text-[clamp(1.35rem,min(3.4vw,4.2vh),3.15rem)] font-medium leading-[1.55] tracking-[-0.02em] text-cream/88 sm:mt-16 sm:gap-y-5 sm:leading-[1.65]"
        data-atropos-offset="2"
      >
        {BODY.map((sentence, si) => (
          <p key={si} className="w-full text-balance">
            {sentence.map(({ text, mark }, i) => {
              const run = (
                <VariableProximity
                  label={text}
                  containerRef={bodyRef as React.RefObject<HTMLElement>}
                  fromFontVariationSettings="'wght' 400"
                  toFontVariationSettings="'wght' 900"
                  radius={150}
                  falloff="gaussian"
                  style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
                />
              );
              if (mark) {
                return (
                  <span
                    key={i}
                    className="rounded-[0.3em] bg-gold/18 px-[0.18em] py-[0.04em] font-semibold text-gold [box-decoration-break:clone] [-webkit-box-decoration-break:clone]"
                  >
                    {run}
                  </span>
                );
              }
              return <span key={i}>{run}</span>;
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
