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
  const [mx, setMx] = useState(0);
  const [my, setMy] = useState(0);
  const aim = useRef({ x: 0, y: 0 });
  const cur = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let raf = 0;
    const tick = () => {
      cur.current.x += (aim.current.x - cur.current.x) * 0.08;
      cur.current.y += (aim.current.y - cur.current.y) * 0.08;
      setMx(cur.current.x);
      setMy(cur.current.y);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onMove = (e: PointerEvent) => {
      aim.current.x = e.clientX / window.innerWidth - 0.5;
      aim.current.y = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  const glossX = 380 + mx * 40;
  const glossY = 300 + my * 36;

  return (
    <div
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

              {/* Soft brand pearl — no hot white specular in the upper-left. */}
              <radialGradient id={id("orbDeep")} cx="42%" cy="38%" r="68%">
                <stop offset="0%" stopColor="#f2d27a" />
                <stop offset="28%" stopColor="#e6b325" />
                <stop offset="55%" stopColor="#8a9fc8" />
                <stop offset="78%" stopColor="#3a5488" />
                <stop offset="100%" stopColor="#1a2a52" />
              </radialGradient>
              <radialGradient id={id("goldHi")} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#e6b325" stopOpacity="0.55" />
                <stop offset="40%" stopColor="#c9a24a" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#e6b325" stopOpacity="0" />
              </radialGradient>
              <radialGradient id={id("blueLo")} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#a8bde8" stopOpacity="0.55" />
                <stop offset="50%" stopColor="#6b8fd4" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#3a5a9e" stopOpacity="0" />
              </radialGradient>
              <radialGradient id={id("auroraGold")} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#e6b325" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#e6b325" stopOpacity="0" />
              </radialGradient>
              <radialGradient id={id("auroraLight")} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#c9d6f0" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#c9d6f0" stopOpacity="0" />
              </radialGradient>
              <radialGradient id={id("gloss")} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f0d78a" stopOpacity="0.22" />
                <stop offset="70%" stopColor="#f0d78a" stopOpacity="0" />
              </radialGradient>
              <radialGradient id={id("rim")} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1a2848" stopOpacity="0" />
                <stop offset="68%" stopColor="#1a2848" stopOpacity="0" />
                <stop offset="100%" stopColor="#0c1428" stopOpacity="0.35" />
              </radialGradient>
              <radialGradient id={id("cloudGrad")} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffd24a" stopOpacity="0" />
                <stop offset="34%" stopColor="#e6b325" stopOpacity="0.22" />
                <stop offset="70%" stopColor="#8eb0ef" stopOpacity="0.16" />
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
                maskType="luminance"
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

            <g mask={`url(#${id("punch")})`}>
              <rect
                x="0"
                y="0"
                width="1000"
                height="1000"
                fill={`url(#${id("orbDeep")})`}
              />
              <circle cx="360" cy="340" r="420" fill={`url(#${id("goldHi")})`} />
              <circle cx="740" cy="760" r="540" fill={`url(#${id("blueLo")})`} />
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
              <rect x="0" y="0" width="1000" height="1000" fill={`url(#${id("rim")})`} />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
