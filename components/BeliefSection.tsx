"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  BoxGeometry,
  Color,
  EdgesGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";
import { RepelText } from "@/components/Interactions";
import { Magnify } from "@/components/Magnify";
import { ScrollReveal } from "@/components/ScrollReveal";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const GOLD = 0xe6b325;
const CREAM = 0xf9f7f2;

const FLOORS = 40;
const FLOOR_H = 1.2;

/**
 * Wireframe monolith: forty tapering slabs around a constant central core.
 *
 * It is the section's argument as an object — the core never changes width
 * while everything outside it narrows floor by floor, which is the whole
 * point about brands being built by the same thing repeated rather than by
 * any one launch. Every fifth slab is picked out in gold so the repetition
 * is legible instead of turning into a texture.
 *
 * Raw three.js on its own canvas rather than a share of the page's cinematic
 * scene: this object has to sit in its own pane, framed by its own camera.
 */
function Monolith() {
  const hostRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const scene = new Scene();
    const camera = new PerspectiveCamera(45, 1, 0.1, 1000);
    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const canvas = renderer.domElement;
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
    host.appendChild(canvas);

    const faint = new LineBasicMaterial({ color: new Color(CREAM), transparent: true, opacity: 0.22 });
    const marker = new LineBasicMaterial({ color: new Color(GOLD), transparent: true, opacity: 0.85 });

    const group = new Group();
    scene.add(group);

    const geos: (BoxGeometry | EdgesGeometry)[] = [];
    for (let i = 0; i < FLOORS; i++) {
      const taper = 1 - (i / FLOORS) * 0.4;
      const slab = new BoxGeometry(10 * taper, FLOOR_H, 10 * taper);
      const slabEdges = new EdgesGeometry(slab);
      const line = new LineSegments(slabEdges, i % 5 === 0 ? marker : faint);
      line.position.y = i * FLOOR_H;
      group.add(line);

      const core = new BoxGeometry(2, FLOOR_H, 2);
      const coreEdges = new EdgesGeometry(core);
      const coreLine = new LineSegments(coreEdges, faint);
      coreLine.position.y = i * FLOOR_H;
      group.add(coreLine);

      geos.push(slab, slabEdges, core, coreEdges);
    }

    // The tower is 48 units tall in a frame that is now landscape rather than
    // full-height, so the dolly distance is derived from the box's aspect:
    // the wider and shorter the panel, the further back the camera has to sit
    // for the whole structure to fit inside it.
    let fit = 1;
    const resize = () => {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      fit = Math.max(1, Math.min(2.2, (w / h) / 0.85));
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    let raf = 0;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const p = progressRef.current;
      group.rotation.y += 0.002;
      // Scroll rides the tower: the group lifts while the camera drops, so
      // passing the section reads as craning down the structure.
      group.position.y = p * 20;
      camera.position.set(21 * fit, 38 - p * 24, 35 * fit);
      camera.lookAt(0, 24 - p * 12, 0);
      renderer.render(scene, camera);
    };
    frame();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      geos.forEach((g) => g.dispose());
      faint.dispose();
      marker.dispose();
      renderer.dispose();
      host.removeChild(canvas);
    };
  }, []);

  useGSAP(() => {
    const st = ScrollTrigger.create({
      trigger: hostRef.current,
      start: "top bottom",
      end: "bottom top",
      scrub: 0.5,
      onUpdate: (self) => {
        progressRef.current = self.progress;
      },
    });
    return () => st.kill();
  }, []);

  return <div ref={hostRef} aria-hidden className="absolute inset-0" />;
}

/** Small uppercase HUD label. Montserrat, per the brand book's primary face. */
function Micro({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`block text-[0.6rem] font-medium uppercase tracking-[0.25em] text-cream/50 ${className ?? ""}`}
    >
      {children}
    </span>
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
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <section ref={ref} className="relative px-6 py-28 sm:px-10 sm:py-36 lg:px-16">
      <div className="mx-auto max-w-[1500px]">
        {/* ── Row 1: the headline, across the whole width ───────────────── */}
        <div data-reveal className="text-center">
          <Micro>01 // The Belief</Micro>
        </div>
        <h2
          data-reveal
          className="mx-auto mt-8 max-w-[22ch] text-center font-serif text-[clamp(2.5rem,5.5vw,4.75rem)] font-light leading-[1.1] tracking-[-0.01em] text-cream"
        >
          Brands aren’t built in <Hit>launches.</Hit>
        </h2>

        {/* ── Row 2: the object, then the argument ──────────────────────── */}
        <div className="mt-20 grid items-stretch gap-10 md:mt-28 md:grid-cols-2 md:gap-0">
          {/* The panel the tower lives in. A real box now rather than a
              full-height pane, so the camera is framed to its aspect. */}
          <div
            data-reveal
            className="relative h-[42vh] min-h-[200px] md:h-[60vh] md:pr-14"
          >
            <Monolith />

            <span className="pointer-events-none absolute left-0 top-1/2 origin-left -translate-y-1/2 -rotate-90">
              <Micro>Memory, not applause</Micro>
            </span>
          </div>

          {/* Hairline between the two, the way the schematic draws it. Only
              once there is a side-by-side to divide. */}
          <div className="flex flex-col justify-center md:border-l md:border-cream/15 md:pl-14">
            <p
              data-reveal
              className="mt-8 max-w-[26ch] font-sans text-[clamp(1.5rem,2.6vw,2.4rem)] font-light leading-[2.5] text-cream/85"
            >
              They’re built in the{" "}
              <Magnify className="font-bold italic text-gold">unglamorous</Magnify> act of
              being unmistakably yourself, everywhere, every time, for years.
            </p>
          </div>
        </div>

        {/* ── Row 3: the statement, full width and loud ─────────────────── */}
        <div data-reveal className="mt-24 md:mt-32">
          <span className="block h-px w-full bg-cream/15" />
        </div>
        {/* No `data-reveal` here: the section's own fade would be writing
            opacity to the same element the word scrub is animating, and the
            two would fight. This paragraph reveals itself. */}
        <ScrollReveal className="mt-12 font-sans text-[clamp(1.85rem,4.4vw,4rem)] font-light leading-[2.5] tracking-[-0.015em] text-cream/70">
          The campaign <Hit>ends.</Hit> The event gets <Hit>packed down.</Hit> The post{" "}
          <Hit>scrolls away.</Hit> What stays is whatever people <Hit>remember.</Hit> So
          that’s what we build for. The <Hit>memory,</Hit> not the applause.
        </ScrollReveal>

        {/* ── Row 4: what it all resolves to ───────────────────────────── */}
        <p
          data-reveal
          className="mt-24 text-center font-serif text-[clamp(1.75rem,3.8vw,3rem)] leading-[1.2] text-gold md:mt-32"
        >
          <RepelText text="Attention is rented. Memory is owned." radius={110} strength={16} />
        </p>
      </div>
    </section>
  );
}
