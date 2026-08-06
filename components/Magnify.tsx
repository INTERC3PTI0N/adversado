"use client";

import { useRef, useState } from "react";

/**
 * Magnifier lens over a single word.
 *
 * A blown-up copy of the word sits exactly on top of the real one, scaled
 * about the pointer so the letters under the glass stay registered with the
 * letters around it, and clipped to a circle that follows the cursor. That
 * registration is the whole trick — scale about the element's centre instead
 * and the magnified text slides out from under its own lens.
 *
 * Done in CSS rather than as a WebGL shader on purpose: the effect is a
 * radially-clipped scale, which `clip-path: circle()` and a transform express
 * exactly. Rendering one word to a texture to do the same thing in a fragment
 * shader would cost a context, a font-atlas render and a resize path, and
 * would look no different.
 */
export function Magnify({
  children,
  zoom = 1.9,
  radius = 46,
  className,
}: {
  children: string;
  zoom?: number;
  radius?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [lens, setLens] = useState<{ x: number; y: number } | null>(null);

  return (
    <span
      ref={ref}
      className={`relative inline-block cursor-none ${className ?? ""}`}
      onPointerMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        setLens({ x: e.clientX - r.left, y: e.clientY - r.top });
      }}
      onPointerLeave={() => setLens(null)}
    >
      {children}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          // Transform origin at the pointer keeps the magnified glyphs lined
          // up with the ones outside the lens.
          transformOrigin: lens ? `${lens.x}px ${lens.y}px` : "50% 50%",
          transform: `scale(${lens ? zoom : 1})`,
          clipPath: lens
            ? `circle(${radius / (lens ? zoom : 1)}px at ${lens.x}px ${lens.y}px)`
            : "circle(0px at 50% 50%)",
          opacity: lens ? 1 : 0,
          transition: "opacity 180ms ease",
          textShadow: "0 0 24px rgba(230,179,37,0.45)",
        }}
      >
        {children}
      </span>
    </span>
  );
}
