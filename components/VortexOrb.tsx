"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * Archive orb portal: luminous navy+gold sphere with float, mouse parallax,
 * swirling aurora, and a feathery dive hole that opens onto the scene behind.
 */
export function VortexOrb({
  scale = 1,
  rotate = 0,
  holeScale = 0,
  opacity = 1,
  className,
}: {
  scale?: number;
  rotate?: number;
  holeScale?: number;
  opacity?: number;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const id = (name: string) => `${uid}-${name}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const [mx, setMx] = useState(0);
  const [my, setMy] = useState(0);
  const [warp, setWarp] = useState(0);
  const aim = useRef({ x: 0, y: 0, warp: 0 });
  const cur = useRef({ x: 0, y: 0, warp: 0 });

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let raf = 0;
    const tick = () => {
      cur.current.x += (aim.current.x - cur.current.x) * 0.08;
      cur.current.y += (aim.current.y - cur.current.y) * 0.08;
      cur.current.warp += (aim.current.warp - cur.current.warp) * 0.1;
      setMx(cur.current.x);
      setMy(cur.current.y);
      setWarp(cur.current.warp);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onMove = (e: PointerEvent) => {
      aim.current.x = e.clientX / window.innerWidth - 0.5;
      aim.current.y = e.clientY / window.innerHeight - 0.5;
      const el = rootRef.current;
      if (!el) {
        aim.current.warp = 0;
        return;
      }
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
      const reach = Math.max(r.width, r.height) * 0.72;
      aim.current.warp = Math.max(0, 1 - dist / reach);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  const glossX = 380 + mx * 40;
  const glossY = 300 + my * 36;
  // Soft liquid warp — only when the pointer is near the orb.
  const warpScale = warp * 42;

  return (
    <div
      ref={rootRef}
      aria-hidden
      className={className}
      style={{
        opacity,
        transform: `translate3d(${mx * 36}px, ${my * 36}px, 0) scale(${scale})`,
        transformOrigin: "center center",
        willChange: "transform, opacity",
      }}
    >
      <div className="pl-orb-float relative h-full w-full">
        <div className="pl-orb relative h-full w-full overflow-hidden rounded-full">
          <svg
            className="block h-full w-full"
            viewBox="0 0 1000 1000"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <filter
                id={id("wisp")}
                x="-40%"
                y="-40%"
                width="180%"
                height="180%"
                colorInterpolationFilters="sRGB"
              >
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.02"
                  numOctaves="5"
                  seed="7"
                  result="noise"
                >
                  <animate
                    attributeName="baseFrequency"
                    dur="24s"
                    values="0.018;0.026;0.017;0.018"
                    repeatCount="indefinite"
                  />
                </feTurbulence>
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="noise"
                  scale="120"
                  xChannelSelector="R"
                  yChannelSelector="G"
                />
                <feGaussianBlur stdDeviation="4" />
              </filter>

              {/* Pointer-driven liquid warp across the whole sphere. */}
              <filter
                id={id("warp")}
                x="-20%"
                y="-20%"
                width="140%"
                height="140%"
                colorInterpolationFilters="sRGB"
              >
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.018"
                  numOctaves="3"
                  seed="3"
                  result="warpNoise"
                >
                  <animate
                    attributeName="baseFrequency"
                    dur="8s"
                    values="0.014;0.022;0.014"
                    repeatCount="indefinite"
                  />
                </feTurbulence>
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="warpNoise"
                  scale={warpScale}
                  xChannelSelector="R"
                  yChannelSelector="G"
                />
              </filter>

              {/* Nacre base — a bright pearl that stays luminous out to the
                  edge (the Fresnel rim below defines the sphere, not a dark
                  vignette), gold-warm above melting into periwinkle below. */}
              <radialGradient id={id("orbDeep")} cx="38%" cy="32%" r="78%">
                <stop offset="0%" stopColor="#faf1d4" />
                <stop offset="22%" stopColor="#efd287" />
                <stop offset="46%" stopColor="#d6def3" />
                <stop offset="70%" stopColor="#a7bbe4" />
                <stop offset="90%" stopColor="#7590c6" />
                <stop offset="100%" stopColor="#5f7cb4" />
              </radialGradient>
              {/* Iridescent nacre patches — the faint oil-slick hue shifts a
                  pearl carries: lavender, ice and a whisper of blush. */}
              <radialGradient id={id("iridLav")} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#c9c2ef" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#c9c2ef" stopOpacity="0" />
              </radialGradient>
              <radialGradient id={id("iridIce")} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#cfe6f8" stopOpacity="0.42" />
                <stop offset="100%" stopColor="#cfe6f8" stopOpacity="0" />
              </radialGradient>
              <radialGradient id={id("iridRose")} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ecc9d8" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#ecc9d8" stopOpacity="0" />
              </radialGradient>
              {/* Broad luster arc across the crown of the pearl. */}
              <radialGradient id={id("sheen")} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fdf8ea" stopOpacity="0.3" />
                <stop offset="60%" stopColor="#fdf8ea" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#fdf8ea" stopOpacity="0" />
              </radialGradient>
              <radialGradient id={id("goldHi")} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f2d78e" stopOpacity="0.45" />
                <stop offset="40%" stopColor="#e0bd58" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#e6b325" stopOpacity="0" />
              </radialGradient>
              <radialGradient id={id("blueLo")} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#bfd0f2" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#7d9dda" stopOpacity="0.38" />
                <stop offset="100%" stopColor="#3a5a9e" stopOpacity="0" />
              </radialGradient>
              <radialGradient id={id("auroraGold")} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#e6b325" stopOpacity="0.42" />
                <stop offset="100%" stopColor="#e6b325" stopOpacity="0" />
              </radialGradient>
              <radialGradient id={id("auroraLight")} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#d7e1f5" stopOpacity="0.36" />
                <stop offset="100%" stopColor="#d7e1f5" stopOpacity="0" />
              </radialGradient>
              <radialGradient id={id("gloss")} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f9ecce" stopOpacity="0.3" />
                <stop offset="70%" stopColor="#f9ecce" stopOpacity="0" />
              </radialGradient>
              {/* Fresnel rim-light — the pearl signature: the edge glows
                  brighter than the surface just inside it, like backlit
                  nacre. Stops tuned for the 1160-unit overshoot box, where
                  the visible circle edge sits at ~86% of this radius. */}
              <radialGradient id={id("rim")} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#e9effd" stopOpacity="0" />
                <stop offset="72%" stopColor="#e9effd" stopOpacity="0" />
                <stop offset="81%" stopColor="#e9effd" stopOpacity="0.2" />
                <stop offset="86%" stopColor="#f4f7ff" stopOpacity="0.5" />
                <stop offset="93%" stopColor="#f4f7ff" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#e9effd" stopOpacity="0.35" />
              </radialGradient>
              <radialGradient id={id("cloudGrad")} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffd24a" stopOpacity="0" />
                <stop offset="34%" stopColor="#e6b325" stopOpacity="0.14" />
                <stop offset="70%" stopColor="#8eb0ef" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#8eb0ef" stopOpacity="0" />
              </radialGradient>
              <radialGradient id={id("holeGrad")} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#000" stopOpacity="1" />
                <stop offset="46%" stopColor="#000" stopOpacity="1" />
                <stop offset="100%" stopColor="#000" stopOpacity="0" />
              </radialGradient>

              <mask
                id={id("punch")}
                maskUnits="userSpaceOnUse"
                maskContentUnits="userSpaceOnUse"
                // SVG masks default to luminance; React's SVG typings omit maskType.
                style={{ maskType: "luminance" }}
              >
                <rect x="-200" y="-200" width="1400" height="1400" fill="#fff" />
                <g
                  transform={`translate(500 500) scale(${holeScale}) rotate(${rotate}) translate(-500 -500)`}
                >
                  <circle
                    cx="500"
                    cy="500"
                    r="420"
                    fill={`url(#${id("holeGrad")})`}
                    filter={`url(#${id("wisp")})`}
                  />
                </g>
              </mask>
            </defs>

            {/* Paint overshoots the viewBox by 80 units on every side so the
                pointer warp can displace the edge without eroding the rim —
                the container's rounded clip still cuts the true circle. */}
            <g mask={`url(#${id("punch")})`} filter={`url(#${id("warp")})`}>
              <rect
                x="-80"
                y="-80"
                width="1160"
                height="1160"
                fill={`url(#${id("orbDeep")})`}
              />
              <circle cx="360" cy="340" r="420" fill={`url(#${id("goldHi")})`} />
              <circle cx="740" cy="760" r="540" fill={`url(#${id("blueLo")})`} />
              {/* Static nacre hue patches under the moving auroras. */}
              <circle cx="290" cy="730" r="310" fill={`url(#${id("iridLav")})`} />
              <circle cx="820" cy="430" r="330" fill={`url(#${id("iridIce")})`} />
              <circle cx="660" cy="210" r="250" fill={`url(#${id("iridRose")})`} />
              <ellipse cx="500" cy="250" rx="430" ry="250" fill={`url(#${id("sheen")})`} />
              <g opacity="0.5">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 500 500"
                  to="360 500 500"
                  dur="16s"
                  repeatCount="indefinite"
                />
                <circle
                  cx="420"
                  cy="380"
                  r="200"
                  fill={`url(#${id("auroraGold")})`}
                />
                <circle
                  cx="650"
                  cy="560"
                  r="240"
                  fill={`url(#${id("auroraLight")})`}
                />
              </g>
              <g opacity="0.4">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="360 500 500"
                  to="0 500 500"
                  dur="26s"
                  repeatCount="indefinite"
                />
                <circle cx="560" cy="420" r="180" fill={`url(#${id("goldHi")})`} />
              </g>
              <g transform={`rotate(${rotate} 500 500)`}>
                <circle
                  cx="500"
                  cy="500"
                  r="460"
                  fill={`url(#${id("cloudGrad")})`}
                  filter={`url(#${id("wisp")})`}
                />
              </g>
              <ellipse
                cx={glossX}
                cy={glossY}
                rx="200"
                ry="130"
                fill={`url(#${id("gloss")})`}
              />
              <rect x="-80" y="-80" width="1160" height="1160" fill={`url(#${id("rim")})`} />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
