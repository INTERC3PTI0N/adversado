"use client";

import { useEffect, useRef, useState } from "react";
import { useBlockReveal } from "@/components/useBlockReveal";

/** One word: the block-reveal markup useBlockReveal expects. */
export function RevealWord({
  children,
  blockColor = "#000",
  className,
  textClassName,
}: {
  children: React.ReactNode;
  blockColor?: string;
  className?: string;
  textClassName?: string;
}) {
  return (
    <span className={`relative inline-block ${className ?? ""}`} style={{ marginRight: "0.28em" }}>
      <span data-reveal-text className={`inline-block ${textClassName ?? ""}`} style={{ opacity: 0 }}>
        {children}
      </span>
      <span
        data-reveal-block
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ background: blockColor, transform: "scaleX(0)" }}
      />
    </span>
  );
}

/** Strips punctuation so `emphasis="brands"` still matches "brands." */
const bare = (w: string) => w.replace(/[^a-z]/gi, "").toLowerCase();

/** Whole-sentence convenience wrapper: splits on spaces, reveals word by word. */
export function TextReveal({
  text,
  blockColor = "#000",
  delay = 0,
  stagger = 0.08,
  duration = 0.5,
  emphasis,
  className,
}: {
  text: string;
  blockColor?: string;
  delay?: number;
  stagger?: number;
  duration?: number;
  /** Word to swell and light up once its own reveal uncovers it. */
  emphasis?: string;
  className?: string;
}) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const [lit, setLit] = useState(false);

  useBlockReveal(rootRef, { delay, stagger, duration }, [text, delay, stagger, duration]);

  const words = text.split(" ");
  const emphasisIndex = emphasis ? words.findIndex((w) => bare(w) === bare(emphasis)) : -1;

  useEffect(() => {
    if (emphasisIndex < 0) return;
    // Each word's block covers for `duration` then uncovers for `duration`.
    // The word is first visible at the halfway point, which is when the
    // emphasis should catch — any earlier and it fires behind the block.
    const at = (delay + emphasisIndex * stagger + duration) * 1000;
    const t = setTimeout(() => setLit(true), at);
    return () => clearTimeout(t);
  }, [emphasisIndex, delay, stagger, duration]);

  return (
    <span ref={rootRef} className={className}>
      {words.map((word, i) => (
        <RevealWord
          key={i}
          blockColor={blockColor}
          textClassName={
            i === emphasisIndex ? `emphasis-word ${lit ? "is-lit" : ""}` : undefined
          }
        >
          {word}
        </RevealWord>
      ))}
    </span>
  );
}
