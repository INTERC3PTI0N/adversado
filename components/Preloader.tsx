"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useMotionValue } from "motion/react";
import gsap from "gsap";
import { Silk } from "@/components/Silk";
import { Globe } from "@/components/ui/cobe-globe";
import { useConstrainedDevice } from "@/components/useConstrainedDevice";
import { VortexOrb } from "@/components/VortexOrb";

/** The one marker the preloader's globe carries — where Adversado is from. */
const KOCHI_MARKER = [{ id: "kochi", location: [9.9312, 76.2673] as [number, number], label: "Kochi, Kerala" }];

/**
 * Recreation of preloader/preloader.mp4, frame-matched against the source
 * (timings and geometry measured by scrubbing the video: canvas pixel probes
 * for colour/coverage, column profiling for letter bounds). Built as code
 * rather than shipping the mp4 so it can be skipped, replayed and
 * reduced-motion'd — and so it weighs a few KB instead of a megabyte.
 *
 * The trick the video plays: the wordmark is ADVE:RSADO, and a cat is hiding
 * in it. The E's counter is the cat's head (two ears, muzzle), the colon is
 * its eyes, and a paw juts into the R. It opens with those negative spaces
 * FILLED IN — so the E reads as a plain block and the R looks like an
 * ordinary R — then the cat "peeks out" as the fills retract from the gap
 * between the two letters: head pushing left into the E, paw pushing right
 * into the R. Then the eyes open, and blink once.
 */

const NAVY = "#000000";
const GOLD = "#e6b325";
const WHITE = "#ffffff";

// The silk field stands in for the flat navy. Its folds run from a lifted navy
// down to a near-black navy so the field still reads as brand navy overall,
// rather than turning the opening into a different colour.
const SILK_HIGH = "#2a4a80";
const SILK_LOW = "#0b1524";

// All from public/logo.svg, viewBox 0 0 23680 4480.
const LETTER_PATHS = [
  // A
  "M236 3741 c-4 -5 61 -236 143 -513 151 -511 229 -776 411 -1403 157 -538 240 -818 245 -824 9 -8 678 -12 725 -3 l44 7 23 75 c13 41 75 253 139 470 63 217 142 485 174 595 32 110 113 389 180 620 67 231 134 463 150 515 50 167 130 448 130 459 0 8 -109 10 -362 9 l-361 -3 -8 -25 c-4 -14 -25 -83 -45 -153 l-37 -128 -353 3 c-342 3 -354 4 -374 24 -13 12 -34 68 -55 142 -19 68 -37 127 -40 132 -8 13 -722 14 -729 1z m1344 -988 c0 -9 -28 -115 -62 -235 l-62 -218 -33 0 c-22 0 -36 6 -43 20 -10 19 -130 426 -130 442 0 4 74 8 165 8 149 0 165 -2 165 -17z",
  // D
  "M2830 2380 c0 -1217 2 -1370 15 -1378 22 -12 1111 -5 1225 9 278 32 490 116 696 275 383 296 567 857 459 1390 -39 188 -125 388 -227 526 -73 99 -206 238 -276 290 -79 58 -266 154 -378 193 -184 63 -210 65 -896 65 l-618 0 0 -1370z m1080 677 c146 -36 293 -118 376 -210 60 -67 97 -132 131 -232 26 -74 28 -92 28 -235 0 -174 -10 -220 -73 -349 -70 -141 -220 -270 -378 -326 -69 -24 -98 -28 -232 -32 -112 -4 -156 -2 -167 7 -13 11 -15 106 -15 708 l0 695 138 -6 c75 -4 162 -13 192 -20z",
  // V
  "M6029 3678 c-128 -431 -341 -1151 -479 -1618 -93 -316 -200 -681 -239 -810 -46 -158 -66 -239 -60 -247 11 -12 665 -19 739 -7 37 6 38 6 59 85 12 43 98 342 191 663 92 320 174 603 180 627 10 36 14 40 22 26 10 -19 14 -32 243 -842 80 -286 148 -526 150 -533 10 -29 62 -33 417 -30 196 2 359 5 362 8 6 7 -378 1355 -765 2683 l-20 67 -389 0 -389 0 -22 -72z",
  // E — its counter is the cat's head
  "M7840 2376 l0 -1373 83 -7 c99 -8 1788 -7 1835 1 l32 5 0 382 c0 211 -2 385 -5 387 -2 3 -174 -16 -382 -43 -258 -32 -416 -47 -499 -48 -131 0 -149 6 -142 52 2 18 23 31 117 70 329 137 441 222 470 358 6 28 11 129 11 224 0 225 -8 253 -100 349 -37 40 -88 83 -112 96 -90 49 -155 80 -212 101 -33 12 -71 27 -85 34 -15 7 -39 19 -56 27 -23 12 -30 21 -30 44 l0 30 92 -2 c50 -2 259 -21 464 -43 205 -22 394 -40 421 -40 l48 0 0 385 0 385 -975 0 -975 0 0 -1374z",
  // R — the notch in its stem is the cat's paw
  "M10220 3577 l0 -173 88 -28 c315 -99 482 -263 482 -473 0 -47 -6 -79 -21 -110 l-21 -43 -64 0 c-56 0 -74 6 -161 50 -158 80 -231 110 -268 110 l-35 0 0 -954 0 -954 168 -7 c228 -10 1168 1 1260 15 130 20 225 49 327 99 213 105 344 259 426 499 33 94 33 101 34 262 0 131 -4 180 -19 235 -25 94 -83 227 -131 300 -54 83 -189 216 -258 255 -32 18 -61 38 -64 45 -2 7 87 197 198 421 201 407 299 611 299 620 0 2 -183 3 -407 2 l-408 -3 -77 -155 c-42 -85 -142 -290 -222 -455 l-145 -300 -96 -3 c-54 -1 -104 2 -115 8 -19 10 -20 23 -22 458 l-3 447 -372 3 -373 2 0 -173z m1699 -1233 c34 -25 61 -91 61 -155 1 -206 -171 -403 -426 -488 -102 -34 -137 -36 -426 -24 l-158 6 0 234 0 233 154 0 c253 0 429 43 618 151 109 62 139 69 177 43z",
  // S
  "M13735 3764 c-329 -49 -581 -161 -756 -336 -141 -140 -224 -305 -269 -532 -18 -88 -15 -90 177 -89 220 0 346 30 673 158 318 126 539 157 666 94 133 -66 121 -214 -21 -254 -27 -8 -141 -25 -251 -39 -292 -37 -408 -62 -589 -131 -304 -116 -511 -323 -597 -595 -19 -63 -23 -96 -23 -210 0 -114 4 -147 23 -210 53 -169 157 -314 305 -426 92 -70 266 -150 404 -186 109 -28 134 -31 324 -36 294 -6 465 24 672 121 235 110 365 233 467 442 52 104 110 281 110 331 0 12 -61 14 -373 14 l-374 0 -12 -52 c-23 -103 -94 -187 -200 -237 -50 -23 -68 -26 -171 -26 -155 0 -236 24 -313 95 -44 40 -57 59 -62 90 -9 53 22 119 73 153 92 64 176 89 532 161 124 25 261 57 305 72 305 100 507 269 590 494 22 60 29 98 33 188 10 233 -58 400 -243 600 -81 86 -122 119 -227 178 -132 74 -221 110 -378 151 -54 14 -426 27 -495 17z",
  // A
  "M15230 3732 c0 -10 54 -205 119 -433 189 -657 429 -1491 552 -1911 l113 -388 392 0 c365 0 393 1 398 18 3 9 52 177 110 372 57 195 151 513 207 705 56 193 131 449 166 570 35 121 107 369 160 550 52 182 108 373 123 425 15 52 26 98 23 103 -2 4 -166 7 -363 7 l-359 0 -27 -87 c-14 -49 -34 -115 -44 -148 l-18 -60 -362 -3 c-327 -2 -365 -1 -382 14 -10 10 -18 21 -18 27 0 5 -16 65 -36 133 l-37 124 -358 0 c-340 0 -359 -1 -359 -18z m1340 -979 c0 -10 -29 -117 -63 -238 -59 -207 -65 -220 -88 -223 -15 -2 -32 5 -41 15 -12 14 -138 430 -138 456 0 4 74 7 165 7 151 0 165 -2 165 -17z",
  // D
  "M17817 3744 c-4 -4 -7 -621 -7 -1371 0 -1289 1 -1364 18 -1371 9 -4 283 -7 607 -6 640 0 679 3 878 60 494 141 829 535 912 1074 22 139 19 353 -5 495 -51 296 -172 532 -382 747 -170 173 -343 271 -605 345 l-98 27 -655 4 c-361 1 -659 0 -663 -4z m1101 -694 c233 -56 414 -216 487 -430 118 -346 -31 -733 -339 -883 -129 -64 -229 -78 -429 -61 l-77 7 0 692 c0 380 3 695 8 700 13 14 263 -4 350 -25z",
  // O
  "M21690 3799 c-300 -38 -558 -160 -769 -364 -162 -156 -265 -323 -341 -554 -57 -172 -74 -284 -74 -491 0 -386 111 -716 329 -978 178 -214 409 -355 689 -419 98 -23 134 -26 306 -27 210 0 277 9 430 61 80 27 250 109 250 120 0 4 -9 16 -19 27 -11 12 -32 46 -48 76 -39 77 -45 199 -13 282 46 124 180 225 313 235 69 6 158 -14 213 -48 17 -10 36 -19 42 -19 14 0 107 284 129 395 28 138 25 484 -5 618 -46 210 -116 380 -219 534 -63 94 -234 279 -301 325 -87 60 -336 180 -412 200 -41 10 -91 23 -110 28 -42 11 -299 11 -390 -1z m265 -754 c82 -22 143 -58 209 -123 74 -73 117 -145 158 -263 32 -92 33 -97 33 -269 -1 -187 -9 -239 -62 -365 -57 -135 -169 -249 -291 -295 -51 -20 -70 -22 -172 -17 -172 9 -245 42 -366 168 -68 72 -111 152 -145 274 -33 116 -34 335 -1 450 68 236 203 389 392 441 63 17 175 17 245 -1z",
];

/**
 * The two fills that hide the cat. Each is lifted verbatim from the segment of
 * its own glyph's outline that traces the counter, then closed with `Z` along
 * the letter's straight edge — so they land exactly on the negative space
 * rather than approximating it.
 */
// E's counter: right edge at x=9790, prongs reaching left to x≈8762.
const HEAD_FILL =
  "M9790 1384 c0 211 -2 385 -5 387 -2 3 -174 -16 -382 -43 -258 -32 -416 -47 -499 -48 -131 0 -149 6 -142 52 2 18 23 31 117 70 329 137 441 222 470 358 6 28 11 129 11 224 0 225 -8 253 -100 349 -37 40 -88 83 -112 96 -90 49 -155 80 -212 101 -33 12 -71 27 -85 34 -15 7 -39 19 -56 27 -23 12 -30 21 -30 44 l0 30 92 -2 c50 -2 259 -21 464 -43 205 -22 394 -40 421 -40 l48 0 Z";
// R's stem notch: left edge at x=10220, bulging right to x≈10790.
const PAW_FILL =
  "M10220 3404 l88 -28 c315 -99 482 -263 482 -473 0 -47 -6 -79 -21 -110 l-21 -43 -64 0 c-56 0 -74 6 -161 50 -158 80 -231 110 -268 110 l-35 0 Z";

// The colon — the cat's eyes. Kept out of LETTER_PATHS so they can blink.
const EYE_UPPER =
  "M9749 2231 c-38 -39 -41 -106 -6 -139 46 -44 108 -46 151 -7 44 41 46 96 5 148 -17 23 -28 27 -70 27 -42 0 -55 -5 -80 -29z";
const EYE_LOWER =
  "M9768 2684 c-35 -18 -48 -43 -48 -89 0 -47 13 -71 50 -90 59 -31 115 -13 146 47 20 39 12 84 -23 120 -31 32 -80 37 -125 12z";
const EYE_UPPER_C = { x: 9824, y: 2158 };
const EYE_LOWER_C = { x: 9824, y: 2595 };

const DOT_PATH =
  "M22717 1659 c-83 -19 -138 -61 -176 -134 -67 -131 -6 -296 131 -355 93 -40 214 -14 285 62 58 62 82 179 54 262 -15 44 -77 116 -125 145 -37 22 -116 31 -169 20z";
// Measured off DOT_PATH's own bbox: 509 × 512 centred here, so it is a circle
// to within a unit. Expressed as a fraction of the 23680 × 4480 viewBox, that
// centre is where the globe has to sit for the morph to line up.
const DOT_CX_PCT = (22768 / 23680) * 100;
const DOT_CY_PCT = (1407.5 / 4480) * 100;
// The globe is ~8× the dot across, so it has to clear the wordmark rather
// than growing over the letters. The travel is diagonal — up and to the
// right, out past the O it came off — which buys that clearance sideways as
// well as vertically and lets it sit lower than a straight lift could.
// Both are percentages of the globe's own box, so the whole move scales with
// the wordmark at every viewport.
const GLOBE_W_PCT = 17;
const DOT_W_PCT = (509 / 23680) * 100;
const GLOBE_LIFT_PCT = -78;
const GLOBE_SHIFT_PCT = 34;

/**
 * Act two: the lights come up, and then they fade.
 *
 * The wordmark plays first, in the dark. Then the room is lit for a headline
 * announcing its own disappearance, which counts itself down — and on zero
 * the light fades out over the dark page waiting underneath, so the handoff
 * to the rest of the site is the fade itself rather than a separate wipe
 * bolted on after it.
 */
const COUNT_WORDS: Record<number, string> = { 3: "THREE", 2: "TWO", 1: "ONE" };
// Whole sequence tightened. The old pacing was set when every headline word
// was a WarpText canvas that needed a beat to be *looked at* — plain type
// reads instantly, so the holds around it were dead air. A 650ms tick still
// reads as a countdown; it just stops feeling like waiting.
const COUNT_STEP_MS = 650;

/**
 * Engaged-style satellite orbs around the hero pearl. Softness comes from the
 * gradient falling to transparent — never `filter: blur()`, which is the
 * dominant GPU cost of this stage on phones.
 */
const FIELD_ORBS: {
  x: string;
  y: string;
  size: string;
  depth: number;
  opacity: number;
  tone: "navy" | "gold" | "pearl";
}[] = [
  { x: "-6%", y: "8%", size: "34vmin", depth: 0.28, opacity: 0.55, tone: "navy" },
  { x: "72%", y: "-4%", size: "26vmin", depth: 0.42, opacity: 0.5, tone: "navy" },
  { x: "78%", y: "58%", size: "38vmin", depth: 0.22, opacity: 0.45, tone: "navy" },
  { x: "-10%", y: "62%", size: "30vmin", depth: 0.35, opacity: 0.48, tone: "navy" },
  { x: "18%", y: "74%", size: "16vmin", depth: 0.7, opacity: 0.55, tone: "pearl" },
  { x: "84%", y: "28%", size: "14vmin", depth: 0.85, opacity: 0.6, tone: "gold" },
  { x: "8%", y: "28%", size: "12vmin", depth: 0.9, opacity: 0.5, tone: "pearl" },
  { x: "58%", y: "78%", size: "20vmin", depth: 0.5, opacity: 0.42, tone: "gold" },
];

/** Subset for constrained devices — same look, half the layers. */
const FIELD_ORBS_LITE = FIELD_ORBS.filter((_, i) => i % 2 === 0);

const FIELD_TONE: Record<(typeof FIELD_ORBS)[number]["tone"], string> = {
  navy: "radial-gradient(circle at 38% 32%, #8aa3d0 0%, #4a6698 32%, #243a68 58%, transparent 72%)",
  gold: "radial-gradient(circle at 40% 34%, #f2d78e 0%, #e6b325 30%, #8a9fc8 55%, transparent 70%)",
  pearl:
    "radial-gradient(circle at 38% 30%, #faf1d4 0%, #efd287 24%, #b9cbee 50%, transparent 68%)",
};
/** The wordmark act, from first frame to its own fade being finished. */
const DARK_MS = 4050;
/** Lights coming up over the wordmark's last frame. */
const LIGHT_IN_MS = 400;
/** Beat to read the line in, then THREE → TWO → ONE. Orb dive after ONE. */
const LIGHT_HOLD_MS = 420 + COUNT_STEP_MS * 2 + 900;
/** When the lit act is fully up, in ms and in seconds. */
const LIGHT_ON_MS = DARK_MS + LIGHT_IN_MS;
/** When the countdown first shows ONE. */
const ONE_AT_MS = LIGHT_ON_MS + 420 + COUNT_STEP_MS * 2;

/**
 * ── The orb unveil ─────────────────────────────────────────────────────────
 *
 * After the dark wordmark act: darkened star field, archive SVG Vortex orb
 * (navy+gold pearl), and Montserrat + Merriweather headline over it. After
 * ONE, dive into the orb so the hero arrives through the opening.
 */

const TAGLINE_1: { text: string; color: string }[] = [
  { text: "The", color: GOLD },
  { text: "Brand", color: WHITE },
  { text: "Behind", color: GOLD },
  { text: "The", color: WHITE },
  { text: "Brands.", color: GOLD },
];

export function Preloader({
  onDone,
  onHandoff,
}: {
  /** The tunnel has finished opening out — nothing of the preloader is left to see. */
  onDone?: () => void;
  /** The tunnel has *started* opening out. Whatever is underneath should begin
   * arriving now, so the reader sees it through the opening rather than after it. */
  onHandoff?: () => void;
}) {
  // Phones cannot hold this many WebGL contexts. See useConstrainedDevice —
  // the heavy layers below are swapped for painted equivalents rather than
  // simply removed, so the sequence still reads the same, just cheaper.
  const constrained = useConstrainedDevice();
  const rootRef = useRef<HTMLDivElement>(null);
  const groupWrapRef = useRef<SVGGElement>(null);
  const introClipRef = useRef<SVGRectElement>(null);
  const headClipRef = useRef<SVGRectElement>(null);
  const pawClipRef = useRef<SVGRectElement>(null);
  const eyeUpperRef = useRef<SVGGElement>(null);
  const eyeLowerRef = useRef<SVGGElement>(null);
  const dotGroupRef = useRef<SVGGElement>(null);
  const globeRef = useRef<HTMLDivElement>(null);
  const tagline1Ref = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const heroWrapRef = useRef<HTMLDivElement>(null);
  const fieldOrbRefs = useRef<(HTMLDivElement | null)[]>([]);
  /** Dive progress 0→1 — VortexOrb scale / hole / swirl (archive formulas). */
  const diveProxy = useRef({ progress: 0 });
  const [dive, setDive] = useState({
    scale: 1,
    rotate: 0,
    holeScale: 0,
    opacity: 1,
  });
  const [count, setCount] = useState(3);
  /** Act one struck; root goes transparent so the hero shows through the type. */
  const [handoff, setHandoff] = useState(false);
  const sceneAim = useRef({ x: 0, y: 0 });
  const sceneCur = useRef({ x: 0, y: 0 });
  const fieldOrbs = constrained ? FIELD_ORBS_LITE : FIELD_ORBS;

  const fade = useMotionValue(0);
  const intro = useMotionValue(0);
  const headReveal = useMotionValue(0);
  const pawReveal = useMotionValue(0);
  const eyeOpen = useMotionValue(0);
  /** 0 = dot sitting on the O, 1 = risen and grown into the globe. */
  const globeRise = useMotionValue(0);

  useEffect(() => {
    const root = rootRef.current;
    const groupWrap = groupWrapRef.current;
    const introClip = introClipRef.current;
    const headClip = headClipRef.current;
    const pawClip = pawClipRef.current;
    const eyeUpper = eyeUpperRef.current;
    const eyeLower = eyeLowerRef.current;
    const dotGroup = dotGroupRef.current;
    const globe = globeRef.current;
    const tagline1 = tagline1Ref.current;
    const light = lightRef.current;
    // Fast Refresh can remount this effect after act one has already been
    // struck (handoff), at which point those refs are unmounted — bail out
    // rather than crash on `.style` / `.setAttribute`.
    if (
      !root ||
      !groupWrap ||
      !introClip ||
      !headClip ||
      !pawClip ||
      !eyeUpper ||
      !eyeLower ||
      !dotGroup ||
      !globe ||
      !tagline1 ||
      !light
    ) {
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Everything inside the <svg> is driven through MotionValues rather than by
    // handing the element to Motion's DOM animate(). Passing an SVGElement as an
    // animate() target silently no-ops in this version — confirmed by tracing
    // computed styles: the same sequence moves an HTML div's backgroundColor
    // frame by frame while a sibling <g>'s opacity/fill never budge from their
    // initial values. So: HTML targets go to animate(), SVG goes through here.
    const applyFade = (v: number) => {
      groupWrap.style.opacity = String(v);
    };
    const applyIntro = (v: number) => {
      introClip.setAttribute("x", String(11840 - 11840 * v));
      introClip.setAttribute("width", String(23680 * v));
    };
    // Both clips stop exactly on the letter edge the fill was lifted from, so
    // the stroke bleed can't spill into the gap between E and R.
    const applyHead = (v: number) => {
      // Fill retracts right-to-left, so the head emerges from the E's right edge.
      headClip.setAttribute("width", String(1990 - 1030 * v));
    };
    const applyPaw = (v: number) => {
      // Fill retracts left-to-right, so the paw emerges from the R's left edge.
      pawClip.setAttribute("x", String(10220 + 590 * v));
      pawClip.setAttribute("width", String(590 - 590 * v));
    };
    const applyEyes = (v: number) => {
      const t = (el: SVGGElement, c: { x: number; y: number }) =>
        el.setAttribute("transform", `translate(${c.x} ${c.y}) scale(1 ${v}) translate(${-c.x} ${-c.y})`);
      t(eyeUpper, EYE_UPPER_C);
      t(eyeLower, EYE_LOWER_C);
    };
    // The morph is one value driving both halves in opposite directions: the
    // flat dot fades out as it swells, the globe fades in at exactly the dot's
    // size and grows into place. They occupy the same point in the same frame,
    // so the swap reads as one object changing rather than two objects
    // trading places. At rise=0 the globe is back at dot size and invisible.
    const applyDot = () => {
      const r = globeRise.get();
      // Crossfade over the first 40% of the rise — the dot is gone well before
      // the sphere is big enough for the flat disc to look wrong on it.
      const swap = Math.min(1, r * 2.5);
      dotGroup.style.opacity = String(1 - swap);
      globe.style.opacity = String(swap);
      const scale = DOT_W_PCT / GLOBE_W_PCT + (1 - DOT_W_PCT / GLOBE_W_PCT) * r;
      globe.style.transform = `translate(-50%, -50%) translate(${GLOBE_SHIFT_PCT * r}%, ${GLOBE_LIFT_PCT * r}%) scale(${scale})`;
    };

    const unsubs = [
      fade.on("change", applyFade),
      intro.on("change", applyIntro),
      headReveal.on("change", applyHead),
      pawReveal.on("change", applyPaw),
      eyeOpen.on("change", applyEyes),
      globeRise.on("change", applyDot),
    ];

    if (reduced) {
      // Rest on the settled frame: cat peeked out, eyes open, dot back on its
      // O, tagline in. The lit act is a motion gag — a headline that vanishes
      // and takes the lights with it — so there is nothing of it to hold still.
      light.style.opacity = "0";
      root.style.backgroundColor = NAVY;
      root.style.setProperty("--fg", GOLD);
      applyFade(1);
      applyIntro(1);
      applyHead(1);
      applyPaw(1);
      applyEyes(1);
      applyDot();
      tagline1.style.opacity = "1";
      // `onHandoff` as well as `onDone`, and in that order. Hero gates its
      // entire render on the `active` prop the page latches from onHandoff —
      // without it the preloader unmounts onto a permanently empty hero. The
      // motion path always fired both; this one only ever fired onDone.
      onHandoff?.();
      const t = setTimeout(() => onDone?.(), 400);
      return () => {
        clearTimeout(t);
        unsubs.forEach((u) => u());
      };
    }

    root.style.backgroundColor = NAVY;
    root.style.setProperty("--fg", GOLD);
    light.style.opacity = "0";
    applyFade(0);
    applyIntro(0);
    applyHead(0);
    applyPaw(0);
    applyEyes(0);
    applyDot();

    // The countdown runs on React state — one word changing once a second
    // doesn't need a motion value, and it reads better in the markup.
    const ticks = [
      setTimeout(() => setCount(2), LIGHT_ON_MS + 420 + COUNT_STEP_MS),
      setTimeout(() => setCount(1), ONE_AT_MS),
    ];
    const controls = animate([
      // ── Act one, in the dark ──────────────────────────────────────────
      // 0.25-0.55 — wordmark reveals outward from the centre.
      [fade, [0, 1], { duration: 0.3, ease: "easeOut", at: 0.25 }],
      [intro, [0, 1], { duration: 0.3, ease: [0.22, 1, 0.36, 1], at: 0.25 }],

      // 0.60-1.15 — the O's dot pops up clear of the wordmark and becomes the
      // globe. The globe spins on its own Y axis throughout, driven by the
      // component itself rather than by this timeline.
      [globeRise, [0, 1], { duration: 0.55, ease: [0.34, 1.45, 0.4, 1], at: 0.6 }],
      // 3.05-3.55 — back down and back to being the white dot, before the
      // wordmark fades at 3.70.
      [globeRise, [1, 0], { duration: 0.5, ease: [0.4, 0, 0.2, 1], at: 3.05 }],

      // 1.55-2.05 — the cat peeks out of the gap: paw into the R, head into the E.
      [pawReveal, [0, 1], { duration: 0.25, ease: "easeOut", at: 1.55 }],
      [headReveal, [0, 1], { duration: 0.35, ease: "easeOut", at: 1.7 }],

      // 2.05-2.46 — eyes open, then a single blink.
      [eyeOpen, [0, 1], { duration: 0.22, ease: "easeOut", at: 2.05 }],
      [eyeOpen, [1, 0.06], { duration: 0.05, ease: "easeIn", at: 2.28 }],
      [eyeOpen, [0.06, 1], { duration: 0.13, ease: "easeOut", at: 2.33 }],

      // 2.50 — tagline wipes in left-to-right.
      [tagline1, { clipPath: ["inset(0 100% 0 0)", "inset(0 0% 0 0)"], opacity: [0, 1] }, { duration: 1.0, ease: [0.22, 1, 0.36, 1], at: 2.5 }],

      // 3.70-4.05 — the wordmark clears the stage for the headline.
      [fade, [1, 0], { duration: 0.35, ease: "easeIn", at: 3.7 }],
      [tagline1, { opacity: [1, 0] }, { duration: 0.35, ease: "easeIn", at: 3.7 }],

      // ── Act two: the lights come up ───────────────────────────────────
      [light, { opacity: [0, 1] }, { duration: LIGHT_IN_MS / 1000, ease: "easeOut", at: DARK_MS / 1000 }],
    ]);

    let cancelled = false;
    let outro: gsap.core.Timeline | null = null;

    // Stars (CinematicScene) need to show through the punched headline for the
    // whole countdown — strike act one's silk and clear the navy at light-up.
    // Hero zoom still waits for the dive (`onHandoff` below).
    const handoffTimer = setTimeout(() => {
      if (cancelled) return;
      setHandoff(true);
    }, LIGHT_ON_MS);

    // After ONE — dive into the orb. Scale + feathery hole + swirl match the
    // archive App.js portal; the star field (and arriving hero) wait underneath.
    const outroTimer = setTimeout(() => {
      if (cancelled) return;
      onHandoff?.();

      outro = gsap.timeline({
        onComplete: () => {
          if (!cancelled) onDone?.();
        },
      });

      const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
      // Tuned for the Engaged-scale orb (~92vmin): it already fills most of
      // the frame, so a gentler zoom keeps its rim in view mid-dive — like
      // the reference — while the hole does the actual opening.
      const applyDive = (p: number) => {
        setDive({
          scale: 1 + p * 2.6,
          holeScale: p * 2.6,
          rotate: p * 260,
          opacity: 1 - clamp01((p - 0.86) / 0.12),
        });
      };

      diveProxy.current.progress = 0;
      applyDive(0);
      outro.to(
        diveProxy.current,
        {
          progress: 1,
          duration: 1.5,
          ease: "power2.in",
          onUpdate: () => applyDive(diveProxy.current.progress),
        },
        0
      );
      outro.to(copyRef.current, { opacity: 0, duration: 0.4, ease: "power2.in" }, 0);
      outro.to(lightRef.current, { opacity: 0, duration: 0.55, ease: "power2.inOut" }, 0.95);
    }, LIGHT_ON_MS + LIGHT_HOLD_MS);

    return () => {
      cancelled = true;
      ticks.forEach(clearTimeout);
      clearTimeout(handoffTimer);
      clearTimeout(outroTimer);
      controls.stop();
      outro?.kill();
      unsubs.forEach((u) => u());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Act-two stage: soft parallax written straight to the DOM — no React
  // setState per frame (that was re-reconciling eight orbs at 60Hz).
  // Skipped entirely on constrained devices: static field, zero pointer work.
  useEffect(() => {
    if (constrained) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let raf = 0;
    const tick = () => {
      const a = sceneAim.current;
      const c = sceneCur.current;
      c.x += (a.x - c.x) * 0.08;
      c.y += (a.y - c.y) * 0.08;
      const orbs = fieldOrbRefs.current;
      const list = FIELD_ORBS;
      for (let i = 0; i < list.length; i++) {
        const el = orbs[i];
        if (!el) continue;
        const d = list[i].depth;
        el.style.transform = `translate3d(${c.x * 70 * d}px, ${c.y * 70 * d}px, 0)`;
      }
      const hero = heroWrapRef.current;
      if (hero) {
        hero.style.transform = `translate(calc(-50% + ${c.x * 18}px), calc(-50% + ${c.y * 18}px))`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onMove = (e: PointerEvent) => {
      sceneAim.current.x = e.clientX / window.innerWidth - 0.5;
      sceneAim.current.y = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, [constrained]);

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={
        {
          backgroundColor: handoff ? "transparent" : NAVY,
          "--fg": GOLD,
        } as React.CSSProperties
      }
    >
      {/* The preloader's own stage — struck the moment the tunnel starts
          opening out, along with the backdrop above, so what's left is a
          transparent frame holding nothing but the tunnel. That's what lets
          the hero arrive *through* it rather than after it. */}
      {!handoff && (
      <>
      <div className="absolute inset-0 z-0">
        <Silk
          primaryColor={SILK_HIGH}
          secondaryColor={SILK_LOW}
          speed={0.8}
          interactive={0.5}
          intensity={0.35}
          className="h-full w-full"
        />
      </div>

      <div className="relative z-10 w-[70vw] max-w-[900px]">
        {/* The real globe, parked over the dot's exact centre and mounted from
            the first frame so its land data has the whole preloader to arrive
            in — it fetches its coastlines over the network, and a globe that
            popped in half-drawn would be worse than one that fades in late.
            Sized and lifted in percentages of this box so it tracks the
            wordmark at every viewport. */}
        <div
          ref={globeRef}
          aria-hidden
          className="pointer-events-none absolute aspect-square"
          style={{
            left: `${DOT_CX_PCT}%`,
            top: `${DOT_CY_PCT}%`,
            width: `${GLOBE_W_PCT}%`,
            opacity: 0,
            transform: "translate(-50%, -50%)",
          }}
        >
          {/* cobe globe, recoloured white: white ocean, white marker and
              glow. Wrapped `pointer-events-none` — this component drags on
              pointerdown, and nothing under a preloader should be grabbable. */}
          {/* Skipped on constrained devices: a WebGL globe that also fetches
              coastline data over the network, sat behind the wordmark's own
              dot. Dropping it costs a decorative flourish and buys back a
              context the phone actually needs. */}
          <div className="pointer-events-none h-full w-full">
            {constrained ? null : (
            <Globe
              markers={KOCHI_MARKER}
              dark={1}
              baseColor={[1, 1, 1]}
              markerColor={[1, 1, 1]}
              glowColor={[1, 1, 1]}
              mapBrightness={8}
              markerSize={0.06}
            />
            )}
          </div>
        </div>

      <svg
        viewBox="0 0 23680 4480"
        className="block w-full overflow-visible"
        aria-label="Adversado"
      >
        <defs>
          <clipPath id="pl-intro" clipPathUnits="userSpaceOnUse">
            <rect ref={introClipRef} x={11840} y={-2000} width={0} height={9000} />
          </clipPath>
          <clipPath id="pl-head" clipPathUnits="userSpaceOnUse">
            <rect ref={headClipRef} x={7800} y={900} width={1990} height={2950} />
          </clipPath>
          <clipPath id="pl-paw" clipPathUnits="userSpaceOnUse">
            <rect ref={pawClipRef} x={10220} y={2680} width={590} height={800} />
          </clipPath>
        </defs>

        <g ref={groupWrapRef} style={{ opacity: 0 }}>
          <g clipPath="url(#pl-intro)">
            <g style={{ fill: "var(--fg)" }}>
              {LETTER_PATHS.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>

            {/* Fills that hide the cat, retracting to let it peek out. The
                stroke bleeds them a few units past the glyph outline they were
                lifted from, so the shared edge doesn't leave an antialiased
                seam of background showing through. */}
            <g clipPath="url(#pl-head)">
              <path
                d={HEAD_FILL}
                style={{ fill: "var(--fg)", stroke: "var(--fg)" }}
                strokeWidth={12}
                strokeLinejoin="round"
              />
            </g>
            <g clipPath="url(#pl-paw)">
              <path
                d={PAW_FILL}
                style={{ fill: "var(--fg)", stroke: "var(--fg)" }}
                strokeWidth={12}
                strokeLinejoin="round"
              />
            </g>

            <g ref={eyeUpperRef}>
              <path d={EYE_UPPER} style={{ fill: "var(--fg)" }} />
            </g>
            <g ref={eyeLowerRef}>
              <path d={EYE_LOWER} style={{ fill: "var(--fg)" }} />
            </g>
          </g>

          <g ref={dotGroupRef}>
            <path d={DOT_PATH} fill={WHITE} />
          </g>
        </g>
      </svg>
      </div>

      <div className="relative z-10 mt-6 h-8 w-full max-w-[900px] px-[15%]">
        <div
          ref={tagline1Ref}
          className="absolute inset-x-0 flex justify-center gap-[0.32em] whitespace-nowrap font-serif text-[clamp(0.85rem,1.9vw,1.35rem)] font-light italic tracking-[0.06em]"
          style={{ opacity: 0 }}
        >
          {TAGLINE_1.map((w, i) => (
            <span key={i} style={{ color: w.color }}>
              {w.text}
            </span>
          ))}
        </div>
      </div>

      </>
      )}

      {/* ── Act two ────────────────────────────────────────────────────────
          The Engaged hero, in brand: night stage with out-of-focus spheres,
          a viewport-filling luminous orb, and mixed roman-sans / italic-serif
          type over it. Dive opens the feathery portal after ONE. */}
      <div
        ref={lightRef}
        className="absolute inset-0 z-40 overflow-hidden"
        style={{ opacity: 0 }}
      >
        {/* Darken the cinematic field so the orb reads like Engaged's night stage. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(3,7,18,0.55)_0%,rgba(3,7,18,0.8)_52%,rgba(1,3,10,0.95)_100%)]"
        />

        {/* Satellite orbs — soft via transparent gradients, no CSS blur and
            no scene-wide SVG displacement (both were the lag on low-end). */}
        <div
          ref={fieldRef}
          aria-hidden
          className="pointer-events-none absolute inset-0"
        >
          {fieldOrbs.map((orb, i) => (
            <div
              key={i}
              ref={(el) => {
                fieldOrbRefs.current[i] = el;
              }}
              className="absolute rounded-full"
              style={{
                left: orb.x,
                top: orb.y,
                width: orb.size,
                height: orb.size,
                opacity: orb.opacity,
                background: FIELD_TONE[orb.tone],
              }}
            />
          ))}
        </div>

        {/* Hero orb — parallax written from the scene raf (desktop only). */}
        <div
          ref={heroWrapRef}
          className="absolute left-1/2 top-1/2 h-[min(78vmin,78vh)] w-[min(78vmin,78vh)]"
          style={{ transform: "translate(-50%, -50%)" }}
        >
          {!constrained && (
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-[14%] rounded-full bg-[radial-gradient(circle,rgba(190,208,242,0.12)_0%,rgba(107,143,212,0.08)_50%,transparent_70%)]"
            />
          )}
          <VortexOrb
            className="h-full w-full"
            lite={constrained}
            scale={dive.scale}
            rotate={dive.rotate}
            holeScale={dive.holeScale}
            opacity={dive.opacity}
          />
        </div>

        {/* Navy ink on the pearl (white washed out against the nacre).
            Montserrat carries the sentence; Merriweather italic lands the
            emphasis; the countdown is the gold beat. */}
        <div
          ref={copyRef}
          className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-5 text-center"
        >
          <h2 className="max-w-[16ch] font-sans text-[clamp(1.85rem,4.8vw,4.25rem)] font-semibold leading-[1.12] tracking-[-0.025em] text-navy">
            <span className="block">This headline will</span>
            <span className="mt-[0.08em] block">
              <em className="font-serif font-normal italic tracking-[-0.01em]">
                vanish
              </em>{" "}
              in{" "}
              <em
                key={count}
                className="inline-block border-b-[0.08em] border-gold pb-[0.02em] font-serif text-[1.08em] font-semibold italic tracking-[-0.01em] text-navy animate-[pl-count-in_0.45s_cubic-bezier(0.22,1,0.36,1)_both]"
              >
                {COUNT_WORDS[count].toLowerCase()}
              </em>
              .
            </span>
          </h2>
        </div>

        {/* Engaged's bottom-left aside, in brand voice. */}
        <p className="pointer-events-none absolute bottom-[7%] left-[5%] z-10 hidden max-w-[320px] text-left font-sans text-[13px] leading-relaxed text-cream/65 sm:block">
          We are{" "}
          <em className="font-serif italic text-gold/90">
            the brand behind the brands
          </em>{" "}
          — attention earned in memorable experiences, never bought.
        </p>

        <h1 className="sr-only">
          This headline will vanish in {COUNT_WORDS[count].toLowerCase()}
        </h1>
      </div>
    </div>
  );
}
