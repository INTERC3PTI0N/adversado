"use client";

import React, { useRef, type ReactElement, type ReactNode } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(SplitText, ScrollTrigger, useGSAP);

type CopyRevealProps = {
  children: ReactNode;
  animateOnScroll?: boolean;
  delay?: number;
  className?: string;
};

/**
 * Line-masked reveal from the Codegrid / inspiration-17 pack.
 * Splits child text into lines, then lifts each line into place on scroll.
 */
export function CopyReveal({
  children,
  animateOnScroll = true,
  delay = 0,
  className,
}: CopyRevealProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const splitRefs = useRef<SplitText[]>([]);
  const linesRef = useRef<HTMLElement[]>([]);

  useGSAP(
    () => {
      const root = containerRef.current;
      if (!root) return;

      splitRefs.current = [];
      linesRef.current = [];

      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      const elements = root.hasAttribute("data-copy-wrapper")
        ? (Array.from(root.children) as HTMLElement[])
        : [root];

      elements.forEach((element) => {
        const split = SplitText.create(element, {
          type: "lines",
          mask: "lines",
          linesClass: "copy-line++",
          lineThreshold: 0.1,
        });
        splitRefs.current.push(split);

        const textIndent = window.getComputedStyle(element).textIndent;
        if (textIndent && textIndent !== "0px" && split.lines.length > 0) {
          (split.lines[0] as HTMLElement).style.paddingLeft = textIndent;
          element.style.textIndent = "0";
        }

        linesRef.current.push(...(split.lines as HTMLElement[]));
      });

      if (reduced) {
        gsap.set(linesRef.current, { y: "0%" });
        return () => {
          splitRefs.current.forEach((split) => split.revert());
        };
      }

      gsap.set(linesRef.current, { y: "100%" });

      const animationProps = {
        y: "0%",
        duration: 1,
        stagger: 0.1,
        ease: "power4.out",
        delay,
      };

      if (animateOnScroll) {
        gsap.to(linesRef.current, {
          ...animationProps,
          scrollTrigger: {
            trigger: root,
            // Bottom-anchored chapter type sits low in the viewport; 75%
            // left it masked while already on-screen. Reveal as it enters.
            start: "top 92%",
            once: true,
          },
        });
      } else {
        gsap.to(linesRef.current, animationProps);
      }

      return () => {
        splitRefs.current.forEach((split) => split.revert());
      };
    },
    { dependencies: [animateOnScroll, delay] },
  );

  if (React.Children.count(children) === 1) {
    const child = React.Children.only(children) as ReactElement<{
      ref?: React.Ref<HTMLElement>;
      className?: string;
    }>;
    return React.cloneElement(child, {
      ref: (node: HTMLElement | null) => {
        containerRef.current = node;
        const { ref } = child.props;
        if (typeof ref === "function") ref(node);
        else if (ref && typeof ref === "object") {
          (ref as React.MutableRefObject<HTMLElement | null>).current = node;
        }
      },
      className: [child.props.className, className].filter(Boolean).join(" "),
    });
  }

  return (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      data-copy-wrapper="true"
      className={className}
    >
      {children}
    </div>
  );
}
