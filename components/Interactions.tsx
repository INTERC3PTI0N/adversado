"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Has this element been near the viewport yet?
 *
 * Every shader on this site costs a WebGL context, and browsers hand out
 * about sixteen per page before they start killing the oldest one to make
 * room. This page was asking for twenty: the preloader alone holds ten (silk,
 * event horizon, globe, one per headline word, then the tunnel) while every
 * shader further down the page was already running behind it, unseen. The
 * casualties were whichever contexts were created first — the preloader's own
 * background, which is why it came up blank.
 *
 * Gating on visibility fixes it at the root: a shader that cannot be seen has
 * no reason to hold a context. Latches on rather than toggling, so scrolling
 * back and forth doesn't tear scenes down and rebuild them — the aim is to
 * stagger creation, not to churn it.
 */
export function useNearViewport<T extends HTMLElement>(rootMargin = "300px") {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    // No IntersectionObserver shouldn't mean no visuals — fall back to showing
    // everything. Deferred a frame rather than set straight away: a synchronous
    // setState in an effect body is a cascading render, and the initial value
    // has to stay `false` on both sides or SSR and hydration disagree about
    // what was rendered.
    if (typeof IntersectionObserver === "undefined") {
      const id = requestAnimationFrame(() => setSeen(true));
      return () => cancelAnimationFrame(id);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setSeen(true);
      },
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen, rootMargin]);

  return [ref, seen] as const;
}

/**
 * Magnetic pull — the element drifts toward the cursor once it's within
 * reach, then springs back. Measured from the element's edge rather than
 * its centre so a wide button doesn't feel dead at its ends.
 */
export function useMagnetic<T extends HTMLElement>({
  strength = 0.35,
  radius = 90,
}: { strength?: number; radius?: number } = {}) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" });

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const reach = Math.hypot(dx, dy) - Math.max(r.width, r.height) / 2;
      if (reach < radius) {
        xTo(dx * strength);
        yTo(dy * strength);
      } else {
        xTo(0);
        yTo(0);
      }
    };

    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      gsap.set(el, { x: 0, y: 0 });
    };
  }, [strength, radius]);

  return ref;
}

/**
 * Publishes the pointer's position within the element as `--mx`/`--my`, for
 * effects that only need a light source to follow the cursor. Written
 * straight to the style attribute rather than through React state so the
 * gesture never costs a re-render.
 */
export function useCursorVars<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Window-bound rather than element-bound: this layer usually sits behind
    // the section's copy, and an element listener would stop firing the
    // moment the pointer crossed a heading.
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
      el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
    };

    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return ref;
}

/**
 * Cursor-tracked 3D tilt. Also publishes the pointer position as `--mx`/`--my`
 * so the card can hang a light source off the same gesture without a second
 * listener.
 */
export function useTilt<T extends HTMLElement>(max = 7) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    gsap.set(el, { transformPerspective: 900, transformOrigin: "center" });
    const rx = gsap.quickTo(el, "rotationX", { duration: 0.6, ease: "power3.out" });
    const ry = gsap.quickTo(el, "rotationY", { duration: 0.6, ease: "power3.out" });

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      rx(-(py - 0.5) * max * 2);
      ry((px - 0.5) * max * 2);
      el.style.setProperty("--mx", `${px * 100}%`);
      el.style.setProperty("--my", `${py * 100}%`);
    };
    const onLeave = () => {
      rx(0);
      ry(0);
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      gsap.set(el, { rotationX: 0, rotationY: 0 });
    };
  }, [max]);

  return ref;
}

/**
 * Letters shoulder away from the cursor and settle back — a gravity field
 * with the sign flipped. Words stay in their own inline-block so a repelled
 * character can't drag a line break with it.
 */
export function RepelText({
  text,
  className,
  radius = 130,
  strength = 22,
}: {
  text: string;
  className?: string;
  radius?: number;
  strength?: number;
}) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const words = text.split(" ");

  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;

    const chars = Array.from(root.querySelectorAll<HTMLElement>("[data-char]"));
    const setters = chars.map((c) => ({
      x: gsap.quickTo(c, "x", { duration: 0.7, ease: "power3.out" }),
      y: gsap.quickTo(c, "y", { duration: 0.7, ease: "power3.out" }),
    }));

    // Rest positions are cached rather than measured per pointer move: 30-odd
    // getBoundingClientRect reads per event would thrash layout, and they'd
    // report the displaced positions anyway, so the effect would feed on
    // itself and the letters would never come home. offsetLeft/Top are
    // untouched by transforms, and the root is the offsetParent.
    let base: { x: number; y: number }[] = [];
    const measure = () => {
      base = chars.map((c) => ({
        x: c.offsetLeft + c.offsetWidth / 2,
        y: c.offsetTop + c.offsetHeight / 2,
      }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);

    const onMove = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      for (let i = 0; i < chars.length; i++) {
        const dx = r.left + base[i].x - e.clientX;
        const dy = r.top + base[i].y - e.clientY;
        const dist = Math.hypot(dx, dy) || 1;
        const f = Math.max(0, 1 - dist / radius);
        setters[i].x((dx / dist) * f * strength);
        setters[i].y((dy / dist) * f * strength);
      }
    };

    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      ro.disconnect();
      gsap.set(chars, { x: 0, y: 0 });
    };
  }, [text, radius, strength]);

  return (
    <span ref={rootRef} className={`relative inline-block ${className ?? ""}`}>
      {words.map((word, wi) => (
        <span key={wi} className="inline-block whitespace-nowrap">
          {Array.from(word).map((ch, ci) => (
            <span key={ci} data-char className="inline-block">
              {ch}
            </span>
          ))}
          {wi < words.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </span>
  );
}
