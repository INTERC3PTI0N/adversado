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
      data-nav-navy
      className="relative overflow-hidden bg-navy px-6 py-40 sm:px-10 sm:py-56 lg:px-16"
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
        <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-gold">
          The invitation
        </p>

        {/* Masked line reveal: each line rides up out of its own clipped box,
            which is the one motion the brand book's register can carry without
            looking like an effect. */}
        <h2
          className="mt-14 font-sans text-[clamp(2.75rem,11vw,9.5rem)] font-light uppercase leading-[0.9] tracking-[-0.045em] text-cream"
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

        <div className="mt-24 flex flex-col gap-10 border-t border-cream/20 pt-12 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-[34ch] font-serif text-[clamp(1rem,1.4vw,1.2rem)] font-light italic leading-[1.7] text-cream/65">
            Every engagement starts with an audit. No exceptions.
          </p>

          <Link
            href="/contact#audit"
            className="group inline-flex shrink-0 items-center gap-5 bg-gold px-10 py-5 font-sans text-[0.75rem] font-semibold uppercase tracking-[0.26em] text-charcoal transition-colors duration-300 hover:bg-cream"
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
