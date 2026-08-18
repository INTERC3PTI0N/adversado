"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

/**
 * Ring / Spiral gallery — the Framer "Ring Spiral Gallery" pattern, rebuilt in
 * CSS 3D rather than imported.
 *
 * Cards sit on a cylinder of fixed radius. In `ring` mode every card shares one
 * revolution and the coil is flat; in `spiral` mode there are eight to a turn
 * and each turn drops by `PITCH`, so the arrangement reads as a helix receding
 * into depth. Both modes are driven by one number — `progress`, 0→1 — because
 * the vertical travel and the rotation are derived from it together:
 *
 *     θ  = 360 / perTurn                       degrees between neighbours
 *     a  = i·θ − progress·(N−1)·θ              card i faces front at i/(N−1)
 *     y  = i·yStep − progress·(N−1)·yStep      …and is level with the camera there
 *
 * so card i is simultaneously nearest and centred exactly when
 * `progress === i / (N − 1)`. Depth shading (scale, opacity, paint order) is
 * derived from `z = R·cos a`, never from source order — CSS 3D `z-index` across
 * stacking contexts cannot be trusted to do it for us.
 *
 * Every frame is written straight to `element.style`; nothing here goes through
 * React state per tick.
 */

export type GalleryItem = {
  src: string;
  client: string;
  title: string;
  category: string;
};

export type GalleryMode = "ring" | "spiral";

/** Items per revolution in spiral mode. Ring mode puts them all on one turn. */
const SPIRAL_PER_TURN = 8;
/** Pixels dropped per full turn of the helix. */
const PITCH = 560;
/** How the coil is tipped, so you look slightly down into it. */
const TILT_X = 7;
/** Approach rate of the render value toward the target, per frame. */
const DAMPING = 0.085;
/** Idle drift, in progress units per second. */
const AUTOPLAY = 0.012;

type Metrics = {
  cardW: number;
  cardH: number;
  radius: number;
  perspective: number;
  /** Screen-space nudge that puts the coil's front face back on the centreline. */
  anchorY: number;
};

function metricsFor(width: number, mode: GalleryMode, count: number): Metrics {
  const compact = width < 768;
  const base = compact ? 152 : width < 1200 ? 210 : 280;
  // Ring mode puts every card on one revolution, so they have to be smaller to
  // sit side by side rather than shingled on top of each other.
  const cardW = mode === "ring" ? Math.round(base * 0.78) : base;
  const cardH = Math.round(cardW * 1.3);

  const perTurn = mode === "ring" ? count : SPIRAL_PER_TURN;
  // Smallest radius at which neighbours on the same turn cannot overlap, plus
  // headroom — flat-on neighbours want visible air between them, not a tangent.
  const minRadius = cardW / 2 / Math.tan(Math.PI / perTurn);
  const radius = Math.max(minRadius * (mode === "ring" ? 1.15 : 1.08), compact ? 240 : 400);

  // Perspective follows radius rather than sitting at a fixed value: a front
  // card is projected by P / (P − R), so ring mode's much larger radius would
  // blow the nearest card up past the viewport if P stayed where spiral wants
  // it. Holding P at 2.8R fixes that magnification at a constant 1.56.
  const perspective = Math.round(Math.min(3600, Math.max(1100, radius * 2.8)));

  // Tipping the rig on X swings its front face upward by R·sin(tilt), which
  // perspective then magnifies — enough at ring radii to shove the whole coil
  // into the top of the frame. Undo it in screen space, but only partly: the
  // exact figure re-centres the single frontmost card, and its neighbours round
  // the arc are displaced less, so correcting in full drops the group as a whole
  // below the centreline. Half puts the visible cluster on it.
  const rad = (TILT_X * Math.PI) / 180;
  const anchorY = Math.round(
    (0.5 * (perspective * (radius * Math.sin(rad)))) /
      (perspective - radius * Math.cos(rad)),
  );

  return { cardW, cardH, radius, perspective, anchorY };
}

export function RingSpiralGallery({
  items,
  mode,
  progressRef,
  onActiveChange,
  onHover,
  onSelect,
}: {
  items: GalleryItem[];
  mode: GalleryMode;
  /** Scroll position through the gallery's own section, 0→1. A ref rather than
   *  a value so the parent can update it every frame without re-rendering. */
  progressRef: React.RefObject<number>;
  onActiveChange?: (index: number) => void;
  onHover?: (item: GalleryItem | null) => void;
  onSelect?: (item: GalleryItem) => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const rigRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [viewport, setViewport] = useState(1440);
  const [reduced, setReduced] = useState(false);

  /** Manual and idle contributions, added to the scrolled position. */
  const dragP = useRef(0);
  const autoP = useRef(0);
  /** The eased value actually rendered. */
  const renderP = useRef(progressRef.current ?? 0);
  const lastActive = useRef(-1);
  const dragging = useRef(false);
  const velocity = useRef(0);

  const N = items.length;
  const m = useMemo(() => metricsFor(viewport, mode, N), [viewport, mode, N]);
  const perTurn = mode === "ring" ? N : SPIRAL_PER_TURN;
  const theta = 360 / perTurn;
  const yStep = mode === "ring" ? 0 : PITCH / perTurn;
  /** Vertical distance over which a card fades out of the coil. */
  const yFade = PITCH * 1.15;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onMq = () => setReduced(mq.matches);
    mq.addEventListener("change", onMq);

    const onResize = () => setViewport(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => {
      mq.removeEventListener("change", onMq);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  /* ── The frame loop ─────────────────────────────────────────────────────── */
  useEffect(() => {
    if (reduced) return;
    const rig = rigRef.current;
    if (!rig) return;

    let raf = 0;
    let last = performance.now();
    const span = Math.max(1, N - 1);

    const paint = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      if (!dragging.current) {
        // Released drag coasts to a stop; idle drift only takes over once the
        // throw has spent itself, so the two never fight.
        if (Math.abs(velocity.current) > 0.00005) {
          dragP.current += velocity.current;
          velocity.current *= 0.93;
        } else {
          velocity.current = 0;
          autoP.current += AUTOPLAY * dt;
        }
      }

      const target = (progressRef.current ?? 0) + dragP.current + autoP.current;
      renderP.current += (target - renderP.current) * DAMPING;
      const p = renderP.current;

      rig.style.transform = `rotateX(${TILT_X}deg)`;

      let bestIndex = 0;
      let bestScore = -Infinity;

      for (let i = 0; i < N; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;

        /* Infinite coil. `k` is the card's offset from the front of the
           carousel; wrapping it into (-N/2, N/2] means every card is always
           drawn at its *nearest* repeat rather than marching off into the
           distance once `p` passes 1. The recycle happens at the far side of
           the loop, where the card is already faded to nothing by `vy`, so it
           is never visible as a jump. */
        let k = i - p * span;
        k = ((k % N) + N) % N;
        if (k > N / 2) k -= N;

        const a = k * theta;
        const rad = (a * Math.PI) / 180;
        const z = Math.cos(rad);
        const y = k * yStep;

        // Depth 0 (far side) → 1 (nearest the camera).
        const t = (z + 1) / 2;
        // Vertical visibility, so a card at the right angle but ten turns away
        // does not paint at full strength.
        const vy = yFade > 0 ? Math.max(0, 1 - Math.abs(y) / yFade) : 1;

        const scale = 0.66 + 0.34 * t;
        const opacity = (0.08 + 0.92 * Math.pow(t, 1.6)) * (yStep === 0 ? 1 : vy);

        // Billboarded: the trailing rotateY cancels the ring's own rotation so
        // the artwork always faces the reader.
        el.style.transform =
          `translate3d(-50%, -50%, 0) translateY(${y.toFixed(1)}px) ` +
          `rotateY(${a.toFixed(2)}deg) translateZ(${m.radius}px) ` +
          `rotateY(${(-a).toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        el.style.opacity = opacity.toFixed(3);
        el.style.zIndex = String(Math.round(t * 1000));
        el.style.pointerEvents = t > 0.72 && opacity > 0.5 ? "auto" : "none";

        const score = t * 2 - Math.abs(y) / (yFade || 1);
        if (score > bestScore) {
          bestScore = score;
          bestIndex = i;
        }
      }

      if (bestIndex !== lastActive.current) {
        lastActive.current = bestIndex;
        onActiveChange?.(bestIndex);
      }

      raf = requestAnimationFrame(paint);
    };

    raf = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(raf);
  }, [reduced, N, theta, yStep, yFade, m.radius, onActiveChange, progressRef]);

  /* ── Drag to spin ──────────────────────────────────────────────────────── */
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragging.current = true;
    velocity.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      // A drag across the full stage width is worth a couple of turns.
      const step = -e.movementX / (viewport * 0.55);
      dragP.current += step;
      velocity.current = step;
    },
    [viewport],
  );

  const endDrag = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* pointer already gone */
    }
  }, []);

  /* ── Reduced motion: a plain, legible grid ─────────────────────────────── */
  if (reduced) {
    return (
      <div className="grid grid-cols-2 gap-4 px-6 py-16 sm:grid-cols-3 lg:grid-cols-4 lg:px-16">
        {items.map((item) => (
          <figure key={item.src} className="border border-cream/15">
            <div className="relative aspect-3/4">
              <Image
                src={item.src}
                alt={`${item.client} — ${item.title}`}
                fill
                sizes="(max-width: 768px) 45vw, 300px"
                className="object-cover"
              />
            </div>
            <figcaption className="px-3 py-2 font-sans text-[0.68rem] uppercase tracking-[0.16em] text-cream/70">
              {item.client} — {item.category}
            </figcaption>
          </figure>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={stageRef}
      className="relative h-full w-full touch-pan-y select-none"
      style={{ perspective: `${m.perspective}px` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={() => onHover?.(null)}
    >
      <div
        ref={rigRef}
        className="absolute left-1/2 h-0 w-0"
        style={{
          top: `calc(50% + ${m.anchorY}px)`,
          transformStyle: "preserve-3d",
        }}
      >
        {items.map((item, i) => (
          <div
            key={item.src}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            data-hover
            className="absolute left-0 top-0 overflow-hidden border border-cream/20 bg-navy/40"
            style={{
              width: m.cardW,
              height: m.cardH,
              willChange: "transform, opacity",
              backfaceVisibility: "hidden",
            }}
            onPointerEnter={() => onHover?.(item)}
            onClick={() => onSelect?.(item)}
          >
            <Image
              src={item.src}
              alt={`${item.client} — ${item.title}`}
              fill
              sizes="(max-width: 768px) 40vw, 280px"
              priority={i < 4}
              className="pointer-events-none object-cover"
            />
            {/* Caption rides the card so the coil still reads as a portfolio
                rather than a carousel of anonymous rectangles. */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal/90 to-transparent px-3 pb-2 pt-8">
              <p className="font-sans text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-cream">
                {item.client}
              </p>
              <p className="font-sans text-[0.55rem] uppercase tracking-[0.16em] text-gold/90">
                {item.category}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
