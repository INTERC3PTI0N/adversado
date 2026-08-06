"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  WebGLRenderer,
} from "three";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const CREAM = 0xf9f7f2;

/**
 * The scene the whole page happens inside.
 *
 * One fixed canvas behind every section, not a canvas per section: the point
 * is that scrolling moves a camera through a single continuous space, so the
 * sections read as shots in one take rather than seven separate pages. Scroll
 * progress over the whole document is the only input — it drives the camera
 * dolly and the field's turn through GSAP's scrub, so the motion is tied to
 * the scrollbar rather than to time and reverses exactly on the way back up.
 *
 * Points only: no geometry, no lit surfaces, no post-processing. On a page
 * that already runs a wireframe monolith in the Belief pane and an authored
 * scene in an iframe, this context has to be close to free.
 *
 * Composited ABOVE the authored scene, not behind it. That scene's renderer
 * clears its canvas opaque — nulling its background yields a light grey field
 * rather than transparency, which is what was washing the stars out. Stacking
 * the field on top instead sidesteps that entirely: these are additive points
 * on a transparent canvas, so they land on the scene's own black and read as
 * one continuous night rather than two layers.
 */
export function CinematicScene() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const scene = new Scene();
    const camera = new PerspectiveCamera(52, 1, 0.1, 200);
    const renderer = new WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const canvas = renderer.domElement;
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
    host.appendChild(canvas);

    // Dust. Spread over a deep box rather than a shell so the camera actually
    // travels through it and the dolly reads as depth.
    const COUNT = 900;
    const pos = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 26;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    const dustGeo = new BufferGeometry();
    dustGeo.setAttribute("position", new BufferAttribute(pos, 3));
    const dust = new Points(
      dustGeo,
      new PointsMaterial({
        color: new Color(CREAM),
        size: 0.035,
        transparent: true,
        opacity: 0.55,
        blending: AdditiveBlending,
        depthWrite: false,
      })
    );
    scene.add(dust);

    camera.position.set(0, 0, 9);

    const resize = () => {
      const w = host.clientWidth || window.innerWidth;
      const h = host.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    // Pointer parallax, held as a target and eased in the frame loop so a fast
    // flick glides rather than snapping the whole scene sideways.
    const aim = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      aim.x = (e.clientX / window.innerWidth - 0.5) * 0.5;
      aim.y = (e.clientY / window.innerHeight - 0.5) * 0.3;
    };
    window.addEventListener("pointermove", onMove);

    // Written by the ScrollTrigger below, read by the frame loop.
    const shot = { progress: 0 };

    const st = ScrollTrigger.create({
      trigger: document.documentElement,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.6,
      onUpdate: (self) => {
        shot.progress = self.progress;
      },
    });

    let raf = 0;
    const clock = { t: 0 };
    const frame = () => {
      raf = requestAnimationFrame(frame);
      clock.t += 0.004;
      const p = shot.progress;

      // The dolly: 9 units out at the top of the page, 3.2 by the footer.
      camera.position.z += (9 - 5.8 * p - camera.position.z) * 0.08;
      camera.position.x += (aim.x * 2 - camera.position.x) * 0.05;
      camera.position.y += (-aim.y * 2 - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      // The starfield turns with the page as well as drifting on its own, so
      // scrolling swings the field rather than only pushing the camera through
      // it.
      dust.rotation.y = clock.t * 0.12 + p * 0.9;
      dust.rotation.x = Math.sin(clock.t * 0.4) * 0.06 + p * 0.25;

      renderer.render(scene, camera);
    };
    frame();

    return () => {
      cancelAnimationFrame(raf);
      st.kill();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      renderer.dispose();
      dustGeo.dispose();
      host.removeChild(canvas);
    };
  }, []);

  return (
    <div
      ref={hostRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[2]"
      style={{ background: "transparent" }}
    />
  );
}

/**
 * The authored PeachWeb scene (website/references/3D scene), run by its own
 * runtime inside a same-origin iframe rather than re-created by hand: the
 * scene file carries camera keyframes, materials and video textures that its
 * 2.6MB bundle knows how to play and this page has no business re-implementing.
 *
 * The copy under public/pw-scene is the authored scene verbatim, keeping its
 * black background: the starfield is layered over this iframe rather than
 * behind it, so the scene never has to be made see-through.
 *
 * The iframe never receives input (pointer-events: none). Its scroll is
 * proxied: page progress is mapped onto the iframe document's own scroll
 * range every frame, so the authored scroll animation plays as the site
 * scrolls. Pointer moves are forwarded for the scene's hover response.
 */
type PwWindow = Window & { __pwSceneReady?: boolean };

export function PeachScene() {
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = ref.current;
    if (!iframe) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Nothing will load, so nothing can report loaded — release the
      // preloader immediately rather than leaving it on its timeout.
      (window as PwWindow).__pwSceneReady = true;
      return;
    }

    let raf = 0;
    const sync = () => {
      raf = requestAnimationFrame(sync);
      const win = iframe.contentWindow;
      const doc = iframe.contentDocument;
      if (!win || !doc || !doc.documentElement) return;
      // Ready = the runtime has a canvas up AND both GLBs have finished
      // downloading (same-origin, so its resource timing is readable).
      // The preloader holds its exit on this flag.
      if (!(window as PwWindow).__pwSceneReady && doc.querySelector("canvas")) {
        const glbs = win.performance
          .getEntriesByType("resource")
          .filter((r) => r.name.endsWith(".glb") && (r as PerformanceResourceTiming).responseEnd > 0);
        if (glbs.length >= 2) (window as PwWindow).__pwSceneReady = true;
      }
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      const innerMax = doc.documentElement.scrollHeight - win.innerHeight;
      if (innerMax > 0) win.scrollTo(0, p * innerMax);
    };
    sync();

    const forward = (e: PointerEvent) => {
      const doc = iframe.contentDocument;
      if (!doc) return;
      // Both event names: the runtime is a black box and may listen to either.
      for (const type of ["pointermove", "mousemove"] as const) {
        doc.dispatchEvent(
          new MouseEvent(type, { clientX: e.clientX, clientY: e.clientY, bubbles: true })
        );
      }
    };
    window.addEventListener("pointermove", forward, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", forward);
    };
  }, []);

  return (
    <iframe
      ref={ref}
      src="/pw-scene/index.html"
      title=""
      aria-hidden
      tabIndex={-1}
      className="pointer-events-none fixed inset-0 z-[1] h-full w-full border-0"
      style={{ background: "transparent", colorScheme: "normal" }}
    />
  );
}

/**
 * Box transition. A solid block sweeps across the content, and the content is
 * only made visible while the block is covering it — so the reveal is the
 * block passing, not a fade underneath one. In on the left edge, out on the
 * right, which is why the two `transformOrigin`s differ.
 *
 * `once: true`: these are statements, and re-playing them every time the
 * reader scrolls back up turns the page into a slot machine.
 */
export function BoxReveal({
  children,
  color = "#e6b325",
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  color?: string;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const block = ref.current!.querySelector("[data-box]");
        const body = ref.current!.querySelector("[data-body]");
        gsap
          .timeline({
            delay,
            scrollTrigger: { trigger: ref.current, start: "top 88%", once: true },
          })
          .set(body, { autoAlpha: 0 })
          .fromTo(
            block,
            { scaleX: 0, transformOrigin: "left center" },
            { scaleX: 1, duration: 0.42, ease: "power3.inOut" }
          )
          .set(body, { autoAlpha: 1 })
          .to(block, { scaleX: 0, transformOrigin: "right center", duration: 0.42, ease: "power3.inOut" });
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <span ref={ref} className={`relative block ${className ?? ""}`}>
      {/* Visible by default: if the trigger never fires — no JS, an oddly
          sized viewport, reduced motion — the copy is simply there. */}
      <span data-body className="block">
        {children}
      </span>
      <span
        data-box
        aria-hidden
        className="pointer-events-none absolute inset-0 origin-left"
        style={{ background: color, transform: "scaleX(0)" }}
      />
    </span>
  );
}

/**
 * Depth reveal for running copy: the block rotates up off its own baseline as
 * if hinged into the page. Applied to `[data-depth]` inside the scope so a
 * section tags its paragraphs and gets the whole stagger for one hook call.
 */
export function useDepthReveal<T extends HTMLElement>(stagger = 0.09) {
  const ref = useRef<T>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // `from`, so the resting state in the markup is the visible one.
        gsap.from("[data-depth]", {
          autoAlpha: 0,
          y: 48,
          rotateX: -42,
          transformPerspective: 900,
          transformOrigin: "50% 100%",
          duration: 0.9,
          ease: "power3.out",
          stagger,
          scrollTrigger: { trigger: ref.current, start: "top 78%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return ref;
}
