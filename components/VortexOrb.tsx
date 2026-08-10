"use client";

import { useEffect, useId, useRef } from "react";

/**
 * Archive orb portal: luminous navy+gold sphere with float, mouse parallax,
 * swirling aurora, and a feathery dive hole that opens onto the scene behind.
 *
 * `lite` drops the expensive SVG filters / animated auroras / pointer warp —
 * paint stays, but the GPU work falls to something a phone can hold.
 */
export function VortexOrb({
  scale = 1,
  rotate = 0,
  holeScale = 0,
  opacity = 1,
  lite = false,
  className,
}: {
  scale?: number;
  rotate?: number;
  holeScale?: number;
  opacity?: number;
  lite?: boolean;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const id = (name: string) => `${uid}-${name}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const glossRef = useRef<SVGEllipseElement>(null);
  const warpMapRef = useRef<SVGFEDisplacementMapElement>(null);
  const aim = useRef({ x: 0, y: 0, warp: 0 });
  const cur = useRef({ x: 0, y: 0, warp: 0 });
  // Dive props applied via style on the root — kept in a ref so the pointer
  // raf can rewrite transform without waiting on a React render.
  const diveRef = useRef({ scale, opacity });
  diveRef.current = { scale, opacity };

  useEffect(() => {
    if (lite) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let raf = 0;
    const tick = () => {
      cur.current.x += (aim.current.x - cur.current.x) * 0.08;
      cur.current.y += (aim.current.y - cur.current.y) * 0.08;
      cur.current.warp += (aim.current.warp - cur.current.warp) * 0.1;
      const el = rootRef.current;
      if (el) {
        const { scale: s, opacity: o } = diveRef.current;
        el.style.opacity = String(o);
        el.style.transform = `translate3d(${cur.current.x * 36}px, ${cur.current.y * 36}px, 0) scale(${s})`;
      }
      const gloss = glossRef.current;
      if (gloss) {
        gloss.setAttribute("cx", String(380 + cur.current.x * 40));
        gloss.setAttribute("cy", String(300 + cur.current.y * 36));
      }
      const warpMap = warpMapRef.current;
      if (warpMap) {
        warpMap.setAttribute("scale", String(cur.current.warp * 28));
      }
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
  }, [lite]);

  return (
    <div
      ref={rootRef}
      aria-hidden
      className={className}
      style={{
        opacity,
        transform: `scale(${scale})`,
        transformOrigin: "center center",
      }}
    >
      <div className={`relative h-full w-full ${lite ? "" : "pl-orb-float"}`}>
        <div className="pl-orb relative h-full w-full overflow-hidden rounded-full">
          <svg
            className="block h-full w-full"
            viewBox="0 0 1000 1000"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              {/* Hole softener — lite uses a plain radial; full uses a cheap
                  turbulence (2 octaves, no animate) so the dive still feathers. */}
              {!lite && (
                <filter
                  id={id("wisp")}
                  x="-30%"
                  y="-30%"
                  width="160%"
                  height="160%"
                  colorInterpolationFilters="sRGB"
                >
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.02"
                    numOctaves="2"
                    seed="7"
                    result="noise"
                  />
                  <feDisplacementMap
                    in="SourceGraphic"
                    in2="noise"
                    scale="80"
                    xChannelSelector="R"
                    yChannelSelector="G"
                  />
                  <feGaussianBlur stdDeviation="3" />
                </filter>
              )}

              {!lite && (
                <filter
                  id={id("warp")}
                  x="-15%"
                  y="-15%"
                  width="130%"
                  height="130%"
                  colorInterpolationFilters="sRGB"
                >
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.016"
                    numOctaves="2"
                    seed="3"
                    result="warpNoise"
                  />
                  <feDisplacementMap
                    ref={warpMapRef}
                    in="SourceGraphic"
                    in2="warpNoise"
                    scale="0"
                    xChannelSelector="R"
                    yChannelSelector="G"
                  />
                </filter>
              )}

              <radialGradient id={id("orbDeep")} cx="38%" cy="32%" r="78%">
                <stop offset="0%" stopColor="#faf1d4" />
                <stop offset="22%" stopColor="#efd287" />
                <stop offset="46%" stopColor="#d6def3" />
                <stop offset="70%" stopColor="#a7bbe4" />
                <stop offset="90%" stopColor="#7590c6" />
                <stop offset="100%" stopColor="#5f7cb4" />
              </radialGradient>
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
              <radialGradient id={id("rim")} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#e9effd" stopOpacity="0" />
                <stop offset="72%" stopColor="#e9effd" stopOpacity="0" />
                <stop offset="81%" stopColor="#e9effd" stopOpacity="0.2" />
                <stop offset="86%" stopColor="#f4f7ff" stopOpacity="0.5" />
                <stop offset="93%" stopColor="#f4f7ff" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#e9effd" stopOpacity="0.35" />
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
                    {...(!lite ? { filter: `url(#${id("wisp")})` } : null)}
                  />
                </g>
              </mask>
            </defs>

            <g
              mask={`url(#${id("punch")})`}
              {...(!lite ? { filter: `url(#${id("warp")})` } : null)}
            >
              <rect
                x="-80"
                y="-80"
                width="1160"
                height="1160"
                fill={`url(#${id("orbDeep")})`}
              />
              <circle cx="360" cy="340" r="420" fill={`url(#${id("goldHi")})`} />
              <circle cx="740" cy="760" r="540" fill={`url(#${id("blueLo")})`} />
              <circle cx="290" cy="730" r="310" fill={`url(#${id("iridLav")})`} />
              <circle cx="820" cy="430" r="330" fill={`url(#${id("iridIce")})`} />
              <circle cx="660" cy="210" r="250" fill={`url(#${id("iridRose")})`} />
              <ellipse cx="500" cy="250" rx="430" ry="250" fill={`url(#${id("sheen")})`} />
              {/* Static aurora patches — rotating SMIL was free CPU, expensive
                  compositor work on low-end GPUs. */}
              <circle cx="420" cy="380" r="200" fill={`url(#${id("auroraGold")})`} opacity="0.5" />
              <circle cx="650" cy="560" r="240" fill={`url(#${id("auroraLight")})`} opacity="0.5" />
              <circle cx="560" cy="420" r="180" fill={`url(#${id("goldHi")})`} opacity="0.35" />
              <ellipse
                ref={glossRef}
                cx="380"
                cy="300"
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
