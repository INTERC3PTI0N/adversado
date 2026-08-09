"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import RippleDistortion from "@/components/reactbits/RippleDistortion";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  WebGLRenderer,
} from "three";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const CREAM = 0xf9f7f2;
const NAVY = "#1F355E";

/**
 * The page's whole background: three sheets of constellations at different
 * depths, each scrolled at its own rate.
 *
 * Parallax rather than a camera dolly. A dolly moves one field and depth has
 * to be inferred from perspective alone; separate sheets travelling at
 * different speeds is the thing the eye actually reads as distance, and it is
 * what makes a long scroll feel like passing through a space instead of
 * zooming at a picture of one. `rate` is how far a sheet travels over the full
 * document and `lean` how much of the pointer offset it takes — both fall off
 * with depth, so the near stars race and the far ones barely stir.
 *
 * Points only: no geometry, no lit surfaces, no post-processing. This runs
 * behind every section on the page for the whole visit, so it has to be close
 * to free.
 */
const LAYERS = [
  // near → far. Each sheet is sized to stay wider and taller than its own
  // frustum plus its full travel, or scrolling would drag its edge into shot.
  { count: 260, spreadX: 34, spreadY: 36, z: -8, size: 0.075, opacity: 0.95, rate: 16, lean: 1.6, drift: 0.5 },
  { count: 420, spreadX: 60, spreadY: 42, z: -22, size: 0.05, opacity: 0.6, rate: 8, lean: 0.9, drift: 0.32 },
  { count: 640, spreadX: 110, spreadY: 64, z: -46, size: 0.032, opacity: 0.35, rate: 3.5, lean: 0.4, drift: 0.18 },
];

/**
 * The three star sheets as a ready-made group.
 *
 * Extracted so the preloader's orb scene (BrandOrb.tsx) renders the *same*
 * constellations the page itself does, rather than a second field with its own
 * count, colour and spread that then has to be kept in sync by hand. The
 * caller owns the group and the disposal; `sheets` is handed back because
 * CinematicScene drives each one's parallax individually.
 */
export function createStarSheets() {
  const group = new Group();
  const sheets = LAYERS.map((L) => {
    const pos = new Float32Array(L.count * 3);
    for (let i = 0; i < L.count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * L.spreadX;
      pos[i * 3 + 1] = (Math.random() - 0.5) * L.spreadY;
      // A little thickness per sheet, so a layer never reads as a decal.
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(pos, 3));
    const points = new Points(
      geo,
      new PointsMaterial({
        color: new Color(CREAM),
        size: L.size,
        transparent: true,
        opacity: L.opacity,
        blending: AdditiveBlending,
        depthWrite: false,
      })
    );
    points.position.z = L.z;
    group.add(points);
    return { points, geo, L };
  });
  return { group, sheets };
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Time constant for the scroll smoothing, in seconds — how long the sky takes
 * to catch up to where the scrollbar already is. Replaces ScrollTrigger's
 * `scrub: 0.6`. */
const SCRUB_TAU = 0.14;

export function CinematicScene() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new Scene();
    const camera = new PerspectiveCamera(52, 1, 0.1, 200);
    const renderer = new WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const canvas = renderer.domElement;
    // z-index 1 puts the stars above the sky gradient.
    canvas.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;display:block;z-index:1";
    host.appendChild(canvas);

    // Every sheet hangs off one group rather than going straight into the
    // scene, so the reveal pulse below can scale the whole sky as a unit
    // without disturbing each sheet's own parallax position.
    const { group: universe, sheets } = createStarSheets();
    scene.add(universe);

    camera.position.set(0, 0, 0);

    // The reveal pulse: this scene runs the whole visit, hidden under the
    // preloader until it hands off. On that handoff the preloader's own
    // tunnel push is still carrying the reader forward, so the sky picks
    // that motion up rather than just appearing — held right back at a tenth
    // of its resting size until the event fires, then rushing up over about
    // three seconds. Starting this far out is the point: the reader watches
    // the whole sky close on them, on the same move the headline arrives on.
    let revealed = false;
    let revealScale = 0.1;
    const onReveal = () => {
      revealed = true;
    };
    window.addEventListener("adversado:reveal", onReveal);

    const resize = () => {
      const w = host.clientWidth || window.innerWidth;
      const h = host.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      if (reduced) renderer.render(scene, camera);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    // Reduced motion still gets the sky, just a still one: a black page with
    // nothing on it is a worse answer than a background that doesn't move.
    // No reveal pulse either — held at its resting scale from the first frame.
    if (reduced) {
      universe.scale.setScalar(1);
      sheets.forEach(({ points, L }) => {
        (points.material as PointsMaterial).opacity = L.opacity * 0.12;
      });
      renderer.render(scene, camera);
      return () => {
        window.removeEventListener("adversado:reveal", onReveal);
        ro.disconnect();
        renderer.dispose();
        sheets.forEach((s) => s.geo.dispose());
        host.removeChild(canvas);
      };
    }

    // Pointer parallax, held as a target and eased in the frame loop so a fast
    // flick glides rather than snapping the whole sky sideways.
    const aim = { x: 0, y: 0 };
    const eased = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      aim.x = (e.clientX / window.innerWidth - 0.5) * 0.5;
      aim.y = (e.clientY / window.innerHeight - 0.5) * 0.3;
    };
    window.addEventListener("pointermove", onMove);

    // Scroll progress is measured in the frame loop rather than pushed in by a
    // ScrollTrigger. The preloader holds the page scroll-locked for its whole
    // run, so a trigger created at mount caches a range measured against a
    // document that cannot scroll — and it never recovers on its own once the
    // lock lifts, leaving progress pinned at 0 for the rest of the visit.
    // Measuring on the frame that uses it can't go stale, and the `scrub` this
    // replaces is just the easing below.
    const shot = { progress: 0, eased: 0 };
    const readProgress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      shot.progress = max > 0 ? clamp01(window.scrollY / max) : 0;
    };

    let raf = 0;
    let lastFrame = performance.now();
    const clock = { t: 0 };
    const frame = () => {
      raf = requestAnimationFrame(frame);
      clock.t += 0.004;
      readProgress();
      // Stands in for the old `scrub: 0.6` — a fast flick glides the sky in
      // rather than snapping it. Eased against elapsed time rather than per
      // frame: a fixed per-frame fraction runs twice as fast on a 120Hz screen
      // as on a 60Hz one, and crawls to a stop in a backgrounded tab where rAF
      // is throttled to a few frames a second. `dt` is capped so returning to a
      // parked tab catches up in one step instead of jumping.
      const now = performance.now();
      const dt = Math.min(0.1, (now - lastFrame) / 1000);
      lastFrame = now;
      shot.eased += (shot.progress - shot.eased) * (1 - Math.exp(-dt / SCRUB_TAU));
      const p = shot.eased;
      eased.x += (aim.x - eased.x) * 0.05;
      eased.y += (aim.y - eased.y) * 0.05;

      if (revealed && revealScale < 0.999) {
        revealScale += (1 - revealScale) * 0.035;
        universe.scale.setScalar(revealScale);
      }

      for (const { points, L } of sheets) {
        (points.material as PointsMaterial).opacity = L.opacity;
        // The parallax itself: sheets rise past the viewport at rates set by
        // their depth, which is the whole effect.
        points.position.y = p * L.rate + eased.y * L.lean * 2;
        points.position.x = -eased.x * L.lean * 2 + Math.sin(clock.t * L.drift) * 0.6;
        // A hair of roll, scaled the same way, so the near sheet has some life
        // of its own when the page is sitting still.
        points.rotation.z = Math.sin(clock.t * L.drift * 0.7) * 0.02 * L.lean;
      }

      renderer.render(scene, camera);
    };
    frame();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("adversado:reveal", onReveal);
      renderer.dispose();
      sheets.forEach((s) => s.geo.dispose());
      host.removeChild(canvas);
    };
  }, []);

  return (
    <div
      ref={hostRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[2]"
      style={{ background: "transparent" }}
    >
      {/* Under the stars (the canvas is given z-index 1 when it is appended):
          the night-sky wallpaper from the actual landing page — /night-sky.svg
          driven by the ripple shader. Sky + stars only — the Kerala horizon
          silhouette (nets, hills, boats) was removed. */}
      <div className="absolute inset-0" style={{ zIndex: 0, background: NAVY }}>
        <RippleDistortion
          src="/night-sky.svg"
          grayscale={false}
          tint="#7fb0ff"
          tintAmount={0.18}
          highlightColor="#e8f0ff"
          glint={0.3}
          strength={0.12}
          swirl={0.55}
          rings={3}
          dispersion={0.07}
          brushSize={190}
          quality="medium"
        />
      </div>
      {/* The landing page's own vignette — keeps the wallpaper from swallowing
          the type where the two overlap. */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 0,
          background:
            "radial-gradient(ellipse 70% 60% at 50% 46%, rgba(5,10,22,0.72), rgba(5,10,22,0) 75%)",
        }}
      />
    </div>
  );
}

/**
 * CURRENTLY UNMOUNTED. HomeSections runs the parallax constellations alone
 * for now; this is kept whole so the figure can be switched back on by
 * putting <PeachScene /> back under <CinematicScene />. Note that nothing
 * sets `__pwSceneReady` for the preloader to wait on any more — the preloader
 * no longer gates its exit on it, so that flag would need rewiring too.
 *
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
