"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

/**
 * Lenis smooth scroll, driven off GSAP's ticker rather than its own rAF loop.
 * Two independent loops would let ScrollTrigger read scroll positions a frame
 * behind Lenis's eased value, which shows up as scrubbed animations lagging
 * the page. lagSmoothing(0) stops GSAP from swallowing frames when the tab
 * stalls, which would otherwise desync the two.
 *
 * Lerp (not a long duration) so the page tracks the wheel under GPU load.
 * Ticker capped at 60 so 120Hz screens don't double the scroll work.
 *
 * Exposed on `window.__lenis` so scroll handoffs can stop the glide and jump
 * instantly when a panel needs an immediate park.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      lerp: 0.28,
      wheelMultiplier: 1.05,
      touchMultiplier: 1,
    });
    window.__lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.fps(60);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      gsap.ticker.fps(0);
      gsap.ticker.lagSmoothing(500, 33);
      if (window.__lenis === lenis) delete window.__lenis;
      lenis.destroy();
    };
  }, []);

  return null;
}
