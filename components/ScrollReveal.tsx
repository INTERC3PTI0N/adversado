"use client";

import { useRef } from "react";
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
 * keeps the markup and the highlight colours intact. The three tweens are the
 * original's — container rotation, per-word opacity, per-word blur, all
 * scrubbed against the scrollbar — and `useGSAP` scopes the cleanup to this
 * element's own triggers.
 */
export function ScrollReveal({
  children,
  className,
  enableBlur = true,
  baseOpacity = 0.1,
  baseRotation = 0,
  blurStrength = 6,
}: {
  children: React.ReactNode;
  className?: string;
  enableBlur?: boolean;
  baseOpacity?: number;
  baseRotation?: number;
  blurStrength?: number;
}) {
  const ref = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

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

        gsap.fromTo(
          el,
          { transformOrigin: "0% 50%", rotate: baseRotation },
          {
            rotate: 0,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top bottom", end: "bottom bottom", scrub: true },
          }
        );

        gsap.fromTo(
          words,
          { opacity: baseOpacity, willChange: "opacity" },
          {
            opacity: 1,
            ease: "none",
            stagger: 1.5,
            scrollTrigger: { trigger: el, start: "top bottom-=20%", end: "bottom bottom", scrub: true },
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
              scrollTrigger: { trigger: el, start: "top bottom-=20%", end: "bottom bottom", scrub: true },
            }
          );
        }
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <p ref={ref} className={className}>
      {children}
    </p>
  );
}
