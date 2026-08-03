"use client";

import { useEffect, useState } from "react";

/**
 * Hero scroll cue. Appears a beat after the headline has finished landing —
 * long enough that it reads as "there's more below" rather than competing
 * with the copy — and retires itself the moment the visitor actually
 * scrolls, since a hint that outlives its purpose is just clutter.
 */
export function ScrollHint({ delay = 6900 }: { delay?: number }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 40) setDismissed(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3"
      style={{
        opacity: visible && !dismissed ? 1 : 0,
        transition: "opacity 700ms ease",
      }}
    >
      <span className="text-[0.65rem] uppercase tracking-[0.3em] text-gold/80">Scroll</span>
      <span className="animate-scroll-hint block">
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
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
