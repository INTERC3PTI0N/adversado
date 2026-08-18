"use client";

import { useRef, useState } from "react";
import Link from "next/link";

/**
 * The closing statement.
 *
 * The invitation at the end of the About narrative, sized as a final editorial
 * page rather than a footer conversion block. Copy is the approved CTA
 * language and nothing else: "Tell us where it hurts." (Contact hero) as the
 * dominant type, "Start with an audit" as the secondary action.
 *
 * Motion is restrained on purpose — a masked line reveal on arrival, and a
 * cursor-responsive drift of a few pixels. The drift is transform-only, runs
 * off pointer coordinates already being delivered, and is dropped entirely on
 * touch and under reduced motion, so it costs nothing on the devices least
 * able to afford it.
 */

const LINES = ["Tell us where", "it hurts."] as const;

/** Pixels of travel at the extreme edge of the section. Small by intent. */
const DRIFT = 10;

export function AboutCTA() {
  const ref = useRef<HTMLElement>(null);
  const [drift, setDrift] = useState({ x: 0, y: 0 });

  return (
    <section
      ref={ref}
      aria-label="Tell us where it hurts"
      className="relative overflow-hidden px-6 py-28 sm:px-10 sm:py-36 lg:px-16"
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        setDrift({
          x: ((e.clientX - r.left) / r.width - 0.5) * 2 * DRIFT,
          y: ((e.clientY - r.top) / r.height - 0.5) * 2 * DRIFT,
        });
      }}
      onPointerLeave={() => setDrift({ x: 0, y: 0 })}
    >
      <div className="mx-auto max-w-[1500px]">
        <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-cream/40">
          The invitation
        </p>

        {/* Masked line reveal: each line rides up out of its own clipped box,
            which is the one motion the brand book's register can carry without
            looking like an effect. */}
        <h2
          className="mt-10 max-w-[16ch] font-sans text-[clamp(2rem,6vw,4.75rem)] font-light leading-[1.02] tracking-[-0.035em] text-cream"
          style={{
            transform: `translate3d(${drift.x}px, ${drift.y}px, 0)`,
            transition: "transform 700ms cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {LINES.map((line, i) => (
            <span key={line} className="block overflow-hidden pb-[0.06em]">
              <span
                className="block motion-safe:animate-[cta-line_1s_cubic-bezier(0.16,1,0.3,1)_both]"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                {i === LINES.length - 1 ? (
                  <span className="font-serif normal-case italic text-gold">
                    {line}
                  </span>
                ) : (
                  line
                )}
              </span>
            </span>
          ))}
        </h2>

        {/* Line and action on one row — the invitation reads as a sentence
            with its answer beside it, not as a banner with a button under it. */}
        <div className="mt-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <p className="max-w-[30ch] font-serif text-[clamp(0.95rem,1.3vw,1.1rem)] font-light italic leading-[1.7] text-cream/50">
            Every engagement starts with an audit. No exceptions.
          </p>

          <Link
            href="/contact#audit"
            className="group inline-flex shrink-0 items-center gap-3 border border-gold/50 px-7 py-3.5 font-sans text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-gold transition-colors duration-300 hover:bg-gold hover:text-charcoal"
          >
            Start with an audit
            <span
              aria-hidden
              className="transition-transform duration-300 ease-out group-hover:translate-x-2"
            >
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
