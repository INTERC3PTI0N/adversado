"use client";

import React, { useRef, useState } from "react";
import { motion, useAnimationFrame } from "motion/react";

/**
 * Conic-gradient border light. Two stacked layers: a soft fill inside, and the
 * same gradient masked to the 2px border ring via `xor` compositing.
 */
export default function BorderGlow({
  children,
  glowColor = "40 80 80",
  backgroundColor = "transparent",
  borderRadius = 28,
  glowRadius = 150,
  glowIntensity = 1.0,
  animated = false,
  colors = ["#c084fc", "#f472b6", "#38bdf8"],
  className = "",
}: {
  children: React.ReactNode;
  glowColor?: string;
  backgroundColor?: string;
  borderRadius?: number;
  glowRadius?: number;
  glowIntensity?: number;
  animated?: boolean;
  colors?: string[];
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: -1000, y: -1000 });
  const [isHovered, setIsHovered] = useState(false);
  const [angle, setAngle] = useState(0);

  useAnimationFrame((t) => {
    if (animated) setAngle((t / 20) % 360);
  });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const parsedGlowColor = glowColor.replace(/ /g, ", ");
  const paint = animated
    ? `conic-gradient(from ${angle}deg at 50% 50%, ${colors.join(", ")}, ${colors[0]})`
    : undefined;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative inline-block ${className}`}
      style={{ borderRadius, background: backgroundColor }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        animate={{ opacity: isHovered || animated ? glowIntensity : 0 }}
        transition={{ duration: 0.3 }}
        style={{ borderRadius }}
      >
        {/* Soft fill inside */}
        <div
          className="pointer-events-none absolute inset-0 z-0 rounded-[inherit]"
          style={{
            background:
              paint ??
              `radial-gradient(${glowRadius * 2}px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(${parsedGlowColor}, 0.15), transparent)`,
          }}
        />

        {/* Border outline mask */}
        <div
          className="pointer-events-none absolute inset-0 z-0 rounded-[inherit]"
          style={{
            padding: "2px",
            background:
              paint ??
              `radial-gradient(${glowRadius * 2}px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(${parsedGlowColor}, 1), transparent)`,
            WebkitMask:
              "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />
      </motion.div>

      <div className="relative z-10 h-full w-full rounded-[inherit]">{children}</div>
    </div>
  );
}
