"use client";

import { useEffect, useRef, useState } from "react";
import Spline from "@splinetool/react-spline";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { COMMIT_SNAP } from "@/components/Hero";
import { RepelText } from "@/components/Interactions";
import { Magnify } from "@/components/Magnify";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Typewriter } from "@/components/Typewriter";
import { CLIP_FULL, CLIP_LEAVE } from "@/components/ClipScrollPanel";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const CLOSING_LINE = "everywhere, every time, for years.";
/** Same deliberate per-character pace as the hero's "WHY?" — long enough to
 *  read as speech, not a rattle. */
const CLOSING_TYPE_SPEED_MS = 48;

/** The size the scene is framed for. Spline positions its camera in world
 *  units rather than CSS pixels, so shrinking the canvas crops the scene
 *  instead of zooming it out — on a phone that cut the keyboard in half. */
const SCENE_W = 800;
const SCENE_H = 1000;

/** Renders the scene at its design size and scales the whole canvas to fit the
 *  available box, so the framing is identical on a phone and a desktop. */
function FitScene({ scene }: { scene: string }) {
  const box = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const [scale, setScale] = useState(0);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setScale(Math.min(width / SCENE_W, height / SCENE_H));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={box}
      className="relative h-full min-h-0 w-full overflow-hidden"
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => setHovering(false)}
      onPointerMove={(e) => {
        const tip = tipRef.current;
        const el = box.current;
        if (!tip || !el) return;
        const r = el.getBoundingClientRect();
        tip.style.transform = `translate3d(${e.clientX - r.left + 14}px, ${e.clientY - r.top + 14}px, 0)`;
      }}
    >
      <div
        className="absolute left-1/2 top-1/2 origin-center"
        style={{
          width: SCENE_W,
          height: SCENE_H,
          // Held invisible until the first measurement, or it paints once at
          // full size and jumps.
          visibility: scale ? "visible" : "hidden",
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        <Spline scene={scene} className="h-full w-full" />
      </div>
      <span
        ref={tipRef}
        aria-hidden
        className={`pointer-events-none absolute left-0 top-0 z-10 font-sans text-[0.65rem] font-medium uppercase tracking-[0.28em] text-white transition-opacity duration-200 ${
          hovering ? "opacity-100" : "opacity-0"
        }`}
      >
        press me
      </span>
    </div>
  );
}

/** A word in the closing statement that carries the weight, in brand gold. */
function Hit({ children }: { children: React.ReactNode }) {
  return <span className="font-bold text-gold">{children}</span>;
}

/**
 * The Belief, in four stacked rows: the headline across the top, then the
 * object beside the argument, then the statement full-bleed, then the line
 * it all resolves to. Hairlines instead of panels, and no background of its
 * own — the page's scene runs straight through underneath, which is what
 * keeps the site reading as one space rather than a stack of coloured bands.
 */
export function BeliefSection() {
  const ref = useRef<HTMLElement>(null);
  const memoryRef = useRef<HTMLElement>(null);
  // Latches true the first time the Belief section fully arrives; the typed
  // line stays after that — never cleared on leave, never remounted away.
  const [closingOn, setClosingOn] = useState(false);
  // Bumps each time the navy section fully enters — reveal replays on arrival
  // only. Never cleared on leave, so the text does not vanish mid-wipe.
  const [memoryPlayId, setMemoryPlayId] = useState(0);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-reveal]", {
          autoAlpha: 0,
          y: 24,
          duration: 1,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: ref.current, start: "top 72%", once: true },
        });

        // Receiving half of the hero fly-through. Short runway to match the
        // hero's tight pin — settles as soon as the section top clears the
        // lower third, not mid-viewport.
        //
        // Animate the inner block, not the <section>: ScrollTrigger measures
        // a trigger's transformed box, and scaling the trigger feeds back on
        // itself. Origin near the top so the first line isn't parked below
        // the fold at small scale. No blur — Spline would re-raster every frame.
        gsap.from("[data-zoom]", {
          scale: 0.72,
          opacity: 0.35,
          transformOrigin: "50% 10%",
          ease: "none",
          scrollTrigger: {
            trigger: ref.current,
            start: "top bottom",
            end: "top 68%",
            scrub: true,
            snap: COMMIT_SNAP,
          },
        });

        // Type once the section has fully arrived. Leave the finished line
        // alone after that — no hide on leave, no remount on scroll-back.
        ScrollTrigger.create({
          trigger: ref.current,
          start: "top top",
          end: "bottom bottom",
          onEnter: () => setClosingOn(true),
          onEnterBack: () => setClosingOn(true),
        });

        // Memory / campaign panel: snap + pin to park full-screen from Belief.
        // Leave clip (pack 51) still scrubs after the pin as Welcome opens.
        const PANEL_SNAP = {
          snapTo: (value: number, self?: { direction: number }) => {
            if (value <= 0.001 || value >= 0.999) return value;
            const goingBack = self && self.direction === -1;
            if (goingBack) return value < 0.94 ? 0 : 1;
            return value > 0.06 ? 1 : 0;
          },
          duration: { min: 0.05, max: 0.14 },
          delay: 0,
          inertia: false,
          ease: "power2.inOut",
        } as const;

        ScrollTrigger.create({
          trigger: memoryRef.current,
          start: "top bottom",
          end: "top top",
          snap: PANEL_SNAP,
        });
        ScrollTrigger.create({
          trigger: memoryRef.current,
          start: "top top",
          end: "+=50%",
          pin: true,
          snap: PANEL_SNAP,
          onEnter: () => setMemoryPlayId((n) => n + 1),
          onEnterBack: () => setMemoryPlayId((n) => n + 1),
        });

        const memory = memoryRef.current;
        if (memory) {
          gsap.set(memory, { clipPath: CLIP_FULL });
          ScrollTrigger.create({
            trigger: memory,
            start: "bottom bottom",
            end: "bottom top",
            scrub: 0.5,
            animation: gsap.fromTo(
              memory,
              { clipPath: CLIP_FULL },
              { clipPath: CLIP_LEAVE, ease: "none" }
            ),
          });
        }
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        setClosingOn(true);
        setMemoryPlayId((n) => n + 1);
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [] }
  );

  return (
    <>
    <section ref={ref} className="relative px-6 py-28 sm:px-10 sm:py-36 lg:px-16">
      <div data-zoom className="mx-auto max-w-[1500px]">
        {/* ── Row 1: the headline, across the whole width ───────────────── */}
        {/* Matched to every other section's eyebrow (gold, `text-sm`,
            `0.35em`). It was the only one set in cream at `Micro` size, and
            the only one carrying a number — with no 02 or 03 anywhere on the
            page, the "01 //" was sequence notation for a sequence that
            doesn't exist. */}
        <p data-reveal className="mb-8 text-center text-sm uppercase tracking-[0.35em] text-gold">
          The Belief
        </p>
        <h2
          data-reveal
          className="mx-auto max-w-[18ch] text-center font-sans text-[clamp(2.75rem,7vw,5.75rem)] font-black leading-[1.02] tracking-[-0.03em] text-cream"
        >
          Brands aren’t built in <span className="text-gold">launches.</span>
        </h2>

        {/* ── Row 2: the argument, then the object ──────────────────────── */}
        <div className="mt-10 grid items-stretch gap-12 md:mt-14 md:grid-cols-2 md:gap-0">
          {/* Hairline between the two once there is a side-by-side to divide —
              stays on this column so it runs the full row height. */}
          <div className="flex flex-col justify-start md:border-r md:border-cream/15 md:pr-16 lg:pr-20">
            <p
              data-reveal
              className="max-w-[20ch] font-sans text-[clamp(1.85rem,3.4vw,3.15rem)] font-light leading-[1.35] tracking-[-0.02em] text-cream"
            >
              They’re built in the{" "}
              <Magnify className="font-semibold not-italic text-gold">unglamorous</Magnify>{" "}
              act of being{" "}
              <span className="font-medium text-cream">unmistakably yourself</span>
              <span className="text-cream/55">,</span>
            </p>
            {/* No data-reveal: opacity from the section fade would fight the
                Typewriter remount. Spacer keeps the line's height reserved. */}
            <p
              className="mt-14 max-w-[16ch] font-serif text-[clamp(1.7rem,3.6vw,2.85rem)] font-bold italic leading-[1.3] tracking-[-0.015em] text-white md:mt-20"
              style={{
                textShadow:
                  "0 0 18px rgba(249,247,242,0.45), 0 0 42px rgba(230,179,37,0.28)",
              }}
            >
              {closingOn ? (
                <Typewriter
                  text={CLOSING_LINE}
                  speed={CLOSING_TYPE_SPEED_MS}
                  persistCaret
                  className="[&_.caret]:text-white"
                />
              ) : (
                <span aria-hidden className="invisible">
                  {CLOSING_LINE}
                </span>
              )}
            </p>
          </div>

          {/* Scene fills the panel; copy sits under the object, over the field. */}
          <div
            data-reveal
            className="relative aspect-[4/5] max-h-[85vh] w-full md:aspect-[3/4] md:pl-16 lg:pl-20"
          >
            <style>{`.spline-watermark { display: none !important; }`}</style>
            <div className="absolute inset-0 md:left-16 lg:left-20">
              <FitScene scene="https://prod.spline.design/GLgtPJT5x743jtOQ/scene.splinecode" />
            </div>
            <p className="pointer-events-none absolute inset-x-0 bottom-[6%] z-10 px-5 font-sans text-[clamp(1.05rem,2vw,1.4rem)] font-medium leading-[1.45] tracking-tight text-cream/75 md:left-16 md:right-4 lg:left-20">
              <span className="rounded-[0.3em] bg-gold/18 px-[0.28em] py-[0.06em] font-semibold text-gold [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
                Copy + paste
              </span>{" "}
              doesn’t work.
              <span className="mt-2 block font-semibold tracking-[-0.01em] text-cream">
                We build what <span className="text-gold">stays.</span>
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* Full-bleed navy field: the argument resolves here. One job — land
        the memory line. Snaps binary — fully on, or fully off. */}
    <section
      id="campaign"
      ref={memoryRef}
      className="relative z-10 flex h-screen w-full items-center overflow-hidden bg-navy px-6 py-24 will-change-[clip-path] sm:px-10 sm:py-28 lg:px-16"
    >
      <div className="mx-auto flex w-full max-w-[1500px] flex-col justify-center">
        {/* Reveal replays only when this section re-enters; it stays put
            once played so the wipe out does not blank the copy mid-frame. */}
        <ScrollReveal
          scrub={false}
          playId={memoryPlayId}
          className="font-sans text-[clamp(1.85rem,4.4vw,4rem)] font-light leading-[2] tracking-[-0.015em] text-cream/70"
        >
          The campaign <Hit>ends.</Hit> The event gets <Hit>packed down.</Hit> The post{" "}
          <Hit>scrolls away.</Hit> What stays is whatever people <Hit>remember.</Hit> So
          that’s what we build for. The <Hit>memory,</Hit> not the applause.
        </ScrollReveal>

        {/* Split headline: the rented half stays quiet; the owned half is the
            stamp you leave with — display weight, full width, pointer-reactive. */}
        <div className="mt-16 md:mt-24">
          <p className="font-sans text-[clamp(1.35rem,3.2vw,2.35rem)] font-semibold tracking-[-0.02em] text-cream/40">
            Attention is rented.
          </p>
          <p className="mt-3 max-w-[12ch] font-sans text-[clamp(2.75rem,10vw,7.25rem)] font-black leading-[0.92] tracking-[-0.04em] text-gold md:mt-4">
            <RepelText text="Memory is owned." radius={140} strength={22} />
          </p>
        </div>
      </div>
    </section>
    </>
  );
}
