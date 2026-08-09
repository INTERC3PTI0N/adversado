"use client";

import { useEffect, useState } from "react";

/**
 * Types text out a character at a time, taking a beat at punctuation — a
 * breath on a comma, a longer stop on a full stop — so the line lands with
 * the cadence of someone speaking it rather than a uniform machine rattle.
 *
 * The full string is rendered twice: once invisibly to hold the space the
 * finished sentence will occupy, and once over the top as it types. Without
 * the spacer the paragraph gains a line mid-animation and shunts everything
 * below it down the page. Assistive tech reads the real sentence from a
 * screen-reader-only copy instead of watching it assemble.
 */
export function Typewriter({
  text,
  delay = 0,
  speed = 26,
  commaPause = 260,
  stopPause = 480,
  /** Keep the caret blinking after the line has finished typing. */
  persistCaret = false,
  className,
}: {
  text: string;
  delay?: number;
  speed?: number;
  commaPause?: number;
  stopPause?: number;
  persistCaret?: boolean;
  className?: string;
}) {
  const [shown, setShown] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      timer = setTimeout(() => {
        setShown(text.length);
        setDone(true);
      }, 0);
      return () => clearTimeout(timer);
    }

    let i = 0;
    const step = () => {
      i += 1;
      setShown(i);
      if (i >= text.length) {
        setDone(true);
        return;
      }
      const justTyped = text[i - 1];
      const wait =
        justTyped === "." ? stopPause : justTyped === "," ? commaPause : speed;
      timer = setTimeout(step, wait);
    };

    timer = setTimeout(step, delay);
    return () => clearTimeout(timer);
  }, [text, delay, speed, commaPause, stopPause]);

  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden className={`relative inline-block ${className ?? ""}`}>
        <span className="invisible">{text}</span>
        <span className="absolute inset-0">
          {text.slice(0, shown)}
          {(!done || persistCaret) && <span className="caret text-gold">|</span>}
        </span>
      </span>
    </>
  );
}
