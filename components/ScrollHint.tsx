"use client";

import { useEffect, useState } from "react";

/**
 * Hero scroll cue, pinned to the foot of the section.
 *
 * Deliberately small and low-contrast: at its previous size, sitting directly
 * under the headline, it read as a button — something to click rather than an
 * instruction to keep going. Now it is a caption at the bottom edge, which is
 * where a scroll cue is expected and where it competes with nothing.
 *
 * Appears a beat after the question has finished typing and stays once up, so
 * scrolling back to the hero still finds it.
 */
export function ScrollHint({ delay = 6900 }: { delay?: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      aria-hidden
      className="pointer-events-none flex flex-col items-center gap-2"
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 700ms ease",
      }}
    >
      <span className="font-sans text-[0.62rem] font-medium uppercase tracking-[0.3em] text-cream/40">
        Keep scrolling
      </span>
      <span className="animate-scroll-hint block">
        <svg width="20" height="14" viewBox="0 0 16 11" fill="none">
          <path
            d="M1.5 1.5 L8 8.5 L14.5 1.5"
            stroke="currentColor"
            className="text-cream/35"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  );
}
