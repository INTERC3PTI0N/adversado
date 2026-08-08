"use client";

import { useEffect, useState } from "react";

/**
 * Hero scroll cue. Sits in flow directly under the question rather than pinned
 * to the bottom of the viewport — down there it read as page furniture and got
 * lost on a short screen, where the whole point is that it answers "WHY?" by
 * pointing at what's below. Appears a beat after the question has finished
 * typing, and retires itself the moment the visitor actually scrolls, since a
 * hint that outlives its purpose is just clutter.
 *
 * Its space is held from mount and only its opacity changes, so arriving
 * doesn't shove the hero's centred block upward.
 */
export function ScrollHint({ delay = 6900 }: { delay?: number }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    // Only armed once the cue is actually up. Otherwise any scroll during the
    // intro — including the ones the preloader's own scroll lock produces as
    // it releases — retires the hint before it has ever been seen.
    if (!visible) return;
    const onScroll = () => {
      if (window.scrollY > 40) setDismissed(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [visible]);

  return (
    <div
      aria-hidden
      className="pointer-events-none flex flex-col items-center gap-4"
      style={{
        opacity: visible && !dismissed ? 1 : 0,
        transition: "opacity 700ms ease",
      }}
    >
      <span className="text-[clamp(0.85rem,1.6vw,1.15rem)] font-bold uppercase tracking-[0.3em] text-gold/80">
        Scroll
      </span>
      <span className="animate-scroll-hint block">
        <svg width="44" height="30" viewBox="0 0 16 11" fill="none">
          <path
            d="M1.5 1.5 L8 8.5 L14.5 1.5"
            stroke="currentColor"
            className="text-gold/80"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  );
}
