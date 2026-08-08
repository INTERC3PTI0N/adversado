"use client";

import { useEffect, useMemo, useRef } from "react";
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

/**
 * The landing. The page opens on the landing page's own night sky — the
 * /night-sky.svg wallpaper under the ripple shader — and the scrollbar is what
 * flies the ground in underneath it: the stars stay lit, atmosphere stays put,
 * and Kerala arrives under the sky a little under halfway down.
 *
 * The numbers below are fractions of the whole document, so the landing is
 * paced by the page rather than by a clock — a reader who scrolls slowly gets a
 * slow approach, which is the point of hanging it off scroll at all.
 */
/** The ground arrives once the reader is partway down the page. */
const LAND_START = 0.44;
const LAND_END = 0.86;

/**
 * The horizon, in three bands. `rise` is how far below the frame a band starts
 * — the far hills barely climb, the near bank swings up a long way, which is
 * what gives the landing depth. `parallax` is how far the band keeps drifting
 * for the rest of the scroll: the whole reason the background reads as further
 * away than the copy is that it moves less than the copy does.
 */
const BANDS = [
  { rise: 90, parallax: 34 }, // far: the hill line
  { rise: 190, parallax: 88 }, // mid: the Chinese fishing nets and the houseboat
  { rise: 330, parallax: 176 }, // near: the bank and the snake boat
];

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Time constant for the scroll smoothing, in seconds — how long the sky takes
 * to catch up to where the scrollbar already is. Replaces ScrollTrigger's
 * `scrub: 0.6`. */
const SCRUB_TAU = 0.14;

/**
 * Kerala, in silhouette — what the descent lands on.
 *
 * Everything here is a shape rather than a picture: at background weight, under
 * copy, at whatever size the viewport is, a silhouette is all that survives
 * anyway, and it stays out of the way of the text on top of it. The vocabulary
 * is Kochi's own — the cantilevered Chinese fishing nets on the harbour, a
 * kettuvallam on the backwaters, and a chundan vallam snake boat — drawn once
 * in `defs` and placed with `use`.
 *
 * A crowd of Open Peeps sprites used to walk along the foot of this, on
 * Skiper UI's canvas. It has been removed. `components/ui/skiper-ui/skiper39`,
 * `public/images/peeps/*` and `scripts/build-peep-sheet.py` are all dead now
 * and can be deleted.
 */
function KeralaHorizon({ attach }: { attach: ((el: SVGGElement | null) => void)[] }) {
  // Pulled out into named callbacks rather than indexed inline: `ref={attach[i]}`
  // reads to the react-hooks lint as a ref being dereferenced during render.
  const [attachFar, attachMid, attachNear] = attach;
  return (
    <svg
      viewBox="0 0 1600 420"
      preserveAspectRatio="xMidYMax meet"
      className="absolute inset-x-0 bottom-0 w-full"
      aria-hidden
    >
      <defs>
        {/* Cheena vala — the cantilevered Chinese fishing net. The one shape on
            the Kochi waterfront nobody needs told the name of: an A-frame, a
            long arm out over the water, the net slung off its end and the
            counterweight stones hanging back at the near side. */}
        <g id="kl-net">
          <path d="M-10 0 L -3 -62 L 4 -62 L 2 0 Z" />
          <path d="M26 0 L 15 -62 L 22 -62 L 34 0 Z" />
          <path d="M8 -62 L 12 -104 L 19 -104 L 16 -62 Z" />
          <path d="M2 -62 L -112 -20 L -110 -12 L 7 -53 Z" />
          <path d="M15 -104 L -110 -18 L -108 -13 L 18 -99 Z" />
          <path d="M-112 -16 L -150 34 L -70 34 Z" />
          <path d="M30 -62 L 32 -32 L 39 -32 L 37 -62 Z" />
          <circle cx="35" cy="-26" r="7" />
          <circle cx="35" cy="-11" r="7" />
        </g>

        {/* Kettuvallam — the backwater houseboat, all hull and arched thatch. */}
        <g id="kl-houseboat">
          <path d="M0 0 C 34 9 152 9 186 0 C 176 -7 22 -7 0 0 Z" />
          <path d="M28 -6 C 46 -38 142 -38 160 -6 Z" />
          <path d="M74 -34 L 78 -46 L 84 -46 L 82 -34 Z" />
        </g>

        {/* Chundan vallam — the snake boat, named for the prow that rears up
            behind the rowers. The rowers are what make it read as one. */}
        <g id="kl-snakeboat">
          <path d="M0 0 C 44 11 196 11 240 0 C 228 -7 208 -9 164 -10 L 34 -10 C 20 -10 9 -6 0 0 Z" />
          <path d="M238 -2 C 258 -16 274 -44 277 -78 L 267 -78 C 263 -48 250 -22 232 -9 Z" />
          {[46, 74, 102, 130, 158, 186].map((x) => (
            <g key={x} transform={`translate(${x} -10)`}>
              <circle cx="0" cy="-16" r="5" />
              <path d="M-5 -11 L 5 -11 L 7 0 L -7 0 Z" />
            </g>
          ))}
        </g>
      </defs>

      {/* Far: the hill line, lifted toward the sky colour so distance reads as
          haze rather than as a lighter black. */}
      <g
        ref={attachFar}
        fill="#16294a"
        opacity="0.85"
      >
        <path d="M0 420 L 0 352 C 120 330 210 344 300 336 C 420 324 500 300 610 306 C 740 312 820 338 940 332 C 1080 324 1180 300 1300 308 C 1420 316 1520 340 1600 336 L 1600 420 Z" />
      </g>

      {/* Mid: the water, and the nets standing out over it. */}
      {/* The nets are drawn large and near-black rather than to scale with the
          water behind them. They are the one shape on this horizon that has to
          be recognisable — at half size, in a colour close to the sky's, they
          read as scratches on the waterline and the whole reference is lost. */}
      <g ref={attachMid} fill="#050d1c">
        <path
          d="M0 420 L 0 372 C 200 362 360 378 560 372 C 760 366 900 356 1100 366 C 1300 376 1450 372 1600 366 L 1600 420 Z"
          fill="#0a1830"
        />
        {[300, 700, 1120, 1500].map((x, i) => (
          <use key={x} href="#kl-net" transform={`translate(${x} ${372 + (i % 2) * 4}) scale(${1.5 + (i % 3) * 0.12})`} />
        ))}
        <use href="#kl-houseboat" transform="translate(830 380) scale(0.85)" />
      </g>

      {/* Near: the bank the reader is standing on, and everything close enough
          to be pure black against the sky. */}
      <g
        ref={attachNear}
        fill="#02050c"
      >
        <path d="M0 420 L 0 400 C 240 388 420 404 700 398 C 980 392 1180 384 1400 396 C 1490 401 1550 400 1600 396 L 1600 420 Z" />
        <use href="#kl-snakeboat" transform="translate(180 400) scale(0.8)" />
      </g>
    </svg>
  );
}

export function CinematicScene() {
  const hostRef = useRef<HTMLDivElement>(null);
  const landRef = useRef<HTMLDivElement>(null);
  const bandRefs = useRef<(SVGGElement | null)[]>([]);
  // Handed to KeralaHorizon as a lookup rather than handing it the ref array
  // itself — a child writing into a ref it was passed is a lint error, and
  // closing over the array keeps ownership here, where the frame loop reads it.
  // The three callbacks are built once: returning a fresh one per render would
  // have React detach and reattach every band on each render.
  const attachBand = useMemo(
    () =>
      BANDS.map((_, i) => (el: SVGGElement | null) => {
        bandRefs.current[i] = el;
      }),
    []
  );

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new Scene();
    const camera = new PerspectiveCamera(52, 1, 0.1, 200);
    const renderer = new WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const canvas = renderer.domElement;
    // z-index 1 puts the stars above the sky gradient and below the ground,
    // both of which are authored in the JSX below rather than appended here.
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
      // No scroll-driven descent either, so the page is simply shown where the
      // landing was going: the ground already in. Holding it away instead
      // would mean this reader never sees the ground at all, which is the
      // worse of the two answers.
      if (landRef.current) landRef.current.style.opacity = "1";
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

      // ── The landing ────────────────────────────────────────────────────
      // The night-sky wallpaper stays lit for the whole visit (it's the same
      // background the landing page lives on), so only the ground arrives on
      // scroll. The stars keep their own light too — nothing throttles them.
      const land = clamp01((p - LAND_START) / (LAND_END - LAND_START));
      if (landRef.current) landRef.current.style.opacity = String(land);
      for (let i = 0; i < BANDS.length; i++) {
        const g = bandRefs.current[i];
        if (!g) continue;
        const B = BANDS[i];
        // Two terms: the band swinging up into frame during the landing, and a
        // slow ongoing drift for the rest of the scroll. The second is the
        // parallax proper — the ground keeps moving under the copy, just far
        // less than the copy moves, and less again the further back it is.
        g.style.transform = `translate(${-eased.x * B.parallax * 0.35}px, ${
          (1 - land) * B.rise - p * B.parallax
        }px)`;
      }

      for (const { points, L } of sheets) {
        // Stars stay lit under the night sky.
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
          driven by the ripple shader, shipped with the exact settings page.tsx
          gives it. It sits on brand navy and stays lit for the whole visit;
          the descent no longer fades a blue sky in, the landing keeps the
          night. */}
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

      {/* Over the stars: the ground the descent lands on, arriving on the
          `land` fade. The walking crowd that used to stand in front of it is
          gone — see the note above KeralaHorizon. */}
      <div ref={landRef} className="absolute inset-0" style={{ zIndex: 2, opacity: 0 }}>
        <KeralaHorizon attach={attachBand} />
      </div>
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
