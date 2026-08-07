"use client";

import { useEffect, useRef } from "react";

/**
 * A trail that hangs off the pointer — a chain of points where each one chases
 * the one ahead of it, so the tail whips on a fast flick and gathers up when
 * the cursor stops.
 *
 * One canvas for the whole page rather than DOM nodes: a trail is thirty-odd
 * moving elements, and thirty transforms a frame is a layout cost the rest of
 * this page (three parallax sheets, four shader cards) cannot spare. Drawn
 * additively so the segments pile into a hot core where the trail doubles back
 * on itself.
 */
export function CursorTrail({
  color = "#e6b325",
  length = 26,
  width = 8,
}: {
  color?: string;
  length?: number;
  width?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Parked off-screen: until the pointer has been somewhere, the trail has
    // nowhere honest to be, and starting it at 0,0 flings a streak out of the
    // corner on the first move.
    const target = { x: -200, y: -200 };
    const pts = Array.from({ length }, () => ({ x: -200, y: -200 }));
    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let raf = 0;
    const frame = () => {
      raf = requestAnimationFrame(frame);

      pts[0].x += (target.x - pts[0].x) * 0.4;
      pts[0].y += (target.y - pts[0].y) * 0.4;
      for (let i = 1; i < length; i++) {
        pts[i].x += (pts[i - 1].x - pts[i].x) * 0.34;
        pts[i].y += (pts[i - 1].y - pts[i].y) * 0.34;
      }

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = color;
      ctx.lineCap = "round";
      for (let i = 1; i < length; i++) {
        const t = 1 - i / length;
        ctx.globalAlpha = t * t * 0.5;
        ctx.lineWidth = width * t;
        ctx.beginPath();
        ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
        ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();
      }
    };
    frame();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, [color, length, width]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 h-full w-full"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
