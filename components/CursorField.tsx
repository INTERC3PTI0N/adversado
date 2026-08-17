"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

/**
 * The cursor.
 *
 * A spring-followed ring that reads the element under the pointer and changes
 * state for it: it grows and fills over anything interactive, and shows a word
 * when an element declares one via `data-cursor="Read"`. That is what makes a
 * hover feel answered rather than merely styled — the page acknowledges the
 * pointer before the element does.
 *
 * Built on Skiper UI's spring mouse-follow (skiper61, free tier — attribution
 * required, https://skiper-ui.com), imported from `motion/react` since that is
 * the copy of the library already shipped here. Two springs rather than one:
 * the dot tracks tightly so aim stays honest, the ring trails on a softer
 * spring so movement has weight.
 *
 * Never replaces the native cursor. The system cursor stays visible — a custom
 * cursor that hides the real one costs precision on links and form fields for
 * nothing, and breaks the moment JS fails. This only adds a layer on top.
 *
 * Off entirely for touch (no persistent pointer to draw) and reduced motion.
 */

const RING = { mass: 0.14, damping: 14, stiffness: 120 } as const;
const DOT = { mass: 0.05, damping: 18, stiffness: 420 } as const;

const INTERACTIVE = 'a,button,[role="tab"],[role="button"],input,select,textarea,[tabindex]:not([tabindex="-1"])';

export function CursorField() {
  const [on, setOn] = useState(false);
  const [hot, setHot] = useState(false);
  const [label, setLabel] = useState("");
  /* A gold cursor vanishes on the gold and bone spreads. The same
     `data-nav-light` tag the chrome uses marks those grounds, so the cursor
     flips to charcoal over them instead of needing its own detection. */
  const [light, setLight] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, RING);
  const ringY = useSpring(y, RING);
  const dotX = useSpring(x, DOT);
  const dotY = useSpring(y, DOT);

  useEffect(() => {
    // A coarse pointer has no hover to answer, and reduced motion means no
    // spring-trailing anything.
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    setOn(true);

    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);

      const target = e.target as Element | null;
      const el = target?.closest?.(INTERACTIVE) ?? null;
      setHot(Boolean(el));
      setLight(Boolean(target?.closest?.("[data-nav-light]")));
      setLabel(
        (el?.closest("[data-cursor]") as HTMLElement | null)?.dataset.cursor ?? ""
      );
    };
    const leave = () => {
      setHot(false);
      setLabel("");
      x.set(-100);
      y.set(-100);
    };

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    };
  }, [x, y]);

  if (!on) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[200]">
      <motion.div
        style={{ x: ringX, y: ringY }}
        className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2"
      >
        <motion.div
          animate={{
            width: label ? 76 : hot ? 46 : 26,
            height: label ? 76 : hot ? 46 : 26,
            opacity: hot || label ? 1 : 0.5,
            backgroundColor: label
              ? light
                ? "rgba(33,33,33,0.94)"
                : "rgba(230,179,37,0.92)"
              : hot
                ? light
                  ? "rgba(33,33,33,0.14)"
                  : "rgba(230,179,37,0.16)"
                : "rgba(230,179,37,0)",
            borderColor: light
              ? "rgba(33,33,33,0.55)"
              : "rgba(230,179,37,0.7)",
          }}
          transition={{ type: "spring", mass: 0.2, damping: 18, stiffness: 260 }}
          className="flex items-center justify-center rounded-full border"
        >
          {label ? (
            <span
              className={`font-sans text-[0.55rem] font-bold uppercase tracking-[0.16em] ${
                light ? "text-bone" : "text-charcoal"
              }`}
            >
              {label}
            </span>
          ) : null}
        </motion.div>
      </motion.div>

      {/* Tight dot — keeps the pointer's true position readable while the ring
          lags behind it. Hidden when a label is showing, or it prints through
          the filled disc. */}
      <motion.div
        style={{ x: dotX, y: dotY }}
        className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2"
      >
        <motion.span
          animate={{ opacity: label ? 0 : 1, scale: hot ? 0.6 : 1 }}
          transition={{ duration: 0.2 }}
          className={`block h-1.5 w-1.5 rounded-full ${light ? "bg-charcoal" : "bg-gold"}`}
        />
      </motion.div>
    </div>
  );
}
