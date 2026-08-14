"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

/**
 * Projects boot sequence, rebuilt from k95.it's loader.
 *
 * The reference is a stacked-card shutter: nine cards centred on one seam,
 * each opening horizontally and each a little wider than the last, so project
 * images flip-stack until a bare panel seals the pile. A bracketed counter runs
 * alongside. Then a fixed rect is dropped exactly over the stack whose only
 * paint is `box-shadow: 0 0 0 200vmax <surface>` — a sheet with a hole in it —
 * and that rect is scaled up until the hole is bigger than the window. The page
 * is revealed *through* the stack rather than after it.
 *
 * Timings are the reference's, measured rather than eyeballed: 667ms per card
 * on a 187ms stagger (which lands the ninth exactly on 2160ms), 140ms before
 * the patch, 1s expo.inOut for the iris.
 *
 * Recoloured to brand: k95 inverts white loader against an electric-blue site,
 * so this inverts the book's off-white against brand navy. That inversion is
 * the whole trick — it is the only cream surface on the page.
 */

const SURFACE = "#f9f7f2";
const CARD = "#1f355e";

/** Card widths as a share of the stack, in open order. */
const WIDTHS = [84, 86, 88, 90, 92, 94, 96, 98, 100];
/** Eight cards carry work; the ninth is the bare panel that seals the pile. */
const CARD_IMAGES = [
  "/mockups/1.png",
  "/mockups/6.png",
  "/mockups/11.png",
  "/mockups/16.png",
  "/mockups/3.png",
  "/mockups/18.png",
  "/mockups/9.png",
  "/mockups/15.png",
];

const OPEN_MS = 2160;
const CARD_MS = 667;
const STAGGER_MS = 187;
const PATCH_DELAY_MS = 140;
const IRIS_DELAY_MS = 60;
const IRIS_MS = 1000;
const FADE_MS = 900;
const UNMOUNT_MS = 420;

export function ProjectsPreloader({
  onReveal,
  onDone,
}: {
  /** The iris has started opening — whatever is underneath should be live. */
  onReveal?: () => void;
  /** Nothing of the loader is left to see. */
  onDone?: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const patchRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  /** Patch is mounted → the root must stop painting its own surface, or the
   *  hole in the patch would reveal cream instead of the page. */
  const [irising, setIrising] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const stack = stackRef.current;
    const patch = patchRef.current;
    const counter = counterRef.current;
    if (!root || !stack || !patch || !counter) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      onReveal?.();
      onDone?.();
      return;
    }

    const tl = gsap.timeline();

    // ── The shutter ────────────────────────────────────────────────────────
    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      tl.fromTo(
        card,
        { width: "0%" },
        {
          width: `${WIDTHS[i]}%`,
          duration: CARD_MS / 1000,
          ease: "expo.out",
        },
        (i * STAGGER_MS) / 1000,
      );
    });

    // ── The counter, alongside ─────────────────────────────────────────────
    const tick = { v: 0 };
    tl.to(
      tick,
      {
        v: 100,
        duration: OPEN_MS / 1000,
        ease: "none",
        onUpdate: () => {
          counter.textContent = `[${Math.round(tick.v)}]`;
        },
      },
      0,
    );

    // ── The iris ───────────────────────────────────────────────────────────
    tl.call(
      () => {
        // Pin the patch to exactly where the stack is, so the hole opens from
        // the pile rather than from an arbitrary centre.
        const r = stack.getBoundingClientRect();
        patch.style.left = `${r.left}px`;
        patch.style.top = `${r.top}px`;
        patch.style.width = `${r.width}px`;
        patch.style.height = `${r.height}px`;
        setIrising(true);

        gsap.to(stack, {
          opacity: 0,
          filter: "blur(8px)",
          duration: 0.42,
          ease: "power2.out",
        });
        gsap.to(counter, { opacity: 0, duration: 0.3, ease: "power2.out" });

        const scaleX = (window.innerWidth * 1.04) / r.width;
        const scaleY = (window.innerHeight * 1.04) / r.height;

        gsap
          .timeline({ delay: IRIS_DELAY_MS / 1000 })
          .call(() => onReveal?.())
          .to(patch, {
            scaleX,
            scaleY,
            duration: IRIS_MS / 1000,
            ease: "expo.inOut",
          })
          .to(
            root,
            {
              opacity: 0,
              duration: FADE_MS / 1000,
              ease: "power3.inOut",
              onComplete: () => {
                gsap.delayedCall(UNMOUNT_MS / 1000, () => onDone?.());
              },
            },
            ">",
          );
      },
      undefined,
      (OPEN_MS + PATCH_DELAY_MS) / 1000,
    );

    return () => {
      tl.kill();
      gsap.killTweensOf([stack, counter, patch, root]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={rootRef}
      data-boot-loader
      className="fixed inset-0 z-[70] grid place-content-center overflow-hidden"
      style={{ backgroundColor: irising ? "transparent" : SURFACE }}
    >
      <div
        ref={stackRef}
        className="relative aspect-3/4 w-[min(59vw,240px)] md:w-[min(72vw,320px)] lg:w-[min(40vw,420px)]"
      >
        {/* Counter, pinned just outside the stack's top-right corner. */}
        <span
          ref={counterRef}
          data-boot-counter
          className="absolute bottom-full left-full ml-3 mb-1 font-sans text-xs font-medium tabular-nums tracking-[0.02em] sm:text-sm"
          style={{ color: CARD }}
        >
          [0]
        </span>

        {WIDTHS.map((_, i) => {
          const src = CARD_IMAGES[i];
          return (
            <div
              key={i}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="absolute left-1/2 top-1/2 aspect-3/4 -translate-x-1/2 -translate-y-1/2 overflow-hidden"
              style={{
                width: 0,
                zIndex: i + 1,
                backgroundColor: CARD,
                border: src
                  ? `1px solid color-mix(in srgb, ${CARD} 12%, transparent)`
                  : "1px solid transparent",
              }}
            >
              {src ? (
                // Plain <img>: these are decode-on-boot, so next/image's
                // lazy machinery and layout wrappers are pure overhead here.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src}
                  alt=""
                  fetchPriority={i < 3 ? "high" : "low"}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
          );
        })}
      </div>

      {/* The sheet with a hole in it. Transparent centre, surface-coloured
          everywhere else via an enormous spread. Scaling this opens the iris. */}
      <div
        ref={patchRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0"
        style={{
          backgroundColor: "transparent",
          boxShadow: `0 0 0 200vmax ${SURFACE}`,
          opacity: irising ? 1 : 0,
          willChange: "transform",
        }}
      />
    </div>
  );
}
