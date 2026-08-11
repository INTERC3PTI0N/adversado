"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export type DiveStoryLayer = {
  body: string;
};

function renderMarked(body: string) {
  // `*word*` → Merriweather italic · `**phrase**` → bold (both gold)
  const parts = body.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  return parts.map((part, i) => {
    const bold = /^\*\*([^*]+)\*\*$/.exec(part);
    if (bold) {
      return (
        <span key={i} className="font-bold text-gold">
          {bold[1]}
        </span>
      );
    }
    const italic = /^\*([^*]+)\*$/.exec(part);
    if (italic) {
      return (
        <span key={i} className="font-serif font-light italic text-gold">
          {italic[1]}
        </span>
      );
    }
    return (
      <span key={i}>
        {part.split("\n").map((line, li, lines) => (
          <span key={li}>
            {line}
            {li < lines.length - 1 ? <br /> : null}
          </span>
        ))}
      </span>
    );
  });
}

/**
 * Story dive — GSAP pin/scrub of DOM text planes.
 * Same narrative beat as the old WebGL DiveField, without a second GPU context
 * fighting Peach on About.
 */
export function DiveStorySection({
  layers,
  vhPerPlane = 100,
  caption = "Scroll through the planes",
  className = "",
}: {
  layers: DiveStoryLayer[];
  vhPerPlane?: number;
  caption?: string;
  className?: string;
}) {
  const trackRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const track = trackRef.current;
      const pin = pinRef.current;
      const stack = stackRef.current;
      if (!track || !pin || !stack || layers.length === 0) return;

      const planes = gsap.utils.toArray<HTMLElement>(
        stack.querySelectorAll("[data-dive-plane]"),
      );
      if (!planes.length) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(planes, { clearProps: "all" });
        gsap.set(planes, { opacity: 0, scale: 1, y: 0, z: 0 });
        gsap.set(planes[planes.length - 1], { opacity: 1 });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Deep tunnel: far planes sit well back on Z, exit rushes past the camera.
        gsap.set(planes, {
          opacity: 0,
          scale: 0.42,
          z: -520,
          y: 0,
          transformPerspective: 1400,
          transformOrigin: "50% 50%",
          force3D: true,
        });
        gsap.set(planes[0], { opacity: 1, scale: 1, z: 0 });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: track,
            start: "top top",
            end: () =>
              `+=${Math.max(1, layers.length - 1) * window.innerHeight * (vhPerPlane / 100)}`,
            scrub: 0.12,
            pin,
            // overflow-x-hidden on SitePage forces transform pins.
            pinType: "transform",
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        for (let i = 1; i < planes.length; i++) {
          const prev = planes[i - 1];
          const next = planes[i];
          const at = i - 1;
          tl.to(
            prev,
            { opacity: 0, scale: 1.55, z: 380, duration: 1 },
            at,
          ).fromTo(
            next,
            { opacity: 0, scale: 0.42, z: -520 },
            { opacity: 1, scale: 1, z: 0, duration: 1 },
            at,
          );
        }

        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
        };
      });

      return () => mm.revert();
    },
    { dependencies: [layers, vhPerPlane], revertOnUpdate: true },
  );

  const runway = Math.max(1, layers.length - 1) * vhPerPlane + 100;

  return (
    <section
      ref={trackRef}
      className={`relative w-full ${className}`.trim()}
      style={{ height: `${runway}svh` }}
      aria-label="The Story"
    >
      <div
        ref={pinRef}
        className="relative z-[1] flex h-[100svh] w-full items-center justify-center px-6 sm:px-10 lg:px-16"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[#06040a]/55"
        />

        <div
          ref={stackRef}
          className="relative z-[1] mx-auto w-full max-w-5xl text-center [perspective:1400px] [transform-style:preserve-3d]"
        >
          {layers.map((layer, i) => (
            <p
              key={i}
              data-dive-plane
              className="absolute inset-x-0 top-1/2 w-full -translate-y-1/2 font-sans text-[clamp(1.35rem,3.4vw,2.75rem)] font-extrabold leading-[1.2] tracking-[-0.03em] text-cream will-change-transform [transform-style:preserve-3d]"
              style={{ zIndex: layers.length - i }}
            >
              {renderMarked(layer.body)}
            </p>
          ))}
          {/* Spacer so absolute stack has a layout box */}
          <p
            aria-hidden
            className="invisible font-sans text-[clamp(1.35rem,3.4vw,2.75rem)] font-extrabold leading-[1.2] tracking-[-0.03em]"
          >
            {renderMarked(layers[0]?.body ?? "")}
          </p>
        </div>

        {caption ? (
          <p className="pointer-events-none absolute bottom-6 left-1/2 z-[2] -translate-x-1/2 text-center text-[0.65rem] uppercase tracking-[0.28em] text-cream/45">
            {caption}
          </p>
        ) : null}
      </div>
    </section>
  );
}
