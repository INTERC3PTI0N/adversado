import React from "react";

// The orb IS the portal: a circular, glowing navy+gold sphere whose interior is
// a soft feathery "galaxy cloud" (SVG fractal-noise turbulence). A feathery hole
// in the centre reveals the next section BEHIND it. Everything is clipped to the
// orb circle, so the galaxy always sits inside the orb. As you zoom in (scale),
// the hole grows + the cloud swirls (spiral) to unveil the section.
const Vortex = ({ scale = 1, rotate = 0, holeScale = 0, opacity = 1 }) => {
  return (
    <div
      className="vortex"
      style={{ transform: `scale(${scale})`, opacity }}
    >
      <svg
        className="vortex-svg"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <filter
            id="wisp"
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

          {/* luminous cream pearl base */}
          <radialGradient id="orbDeep" cx="47%" cy="52%" r="72%">
            <stop offset="0%" stopColor="#f5f2ea" />
            <stop offset="50%" stopColor="#e3e7f1" />
            <stop offset="80%" stopColor="#c2cade" />
            <stop offset="100%" stopColor="#9aa6c0" />
          </radialGradient>
          <radialGradient id="goldHi" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f9df88" stopOpacity="0.98" />
            <stop offset="34%" stopColor="#e6b325" stopOpacity="0.62" />
            <stop offset="78%" stopColor="#e6b325" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="blueLo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c9d3ea" stopOpacity="0.7" />
            <stop offset="60%" stopColor="#aeb9d6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#aeb9d6" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="auroraGold" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f2d27a" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#f2d27a" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="auroraLight" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="gloss" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
            <stop offset="70%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          {/* soft rim vignette for a spherical, glossy look */}
          <radialGradient id="rim" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#324066" stopOpacity="0" />
            <stop offset="72%" stopColor="#324066" stopOpacity="0" />
            <stop offset="100%" stopColor="#28345a" stopOpacity="0.55" />
          </radialGradient>

          {/* very subtle cloud texture (keeps the pearl clean at rest) */}
          <radialGradient id="cloudGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c9a24a" stopOpacity="0" />
            <stop offset="34%" stopColor="#b98f2e" stopOpacity="0.14" />
            <stop offset="70%" stopColor="#7c86a6" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#7c86a6" stopOpacity="0" />
          </radialGradient>

          {/* feathery hole (transparent) that reveals the section behind */}
          <radialGradient id="holeGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000" stopOpacity="1" />
            <stop offset="46%" stopColor="#000" stopOpacity="1" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>

          <mask id="punch">
            <rect x="-200" y="-200" width="1400" height="1400" fill="#fff" />
            <g
              transform={`translate(500 500) scale(${holeScale}) rotate(${rotate}) translate(-500 -500)`}
            >
              <circle cx="500" cy="500" r="420" fill="url(#holeGrad)" filter="url(#wisp)" />
            </g>
          </mask>
        </defs>

        <g mask="url(#punch)">
          <rect x="0" y="0" width="1000" height="1000" fill="url(#orbDeep)" />
          <circle cx="340" cy="290" r="540" fill="url(#goldHi)" />
          <circle cx="720" cy="780" r="560" fill="url(#blueLo)" />
          {/* rotating aurora shimmer */}
          <g opacity="0.45">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 500 500"
              to="360 500 500"
              dur="22s"
              repeatCount="indefinite"
            />
            <circle cx="380" cy="340" r="190" fill="url(#auroraGold)" />
            <circle cx="650" cy="560" r="230" fill="url(#auroraLight)" />
          </g>
          {/* subtle feathery galaxy cloud */}
          <g transform={`rotate(${rotate} 500 500)`}>
            <circle cx="500" cy="500" r="460" fill="url(#cloudGrad)" filter="url(#wisp)" />
          </g>
          {/* glossy highlight + spherical rim vignette */}
          <ellipse cx="380" cy="300" rx="250" ry="160" fill="url(#gloss)" />
          <rect x="0" y="0" width="1000" height="1000" fill="url(#rim)" />
        </g>
      </svg>
    </div>
  );
};

export default Vortex;
