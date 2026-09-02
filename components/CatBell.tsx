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

/* Bell partials. A struck bell is not one pitch — it is a fundamental plus a
   few inharmonic overtones that decay faster than it does, which is what stops
   a sine from sounding like a test tone. Ratios are the classic ones. */
const PARTIALS: Array<{ ratio: number; gain: number; decay: number }> = [
  { ratio: 1, gain: 0.5, decay: 1.7 },
  { ratio: 2, gain: 0.28, decay: 1.1 },
  { ratio: 2.4, gain: 0.2, decay: 0.8 },
  { ratio: 3.76, gain: 0.12, decay: 0.5 },
  { ratio: 5.43, gain: 0.07, decay: 0.32 },
];

const FUNDAMENTAL_HZ = 784; // G5 — small desk bell, not a church bell.

export function CatBell({ className }: { className?: string }) {
  const [ringing, setRinging] = useState(false);
  const [out, setOut] = useState(false);
  const timers = useRef<number[]>([]);
  const audio = useRef<AudioContext | null>(null);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      audio.current?.close();
    },
    []
  );

  /* Synthesised rather than shipped as a file: it is five oscillators and an
     envelope, against a network request for an asset that would still need
     licensing. Built lazily on the click — browsers refuse an AudioContext
     created before a gesture, and creating one on mount just to have it
     suspended is how you get a console full of autoplay warnings. */
  const chime = () => {
    try {
      audio.current ??= new AudioContext();
      const ctx = audio.current;
      if (ctx.state === "suspended") void ctx.resume();

      const now = ctx.currentTime;
      const bus = ctx.createGain();
      bus.gain.value = 0.22;
      bus.connect(ctx.destination);

      for (const p of PARTIALS) {
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = FUNDAMENTAL_HZ * p.ratio;

        // Fast attack, exponential decay — the shape of something struck.
        env.gain.setValueAtTime(0.0001, now);
        env.gain.exponentialRampToValueAtTime(p.gain, now + 0.005);
        env.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

        osc.connect(env);
        env.connect(bus);
        osc.start(now);
        osc.stop(now + p.decay + 0.05);
      }
    } catch {
      /* No Web Audio, or the context was refused. The visual still works. */
    }
  };

  const ring = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];

    chime();
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
      {/* A gold bordered button, not a footnote. As a dim underlined caption it
          read as small print and nobody found it — which for the one piece of
          play on the page is the whole thing failing quietly. */}
      <button
        type="button"
        onClick={ring}
        aria-pressed={out}
        className="group inline-flex items-center gap-4 border-2 border-gold bg-gold/10 px-6 py-4 font-sans text-[0.78rem] font-bold uppercase tracking-[0.24em] text-gold outline-none transition-[background-color,color,transform] duration-300 hover:bg-gold hover:text-charcoal focus-visible:bg-gold focus-visible:text-charcoal motion-reduce:transition-none"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className={`h-5 w-5 origin-top transition-transform duration-150 ${
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
