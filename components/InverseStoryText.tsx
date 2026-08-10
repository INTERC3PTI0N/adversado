"use client";

import { useCallback, useEffect, useRef } from "react";

type InverseStoryTextProps = {
  children: React.ReactNode;
  className?: string;
  /** Diameter of the invert lens in px. */
  lensSize?: number;
};

/**
 * Full-bleed story block: large reading type with a circular
 * mix-blend-difference lens that follows the pointer.
 */
export function InverseStoryText({
  children,
  className = "",
  lensSize = 220,
}: InverseStoryTextProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const reducedRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      reducedRef.current = mq.matches;
      if (mq.matches && lensRef.current) {
        lensRef.current.style.opacity = "0";
      }
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const onMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (reducedRef.current) return;
      const host = hostRef.current;
      const lens = lensRef.current;
      if (!host || !lens) return;
      const r = host.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      lens.style.opacity = "1";
      lens.style.transform = `translate(${x - lensSize / 2}px, ${y - lensSize / 2}px)`;
    },
    [lensSize],
  );

  const onLeave = useCallback(() => {
    if (lensRef.current) lensRef.current.style.opacity = "0";
  }, []);

  return (
    <div
      ref={hostRef}
      className={`relative ${className}`}
      onPointerMove={onMove}
      onPointerEnter={onMove}
      onPointerLeave={onLeave}
    >
      <div className="relative z-0">{children}</div>
      <div
        ref={lensRef}
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 z-10 rounded-full bg-cream mix-blend-difference"
        style={{
          width: lensSize,
          height: lensSize,
          opacity: 0,
          transform: `translate(-${lensSize}px, -${lensSize}px)`,
          transition: "opacity 220ms ease-out",
          willChange: "transform, opacity",
        }}
      />
    </div>
  );
}
