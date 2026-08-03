"use client";

import { useEffect, type RefObject, type DependencyList } from "react";
import { animate, motionValue } from "motion/react";

/**
 * The "block reveal" from the Codegrid LandoNorris text animation: each word
 * sits under a solid block. The block scales in from the left to cover the
 * word, then — origin flipped to the right — scales back out, uncovering it.
 * Net effect: a colour wipes across each word instead of it just fading in.
 *
 * Runs once per mount against any `[data-reveal-text]` / `[data-reveal-block]`
 * pairs found inside `containerRef`, in DOM order, staggered. One motion value
 * per word drives both halves (0→1 cover, 1→2 uncover) so the origin flip and
 * word opacity can be written imperatively at the right instant — the same
 * motionValue + manual-DOM-write pattern used in Preloader, needed here too
 * since `transform-origin` isn't something animate() can flip mid-tween.
 */
export function useBlockReveal(
  containerRef: RefObject<HTMLElement | null>,
  { delay = 0, stagger = 0.1, duration = 0.5 }: { delay?: number; stagger?: number; duration?: number } = {},
  deps: DependencyList = []
) {
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const wordEls = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal-text]"));
    const blockEls = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal-block]"));

    const apply = (word: HTMLElement, block: HTMLElement) => (v: number) => {
      if (v <= 1) {
        block.style.transformOrigin = "left center";
        block.style.transform = `scaleX(${v})`;
        word.style.opacity = "0";
      } else {
        block.style.transformOrigin = "right center";
        block.style.transform = `scaleX(${2 - v})`;
        word.style.opacity = "1";
      }
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      wordEls.forEach((w) => (w.style.opacity = "1"));
      blockEls.forEach((b) => (b.style.transform = "scaleX(0)"));
      return;
    }

    const progresses = wordEls.map(() => motionValue(0));
    const unsubs = progresses.map((p, i) => p.on("change", apply(wordEls[i], blockEls[i])));
    progresses.forEach((p, i) => apply(wordEls[i], blockEls[i])(0));

    const controls = progresses.map((p, i) =>
      animate(p, [0, 1, 2], {
        duration: duration * 2,
        times: [0, 0.5, 1],
        ease: [0.76, 0, 0.24, 1],
        delay: delay + i * stagger,
      })
    );

    return () => {
      controls.forEach((c) => c.stop());
      unsubs.forEach((u) => u());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
