"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Lenis smooth scroll, driven off GSAP's ticker rather than its own rAF loop.
 * Two independent loops would let ScrollTrigger read scroll positions a frame
 * behind Lenis's eased value, which shows up as scrubbed animations lagging
 * the page. lagSmoothing(0) stops GSAP from swallowing frames when the tab
 * stalls, which would otherwise desync the two.
 *
 * Paced deliberately slower than stock. Almost everything on this page is
 * scrubbed off scroll position — the camera dolly, the monolith crane, the
 * word-by-word reveal — so scroll speed is really playback speed, and at the
 * default rate a flick of the wheel skips past whole beats. Both knobs move
 * together: `wheelMultiplier` shortens the distance each notch asks for, and
 * `duration` lengthens the glide that carries you there.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.6,
      wheelMultiplier: 0.75,
      // Touch left near stock: the same reduction that reads as "considered"
      // on a wheel reads as unresponsive under a thumb, because the finger is
      // still on the glass expecting the page to track it.
      touchMultiplier: 0.95,
    });
    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
    };
  }, []);

  return null;
}
