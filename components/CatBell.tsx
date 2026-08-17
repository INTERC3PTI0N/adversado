"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The bell easter egg.
 *
 * Ring the bell and the Chief Curiosity Officer turns up. Per the brand book
 * the cat is the mark's hidden figure — curiosity, agility, precision — so it
 * arrives on a fast, quiet rise rather than a bounce, and leaves the moment it
 * is dismissed. It is a reward for poking at the page, not a mascot: nothing
 * about the contact flow depends on it, and it never covers the form.
 *
 * The cat silhouette is the brand asset (`/images/cat.svg`), stencilled through
 * a CSS mask so it can be painted in gold instead of shipping a second file.
 *
 * ponytail: CSS transitions, no animation library — the whole interaction is
 * three transitioned properties and a timeout.
 */

const MESSAGE = "You rang. I'm told I'm the only one here who listens.";

/** Long enough to read the line, short enough that it never overstays. */
const AUTO_DISMISS_MS = 6500;

export function CatBell({ className }: { className?: string }) {
  const [ringing, setRinging] = useState(false);
  const [out, setOut] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    []
  );

  const ring = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];

    setRinging(true);
    timers.current.push(window.setTimeout(() => setRinging(false), 700));

    if (out) {
      setOut(false);
      return;
    }
    setOut(true);
    timers.current.push(window.setTimeout(() => setOut(false), AUTO_DISMISS_MS));
  };

  return (
    <div className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={ring}
        aria-pressed={out}
        className="group inline-flex items-center gap-3 border-b border-cream/20 pb-2 font-sans text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-cream/50 outline-none transition-colors duration-300 hover:border-gold/60 hover:text-gold focus-visible:border-gold focus-visible:text-gold"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className={`h-4 w-4 origin-top transition-transform duration-150 ${
            ringing ? "animate-[catbell-ring_0.7s_ease-in-out]" : ""
          }`}
        >
          <path
            d="M12 3a5.5 5.5 0 0 0-5.5 5.5c0 3.2-.8 5.1-1.6 6.2-.4.6 0 1.3.7 1.3h12.8c.7 0 1.1-.7.7-1.3-.8-1.1-1.6-3-1.6-6.2A5.5 5.5 0 0 0 12 3Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path
            d="M10 19a2 2 0 0 0 4 0"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
        Ring the bell
      </button>

      {/* Announced politely rather than grabbing focus — the reward should not
          interrupt someone filling in the form. */}
      <div
        aria-live="polite"
        className="pointer-events-none absolute bottom-full left-0 mb-5 flex items-end gap-4"
      >
        <span
          aria-hidden
          className={`block h-20 w-[5.5rem] shrink-0 bg-gold transition-all duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] [mask-image:url('/images/cat.svg')] [mask-position:center_bottom] [mask-repeat:no-repeat] [mask-size:contain] motion-reduce:transition-none ${
            out
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-6 opacity-0"
          }`}
        />

        <span
          className={`relative max-w-[22ch] border border-gold/40 bg-charcoal/95 px-4 py-3 font-serif text-[0.95rem] font-light italic leading-[1.5] text-cream/85 transition-all duration-500 ease-out motion-reduce:transition-none ${
            out ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
          }`}
          style={{ transitionDelay: out ? "220ms" : "0ms" }}
        >
          {out ? MESSAGE : ""}
        </span>
      </div>
    </div>
  );
}
