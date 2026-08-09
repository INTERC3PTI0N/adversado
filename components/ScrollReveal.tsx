"use client";

import { useRef, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Scroll-scrubbed word reveal (react-bits ScrollReveal), rebuilt rather than
 * vendored. Two reasons the upstream file could not be dropped in as-is:
 *
 *   - It takes its text as a string (`typeof children === 'string'`) and
 *     silently renders nothing else, so the gold emphasis spans inside this
 *     paragraph would have been thrown away.
 *   - Its cleanup runs `ScrollTrigger.getAll().forEach(t => t.kill())`, which
 *     kills every trigger on the page — the cinematic dolly, the monolith
 *     crane, the Six Ds rail, every box reveal. Fine in a demo that owns the
 *     whole page; not fine here.
 *
 * So the words are split out of the live DOM instead: a TreeWalker wraps each
 * word in its own span wherever it sits, including inside `<Hit>`, which
 * keeps the markup and the highlight colours intact.
 *
 * Default is scrollbar-scrubbed. Pass `scrub={false}` with a bumping `playId`
 * to replay from a parent ScrollTrigger when a section re-enters — the finished
 * state is left alone between plays so a wipe cannot blank the copy.
 */
export function ScrollReveal({
  children,
  className,
  enableBlur = true,
  baseOpacity = 0.1,
  baseRotation = 0,
  blurStrength = 6,
  containerRef,
  start = "top bottom",
  end = "bottom bottom",
  scrub = true,
  /** When `scrub` is false: each bump replays from the start. `0` = idle. */
  playId = 0,
}: {
  children: React.ReactNode;
  className?: string;
  enableBlur?: boolean;
  baseOpacity?: number;
  baseRotation?: number;
  blurStrength?: number;
  /** When set, scrub progress is measured against this element instead of the paragraph. */
  containerRef?: RefObject<HTMLElement | null>;
  start?: string;
  end?: string;
  /** `false` plays from `playId` bumps instead of scrubbing the scrollbar. */
  scrub?: boolean;
  playId?: number;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const trigger = containerRef?.current ?? el;

      // Idempotent: a second pass would wrap the wrappers.
      if (!el.querySelector("[data-word]")) {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        const texts: Text[] = [];
        while (walker.nextNode()) texts.push(walker.currentNode as Text);

        for (const node of texts) {
          const parts = (node.textContent ?? "").split(/(\s+)/);
          if (parts.length < 2 && !parts[0]?.trim()) continue;
          const frag = document.createDocumentFragment();
          for (const part of parts) {
            if (!part) continue;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(part));
              continue;
            }
            const span = document.createElement("span");
            span.dataset.word = "";
            // Needed for the blur and any transform to apply per word, and
            // it keeps each word an unbreakable unit when the line wraps.
            span.style.display = "inline-block";
            span.textContent = part;
            frag.appendChild(span);
          }
          node.parentNode?.replaceChild(frag, node);
        }
      }

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const words = el.querySelectorAll("[data-word]");

        if (!scrub) {
          gsap.set(el, { transformOrigin: "0% 50%", rotate: baseRotation });
          gsap.set(words, {
            opacity: baseOpacity,
            ...(enableBlur ? { filter: `blur(${blurStrength}px)` } : null),
          });

          const tl = gsap.timeline({ paused: true });
          tl.to(el, { rotate: 0, duration: 0.55, ease: "power2.out" }, 0);
          tl.to(
            words,
            {
              opacity: 1,
              filter: "blur(0px)",
              duration: 0.45,
              stagger: 0.035,
              ease: "power2.out",
            },
            0.05
          );
          tlRef.current = tl;
          if (playId > 0) tl.play(0);
          return () => {
            tl.kill();
            tlRef.current = null;
          };
        }

        gsap.fromTo(
          el,
          { transformOrigin: "0% 50%", rotate: baseRotation },
          {
            rotate: 0,
            ease: "none",
            scrollTrigger: { trigger, start, end, scrub: true },
          }
        );

        gsap.fromTo(
          words,
          { opacity: baseOpacity, willChange: "opacity" },
          {
            opacity: 1,
            ease: "none",
            stagger: 1.5,
            scrollTrigger: {
              trigger,
              start: start.includes("bottom") ? "top bottom-=20%" : start,
              end,
              scrub: true,
            },
          }
        );

        if (enableBlur) {
          gsap.fromTo(
            words,
            { filter: `blur(${blurStrength}px)` },
            {
              filter: "blur(0px)",
              ease: "none",
              stagger: 0.05,
              scrollTrigger: {
                trigger,
                start: start.includes("bottom") ? "top bottom-=20%" : start,
                end,
                scrub: true,
              },
            }
          );
        }
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(el, { clearProps: "transform" });
        gsap.set(el.querySelectorAll("[data-word]"), {
          clearProps: "opacity,filter",
        });
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [scrub, start, end] }
  );

  useGSAP(
    () => {
      if (scrub || playId <= 0) return;
      const tl = tlRef.current;
      if (!tl) return;
      // Replay from the start on each enter. Never reverse/clear on leave —
      // the finished line stays until the next playId bump.
      tl.play(0);
    },
    { dependencies: [playId, scrub] }
  );

  return (
    <p ref={ref} className={className}>
      {children}
    </p>
  );
}
