"use client";

/**
 * Aurora ground for the Services page.
 *
 * Painted entirely with gradients that fall to `transparent` and drift on long
 * transform keyframes — deliberately no `filter: blur()` and no WebGL context.
 * Services is a silo page carrying an SEO mandate, so the ground has to cost
 * roughly nothing; the Cinematic starfield and the orb both do.
 *
 * The palette is the brand book's navy and gold read as light rather than ink:
 * navy lifted toward its highlight for the ribbons, gold kept scarce so it
 * lands as a warm edge instead of a wash.
 */

type Ribbon = {
  /** Gradient stack for the layer. */
  tone: string;
  /** Ellipse footprint, as a share of the viewport. */
  w: string;
  h: string;
  x: string;
  y: string;
  rotate: number;
  opacity: number;
  /** Which of the three drift keyframes this layer rides, and how slowly. */
  drift: 1 | 2 | 3;
  seconds: number;
};

const NAVY_LIFT = "#2f5390";
const NAVY_DEEP = "#16294a";
const PEARL = "#b9cbee";
const GOLD = "#e6b325";

const ribbon = (color: string, edge = 62) =>
  `radial-gradient(closest-side ellipse at 50% 50%, ${color} 0%, color-mix(in srgb, ${color} 45%, transparent) ${edge * 0.5}%, transparent ${edge}%)`;

const RIBBONS: Ribbon[] = [
  { tone: ribbon(NAVY_LIFT), w: "120vw", h: "58vh", x: "-18vw", y: "-16vh", rotate: -14, opacity: 0.55, drift: 1, seconds: 46 },
  { tone: ribbon(NAVY_DEEP, 70), w: "100vw", h: "70vh", x: "22vw", y: "6vh", rotate: 12, opacity: 0.6, drift: 2, seconds: 58 },
  { tone: ribbon(PEARL, 54), w: "70vw", h: "30vh", x: "6vw", y: "34vh", rotate: -8, opacity: 0.16, drift: 3, seconds: 52 },
  { tone: ribbon(GOLD, 50), w: "52vw", h: "22vh", x: "44vw", y: "62vh", rotate: 16, opacity: 0.14, drift: 1, seconds: 64 },
  { tone: ribbon(NAVY_LIFT, 66), w: "96vw", h: "52vh", x: "-24vw", y: "68vh", rotate: 9, opacity: 0.4, drift: 2, seconds: 70 },
  { tone: ribbon(GOLD, 46), w: "36vw", h: "16vh", x: "-6vw", y: "18vh", rotate: -20, opacity: 0.1, drift: 3, seconds: 44 },
];

export function AuroraField() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ backgroundColor: "#080d16" }}
    >
      {RIBBONS.map((r, i) => (
        <div
          key={i}
          className={`absolute aurora-drift-${r.drift}`}
          style={{
            width: r.w,
            height: r.h,
            left: r.x,
            top: r.y,
            opacity: r.opacity,
            background: r.tone,
            // `screen` is what makes overlapping ribbons read as light rather
            // than as stacked paint.
            mixBlendMode: "screen",
            transform: `rotate(${r.rotate}deg)`,
            animationDuration: `${r.seconds}s`,
          }}
        />
      ))}

      {/* Vignette. Type sits on top of this, so the ground has to darken at the
          edges and under the centre column no matter where the ribbons drift. */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 120% 80% at 50% 40%, transparent 0%, rgba(4,7,14,0.55) 70%, rgba(3,5,11,0.85) 100%)",
            "linear-gradient(180deg, rgba(4,7,14,0.5) 0%, transparent 22%, transparent 78%, rgba(4,7,14,0.6) 100%)",
          ].join(", "),
        }}
      />

      {/* Grain. Keeps the wide gradients from banding on 8-bit panels. */}
      <div className="absolute inset-0 aurora-grain" />
    </div>
  );
}
