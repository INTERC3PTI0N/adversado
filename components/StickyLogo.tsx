"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import gsap from "gsap";

gsap.registerPlugin(ScrollTrigger);

/**
 * Sticky top-left wordmark. `logo_nocat.svg` and `logo.svg` come from
 * different export pipelines (different viewBoxes, wildly different path
 * precision) so there's no shared path structure to interpolate between —
 * a literal `d` morph isn't feasible without redrawing one of the two
 * source files. The "morph" is a crossfade + blur/scale sold as a morph:
 * the outgoing mark softens and shrinks slightly as the incoming one
 * sharpens up from a blur, so the swap reads as one shape resolving into
 * the other rather than a hard cut.
 *
 * Both source files are the gold mark, which disappears entirely over the
 * cream and gold sections. Rather than ship two more SVGs, sections that
 * need it are tagged `data-nav-light` and the mark is knocked to solid
 * black while one is under it — the brand book's "Logo Pure Black"
 * variation, which is exactly the approved treatment for light grounds.
 */
export function StickyLogo() {
  const [hovered, setHovered] = useState(false);
  const [onLight, setOnLight] = useState(false);
  // The countdown holding page carries the wordmark as its own headline.
  const hidden = usePathname() === "/";

  useEffect(() => {
    const sections = document.querySelectorAll("[data-nav-light]");
    if (!sections.length) return;

    const triggers: ScrollTrigger[] = [];
    sections.forEach((el) => {
      triggers.push(
        ScrollTrigger.create({
          trigger: el,
          // The band the logo actually occupies, not the viewport top, so the
          // swap happens as the section passes behind the mark itself.
          start: "top 40px",
          end: "bottom 72px",
          // Recomputed across every trigger rather than trusting this one's
          // own state: on a boundary between two light sections the leaving
          // trigger can fire after the entering one and would otherwise
          // clear the flag that its neighbour just set.
          onToggle: () => setOnLight(triggers.some((t) => t.isActive)),
        })
      );
    });

    return () => triggers.forEach((t) => t.kill());
  }, []);

  if (hidden) return null;

  const swap = "opacity 0.5s ease, filter 0.5s ease, transform 0.5s ease";

  return (
    <Link
      href="/"
      aria-label="Adversado — home"
      /* 44px tall for the touch-target floor, pulled up 6px so the wordmark
         itself still sits on the same optical line as before — the mark is
         width-bound under `object-contain`, so the taller box only adds hit
         area, it doesn't scale the logo.

         Note: `href="/"` is the countdown holding page, not this homepage.
         Left as-is deliberately; it resolves when /home becomes /. */
      className="fixed top-[1.125rem] left-6 z-40 flex h-11 w-40 items-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ filter: onLight ? "brightness(0)" : "none", transition: "filter 0.4s ease" }}
    >
      <span
        className="absolute inset-0"
        style={{
          opacity: hovered ? 0 : 1,
          filter: hovered ? "blur(6px)" : "blur(0px)",
          transform: hovered ? "scale(0.94)" : "scale(1)",
          transition: swap,
        }}
      >
        <Image src="/logo_nocat.svg" alt="Adversado" fill priority className="object-contain object-left" />
      </span>
      <span
        className="absolute inset-0"
        style={{
          opacity: hovered ? 1 : 0,
          filter: hovered ? "blur(0px)" : "blur(6px)",
          transform: hovered ? "scale(1)" : "scale(1.06)",
          transition: swap,
        }}
      >
        <Image src="/logo.svg" alt="Adversado" fill priority className="object-contain object-left" />
      </span>
    </Link>
  );
}
