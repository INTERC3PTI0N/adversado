"use client";

import { useCallback, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export type DiveStoryLayer = {
  body: string;
};

/** One physical mouse notch. Chrome/Firefox report ~100px per detent at
 *  deltaMode 0; Lenis multiplies by its own wheelMultiplier (1.05 here), so a
 *  real notch arrives around 105. Anything at or above this counts as a
 *  deliberate scroll rather than trackpad drift. */
const NOTCH = 70;

/** Trackpad inertia arrives as a long tail of small deltas. After a committed
 *  advance, ignore further input until the pointer has been quiet this long,
 *  so one flick moves one plane rather than four. */
const QUIET_MS = 420;

function renderMarked(body: string) {
  // `*word*` → Merriweather italic · `**phrase**` → bold (both gold)
  const parts = body.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  return parts.map((part, i) => {
    const bold = /^\*\*([^*]+)\*\*$/.exec(part);
    if (bold) {
      return (
        <span key={i} className="font-bold text-gold">
          {bold[1]}
        </span>
      );
    }
    const italic = /^\*([^*]+)\*$/.exec(part);
    if (italic) {
      return (
        <span key={i} className="font-serif font-light italic text-gold">
          {italic[1]}
        </span>
      );
    }
    return (
      <span key={i}>
        {part.split("\n").map((line, li, lines) => (
          <span key={li}>
            {line}
            {li < lines.length - 1 ? <br /> : null}
          </span>
        ))}
      </span>
    );
  });
}

/**
 * Story dive — GSAP pin/scrub of DOM text planes, advanced one plane per
 * deliberate scroll.
 *
 * Snapping is scoped to this section's own pinned range only. `st.start` and
 * `st.end` are read live off the trigger on every tick (never cached, so a
 * resize can't drift the bounds), and outside that window the handler returns
 * immediately — the rest of the site keeps ordinary free scroll. At the last
 * plane going forward, and the first plane going back, the tick is likewise
 * left alone, which is what releases the pin and resumes normal scrolling.
 *
 * Two guards make "one scroll = one plane" true rather than approximate:
 *   · a NOTCH threshold, so trackpad micro-deltas don't count as a scroll;
 *   · a QUIET_MS debounce after each advance, so the inertia tail of a single
 *     flick doesn't run through the whole story.
 *
 * The gauge (bottom-left) shows which plane you are on and how much of the
 * current notch has been accumulated, so the interaction is legible rather
 * than a mystery — the section says what it wants from you.
 */
export function DiveStorySection({
  layers,
  vhPerPlane = 100,
  caption = "Scroll through the planes",
  className = "",
}: {
  layers: DiveStoryLayer[];
  vhPerPlane?: number;
  caption?: string;
  className?: string;
}) {
  const trackRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);

  const [index, setIndex] = useState(0);
  const [armed, setArmed] = useState(false);
  const [charge, setCharge] = useState(0);

  const total = layers.length;

  const onState = useCallback(
    (i: number, isArmed: boolean, c: number) => {
      setIndex(i);
      setArmed(isArmed);
      setCharge(c);
    },
    []
  );

  useGSAP(
    () => {
      const track = trackRef.current;
      const pin = pinRef.current;
      const stack = stackRef.current;
      if (!track || !pin || !stack || layers.length === 0) return;

      const planes = gsap.utils.toArray<HTMLElement>(
        stack.querySelectorAll("[data-dive-plane]"),
      );
      if (!planes.length) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(planes, { clearProps: "all" });
        gsap.set(planes, { opacity: 0, scale: 1, y: 0, z: 0 });
        gsap.set(planes[planes.length - 1], { opacity: 1 });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Deep tunnel: far planes sit well back on Z, exit rushes past the camera.
        gsap.set(planes, {
          opacity: 0,
          scale: 0.42,
          z: -520,
          y: 0,
          transformPerspective: 1400,
          transformOrigin: "50% 50%",
          force3D: true,
        });
        gsap.set(planes[0], { opacity: 1, scale: 1, z: 0 });

        const step = () => window.innerHeight * (vhPerPlane / 100);

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: track,
            start: "top top",
            end: () => `+=${Math.max(1, layers.length - 1) * step()}`,
            scrub: 0.2,
            pin,
            // overflow-x-hidden on SitePage forces transform pins.
            pinType: "transform",
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        for (let i = 1; i < planes.length; i++) {
          const prev = planes[i - 1];
          const next = planes[i];
          const at = i - 1;
          tl.to(
            prev,
            { opacity: 0, scale: 1.55, z: 380, duration: 1 },
            at,
          ).fromTo(
            next,
            { opacity: 0, scale: 0.42, z: -520 },
            { opacity: 1, scale: 1, z: 0, duration: 1 },
            at,
          );
        }

        const st = tl.scrollTrigger!;
        const yFor = (i: number) => (st.start ?? 0) + i * step();

        let idx = 0;
        let locked = false;
        let accum = 0;
        let lastTick = 0;
        let quietUntil = 0;
        let raf = 0;
        let tries = 0;
        let unsub: (() => void) | null = null;
        /* Latch: the scroll that brings the section fully into view must not
           also be the scroll that advances a plane. We only start intercepting
           on the tick *after* the range is first entered, so arriving at the
           section and driving it are two separate gestures. */
        let wasInRange = false;

        const publish = () =>
          onState(idx, true, Math.min(1, Math.abs(accum) / NOTCH));

        const onVirtualScroll = ({
          deltaY,
          event,
        }: {
          deltaY: number;
          event: WheelEvent | TouchEvent;
        }) => {
          const lenis = window.__lenis;
          if (!lenis) return;

          const y = lenis.scroll;
          const start = st.start ?? 0;
          const end = st.end ?? 0;
          // Outside our pinned range — free scroll, and drop the gauge.
          if (y < start - 1 || y > end + 1) {
            if (accum !== 0) accum = 0;
            wasInRange = false;
            onState(idx, false, 0);
            return;
          }

          // First tick inside the range is the arrival itself. Let it through
          // untouched so the section settles fully into view, and only take
          // over from the next scroll onward.
          if (!wasInRange) {
            wasInRange = true;
            accum = 0;
            onState(idx, true, 0);
            return;
          }

          if (Math.abs(deltaY) < 1) return;

          const forward = deltaY > 0;
          // Edges fall through to ordinary scroll — this is what hands control
          // back to the page after the last plane (and before the first).
          if (forward && idx >= planes.length - 1) {
            accum = 0;
            onState(idx, false, 0);
            return;
          }
          if (!forward && idx <= 0) {
            accum = 0;
            onState(idx, false, 0);
            return;
          }

          (
            event as WheelEvent & { lenisStopPropagation?: boolean }
          ).lenisStopPropagation = true;
          if (event.cancelable) event.preventDefault();

          const now = performance.now();
          if (locked || now < quietUntil) return;

          // Direction flip restarts the charge rather than cancelling it out.
          if (accum !== 0 && Math.sign(deltaY) !== Math.sign(accum)) accum = 0;
          // A pause longer than the debounce is a new gesture.
          if (now - lastTick > QUIET_MS) accum = 0;
          lastTick = now;
          accum += deltaY;

          if (Math.abs(accum) < NOTCH) {
            publish();
            /* Hold the plane. `lenisStopPropagation` alone proved not to be
               enough here — sub-threshold deltas were still leaking through
               and drifting the pin off its snap point, so a flick would end
               mid-transition between two planes. Re-asserting the current
               plane's offset makes "one scroll, one plane" exact instead of
               approximate: anything short of a full notch moves nothing. */
            const want = yFor(idx);
            if (Math.abs(lenis.scroll - want) > 1) {
              lenis.scrollTo(want, {
                immediate: true,
                lock: true,
                force: true,
                programmatic: true,
              });
            }
            return;
          }

          idx = forward ? idx + 1 : idx - 1;
          accum = 0;
          locked = true;
          quietUntil = now + QUIET_MS;
          onState(idx, true, 0);

          lenis.scrollTo(yFor(idx), {
            duration: 0.5,
            easing: (t: number) => 1 - Math.pow(1 - t, 3),
            lock: true,
            force: true,
            programmatic: true,
            onComplete: () => {
              locked = false;
              quietUntil = performance.now() + QUIET_MS;
            },
          });
        };

        const mount = () => {
          const lenis = window.__lenis;
          if (!lenis) {
            if (tries++ < 90) raf = requestAnimationFrame(mount);
            return;
          }
          lenis.on("virtual-scroll", onVirtualScroll);
          unsub = () => lenis.off("virtual-scroll", onVirtualScroll);
        };
        mount();

        return () => {
          cancelAnimationFrame(raf);
          unsub?.();
        };
      });

      return () => mm.revert();
    },
    { dependencies: [layers, vhPerPlane, onState], revertOnUpdate: true },
  );

  const runway = Math.max(1, layers.length - 1) * vhPerPlane + 100;
  const atEnd = index >= total - 1;

  return (
    <section
      ref={trackRef}
      className={`relative w-full ${className}`.trim()}
      style={{ height: `${runway}svh` }}
      aria-label="The Story"
    >
      <div
        ref={pinRef}
        className="relative z-[1] flex h-[100svh] w-full items-center justify-center px-6 sm:px-10 lg:px-16"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[#06040a]/55"
        />

        <div
          ref={stackRef}
          className="relative z-[1] mx-auto w-full max-w-5xl text-center [perspective:1400px] [transform-style:preserve-3d]"
        >
          {layers.map((layer, i) => (
            <p
              key={i}
              data-dive-plane
              className="absolute inset-x-0 top-1/2 w-full -translate-y-1/2 font-sans text-[clamp(1.35rem,3.4vw,2.75rem)] font-extrabold leading-[1.2] tracking-[-0.03em] text-cream will-change-transform [transform-style:preserve-3d]"
              style={{ zIndex: layers.length - i }}
            >
              {renderMarked(layer.body)}
            </p>
          ))}
          {/* Spacer so absolute stack has a layout box */}
          <p
            aria-hidden
            className="invisible font-sans text-[clamp(1.35rem,3.4vw,2.75rem)] font-extrabold leading-[1.2] tracking-[-0.03em]"
          >
            {renderMarked(layers[0]?.body ?? "")}
          </p>
        </div>

        {caption ? (
          <p className="pointer-events-none absolute top-8 left-6 z-[2] text-[0.7rem] uppercase tracking-[0.35em] text-gold sm:left-10 lg:left-16">
            {caption}
          </p>
        ) : null}

        {/* Scroll gauge. Ticks mark the planes; the bar under the active tick
            fills as the current notch charges, so "one scroll moves one" is
            visible rather than something you have to infer. */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-10 left-6 z-[2] flex items-center gap-4 sm:left-10 lg:left-16"
        >
          <div className="flex items-center gap-1.5">
            {layers.map((_, i) => (
              <span
                key={i}
                className="relative block h-[3px] w-8 overflow-hidden bg-cream/20"
              >
                <span
                  className="absolute inset-y-0 left-0 bg-gold transition-[width] duration-150 ease-out"
                  style={{
                    width:
                      i < index
                        ? "100%"
                        : i === index
                          ? `${armed ? Math.max(12, charge * 100) : 100}%`
                          : "0%",
                  }}
                />
              </span>
            ))}
          </div>

          <p className="font-sans text-[0.62rem] uppercase tracking-[0.28em] text-cream/45">
            {atEnd ? (
              "Scroll on"
            ) : (
              <>
                <span className="text-gold">{index + 1}</span>
                <span className="text-cream/30"> / {total}</span>
                <span className="ml-3 text-cream/35">One scroll · one line</span>
              </>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
