"use client";

import { useEffect, type RefObject } from "react";

/**
 * About full-page scroll.
 * First wheel tick starts the panel move immediately (no debounce / settle wait).
 * Glide is constant-speed — no ease-in ramp.
 */
export function AboutSnap({
  scope,
}: {
  scope: RefObject<HTMLElement | null>;
}) {
  useEffect(() => {
    const root = scope.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let points: number[] = [];
    let index = 0;
    let locked = false;
    let raf = 0;
    let tries = 0;
    let unsub: (() => void) | null = null;
    const timers: number[] = [];
    let ro: ResizeObserver | null = null;

    const measure = () => {
      const ys: number[] = [];
      root.querySelectorAll<HTMLElement>("[data-about-snap]").forEach((el) => {
        const planes = Math.max(
          1,
          Number.parseInt(el.dataset.aboutSnapPlanes || "1", 10) || 1,
        );
        const vh =
          Number.parseFloat(el.dataset.aboutSnapVh || "100") || 100;
        const start = Math.round(
          window.scrollY + el.getBoundingClientRect().top,
        );
        if (planes <= 1) {
          ys.push(start);
          return;
        }
        const step = window.innerHeight * (vh / 100);
        for (let i = 0; i < planes; i++) {
          ys.push(Math.round(start + i * step));
        }
      });
      points = [...new Set(ys)].sort((a, b) => a - b);

      const lenis = window.__lenis;
      const y = lenis?.scroll ?? window.scrollY;
      let nearest = 0;
      let best = Infinity;
      points.forEach((p, i) => {
        const d = Math.abs(p - y);
        if (d < best) {
          best = d;
          nearest = i;
        }
      });
      index = nearest;
    };

    const goTo = (next: number) => {
      const lenis = window.__lenis;
      if (!lenis || locked || points.length === 0) return;
      const clamped = Math.max(0, Math.min(next, points.length - 1));
      if (clamped === index && Math.abs(lenis.scroll - points[clamped]) < 2) {
        return;
      }
      locked = true;
      index = clamped;
      lenis.scrollTo(points[clamped], {
        // Constant velocity — no ramp.
        duration: 0.28,
        easing: (t) => t,
        lock: true,
        force: true,
        programmatic: true,
        onComplete: () => {
          locked = false;
        },
      });
    };

    const onVirtualScroll = ({
      deltaY,
      event,
    }: {
      deltaY: number;
      event: WheelEvent | TouchEvent & { lenisStopPropagation?: boolean };
    }) => {
      if (Math.abs(deltaY) < 1) return;
      // Stop Lenis from also applying this wheel tick as free scroll.
      event.lenisStopPropagation = true;
      if (event.cancelable) event.preventDefault();
      if (locked) return;
      goTo(index + (deltaY > 0 ? 1 : -1));
    };

    const mount = () => {
      const lenis = window.__lenis;
      if (!lenis) {
        if (tries++ < 90) raf = requestAnimationFrame(mount);
        return;
      }

      measure();
      lenis.on("virtual-scroll", onVirtualScroll);
      unsub = () => lenis.off("virtual-scroll", onVirtualScroll);

      ro = new ResizeObserver(() => measure());
      ro.observe(root);
      window.addEventListener("resize", measure);
      timers.push(window.setTimeout(measure, 350));
      timers.push(window.setTimeout(measure, 1200));
    };

    mount();

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener("resize", measure);
      ro?.disconnect();
      unsub?.();
    };
  }, [scope]);

  return null;
}
