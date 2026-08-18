"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useNavGround } from "@/components/useNavGround";

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
 * Both source files are the gold mark. Light grounds use `data-nav-light`
 * (Logo Pure Black via `brightness(0)`). Sections with `data-nav-navy` swap
 * in navy assets so the O's white dot stays white — a full-image filter
 * would crush that dot along with the letters.
 */
export function StickyLogo() {
  const [hovered, setHovered] = useState(false);
  /* Ground detection is shared with the menu button (useNavGround) rather than
     duplicated here — both pieces of chrome have to invert on the same frame
     or the header reads as two half-updated elements. */
  const ground = useNavGround();
  const onLight = ground === "light";
  const onNavy = ground === "navy";

  const swap = "opacity 0.5s ease, filter 0.5s ease, transform 0.5s ease";
  const nocatSrc = onNavy ? "/logo_nocat_navy.svg" : "/logo_nocat.svg";
  const catSrc = onNavy ? "/logo_navy.svg" : "/logo.svg";

  return (
    <Link
      href="/"
      aria-label="Adversado — home"
      /* 44px tall for the touch-target floor, pulled up 6px so the wordmark
         itself still sits on the same optical line as before — the mark is
         width-bound under `object-contain`, so the taller box only adds hit
         area, it doesn't scale the logo. */
      className="fixed top-[1.125rem] left-6 z-40 flex h-11 w-40 items-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        filter: onLight && !onNavy ? "brightness(0)" : "none",
        transition: "filter 0.4s ease",
      }}
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
        <Image key={nocatSrc} src={nocatSrc} alt="Adversado" fill priority className="object-contain object-left" />
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
        <Image key={catSrc} src={catSrc} alt="Adversado" fill priority className="object-contain object-left" />
      </span>
    </Link>
  );
}
