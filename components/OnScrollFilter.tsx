"use client";

import { useRef } from "react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import "./OnScrollFilter.css";

gsap.registerPlugin(Flip, ScrollTrigger, useGSAP);

export type OnScrollFilterItem = {
  up: string;
  down: string;
  text: string;
  layout: 1 | 2 | 3 | 4;
};

export type OnScrollFilterProps = {
  items: readonly OnScrollFilterItem[];
  eyebrow?: string;
  className?: string;
};

type MaskKind = "circle" | "path";

const PANEL: Record<
  1 | 2 | 3 | 4,
  {
    w: number;
    h: number;
    mask: MaskKind;
    final: string;
    imgClass: string;
    src: string;
  }
> = {
  1: {
    w: 896,
    h: 1344,
    mask: "circle",
    final: "820",
    imgClass: "osf-img--1",
    src: "/storyset/1.svg",
  },
  2: {
    w: 1000,
    h: 450,
    mask: "circle",
    final: "950",
    imgClass: "osf-img--2",
    src: "/storyset/2.svg",
  },
  3: {
    w: 1000,
    h: 560,
    mask: "path",
    final: "M 0 280 Q 500 800 1000 280 Q 500 -200 0 280",
    imgClass: "osf-img--3",
    src: "/storyset/3.svg",
  },
  4: {
    w: 1400,
    h: 560,
    mask: "circle",
    final: "770",
    imgClass: "osf-img--4",
    src: "/storyset/4.svg",
  },
};

function FilterPanel({
  id,
  layout,
}: {
  id: string;
  layout: 1 | 2 | 3 | 4;
}) {
  const cfg = PANEL[layout];
  const maskId = `${id}-mask`;

  return (
    <svg
      className={`osf-img ${cfg.imgClass}`}
      width={cfg.w}
      height={cfg.h}
      viewBox={`0 0 ${cfg.w} ${cfg.h}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <mask id={maskId}>
          {cfg.mask === "circle" ? (
            <circle
              className="osf-mask"
              cx="50%"
              cy="50%"
              r="0"
              data-value-final={cfg.final}
              fill="white"
            />
          ) : (
            <path
              className="osf-mask"
              d="M 0 280 Q 500 280 1000 280 Q 500 280 0 280"
              data-value-final={cfg.final}
              fill="white"
            />
          )}
        </mask>
      </defs>
      <image
        className="osf-panel"
        href={cfg.src}
        width={cfg.w}
        height={cfg.h}
        preserveAspectRatio="xMidYMid slice"
        mask={`url(#${maskId})`}
      />
    </svg>
  );
}

/**
 * Codrops On-Scroll Filter Effect — Flip title reflow + SVG mask reveal.
 * Brand adaptation: Storyset illustrations behind the mask (no turbulence).
 */
export function OnScrollFilter({
  items,
  eyebrow = "How we're different",
  className = "",
}: OnScrollFilterProps) {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const wraps = root.querySelectorAll<HTMLElement>("[data-osf-item]");
      const restores: Array<() => void> = [];

      wraps.forEach((wrap) => {
        const titleWrap = wrap.querySelector<HTMLElement>(".osf-title-wrap");
        const titleUp = wrap.querySelector<HTMLElement>(".osf-title--up");
        const titleDown = wrap.querySelector<HTMLElement>(".osf-title--down");
        const layout = wrap.querySelector<HTMLElement>(".osf-content--layout");
        const mask = wrap.querySelector<SVGElement>(".osf-mask");
        const panel = wrap.querySelector<SVGImageElement>(".osf-panel");

        if (
          !titleWrap ||
          !titleUp ||
          !titleDown ||
          !layout ||
          !mask ||
          !panel
        ) {
          return;
        }

        const isCircle = mask.tagName.toLowerCase() === "circle";
        const final = mask.getAttribute("data-value-final") || "";
        const initialAttr = isCircle
          ? mask.getAttribute("r") || "0"
          : mask.getAttribute("d") || "";

        restores.push(() => {
          titleWrap.append(titleUp, titleDown);
          if (isCircle) mask.setAttribute("r", initialAttr);
          else mask.setAttribute("d", initialAttr);
          gsap.set([titleUp, titleDown, panel], { clearProps: "all" });
        });

        if (reduced) {
          layout.prepend(titleUp, titleDown);
          if (isCircle) mask.setAttribute("r", final);
          else mask.setAttribute("d", final);
          gsap.set(panel, { filter: "brightness(88%)" });
          return;
        }

        const flipstate = Flip.getState([titleUp, titleDown]);
        layout.prepend(titleUp, titleDown);

        const flip = Flip.from(flipstate, {
          ease: "none",
          simple: true,
        })
          .fromTo(
            mask,
            {
              attr: isCircle
                ? { r: initialAttr }
                : { d: initialAttr },
            },
            {
              ease: "none",
              attr: isCircle ? { r: final } : { d: final },
            },
            0,
          )
          .fromTo(
            panel,
            {
              transformOrigin: "50% 50%",
              filter: "brightness(72%)",
            },
            {
              ease: "none",
              scale: isCircle ? 1.15 : 1,
              filter: "brightness(88%)",
            },
            0,
          );

        ScrollTrigger.create({
          trigger: titleWrap,
          start: "clamp(top bottom-=10%)",
          end: "+=40%",
          scrub: true,
          animation: flip,
        });
      });

      return () => {
        restores.forEach((fn) => fn());
      };
    },
    { scope: rootRef, dependencies: [items] },
  );

  return (
    <section
      ref={rootRef}
      className={`osf relative ${className}`.trim()}
      aria-label={eyebrow}
    >
      <div className="mx-auto max-w-[1500px] px-6 pt-10 sm:px-10 sm:pt-12 lg:px-16">
        <p className="text-sm uppercase tracking-[0.35em] text-gold">{eyebrow}</p>
      </div>

      {items.map((item, i) => (
        <div
          key={`${item.up}-${item.down}`}
          className="osf-wrap"
          data-osf-item
          data-about-snap
        >
          <div className="osf-content">
            <div className="osf-title-wrap">
              <span className="osf-title osf-title--up">{item.up}</span>
              <span className="osf-title osf-title--down">{item.down}</span>
            </div>
          </div>
          <div
            className={`osf-content osf-content--layout osf-content--layout-${item.layout}`}
          >
            <FilterPanel id={`osf-${i}`} layout={item.layout} />
            <p className="osf-text">{item.text}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

export default OnScrollFilter;
