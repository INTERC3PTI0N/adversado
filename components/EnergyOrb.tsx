"use client";

import { useEffect, useRef } from "react";

/**
 * Glass rim orb matched to the reference video: a thin chromatic edge (gold
 * arc opposite cyan), hollow centre, prismatic streaks and colour ripples
 * gleaming *inside* the shell. Nothing escapes the silhouette.
 *
 * Drawn as one fullscreen triangle on raw WebGL.
 */

const VERT = `
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const FRAG = `
  precision highp float;

  uniform float uTime;
  uniform vec2  uResolution;
  uniform vec2  uPointer;
  uniform float uRadius;
  uniform vec3  uCool;
  uniform vec3  uWarm;
  uniform vec3  uDeep;
  uniform vec3  uCore;
  uniform float uGlow;
  uniform float uRays;
  uniform float uSparkle;
  uniform float uInteractive;

  varying vec2 vUv;

  vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m; m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 a0 = x - floor(x + 0.5);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * snoise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float sparks(vec2 uv, float t) {
    float s = 0.0;
    for (int i = 0; i < 2; i++) {
      float fi = float(i);
      float scale = 22.0 + fi * 37.0;
      vec2 g = uv * scale + vec2(fi * 11.3, -t * (0.04 + fi * 0.03));
      vec2 id = floor(g);
      vec2 f = fract(g) - 0.5;
      float h = hash21(id + fi * 19.7);
      float on = step(0.94, h);
      vec2 off = (vec2(hash21(id + 3.1), hash21(id + 7.7)) - 0.5) * 0.55;
      float d = length(f - off);
      float twinkle = 0.45 + 0.55 * sin(t * 2.1 + h * 62.8);
      s += on * twinkle * smoothstep(0.045, 0.0, d);
    }
    return s;
  }

  // Liquid colour sheets — light warp (reference bands are broad, not chaotic).
  float ripple(vec3 q, float t, float freq, float phase) {
    float lat = q.y * freq + q.x * 0.35 + phase + t;
    float warp = snoise(vec2(q.x * 1.6 + t * 0.28, q.z * 1.6 - t * 0.22)) * 0.28;
    float ridge = sin(lat * 6.28318 + warp * 2.2);
    return pow(smoothstep(0.25, 0.9, ridge), 1.9);
  }

  float waveH(vec3 n, float t) {
    float w1 = snoise(n.xy * 2.0 + vec2(t * 0.32, -t * 0.25));
    float w2 = snoise(n.yz * 2.8 + vec2(-t * 0.22, t * 0.35));
    return w1 * 0.7 + w2 * 0.3;
  }

  // orb.mp4 centre-brightness envelope → fill 0..1 (5.533s loop).
  float cycleFill(float c) {
    if (c < 0.55) return 0.0;
    if (c < 1.53) return smoothstep(0.55, 1.53, c);
    if (c < 2.53) return 1.0 - smoothstep(1.53, 2.53, c);
    if (c < 3.40) return 0.0;
    // Settled marble climbs faster — by ~4.5s centre is already bright.
    return mix(0.0, 0.92, smoothstep(3.40, 4.55, c));
  }

  // Apparent size surge — bbox peaked at 1.71× around t=1.63s.
  float cycleSize(float c) {
    if (c < 0.85) return 1.0;
    if (c < 1.63) return mix(1.0, 1.71, smoothstep(0.85, 1.63, c));
    if (c < 2.50) return mix(1.71, 1.0, smoothstep(1.63, 2.50, c));
    return mix(1.0, 0.89, smoothstep(2.50, 5.53, c));
  }

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 p0 = vUv - 0.5;
    p0.x *= aspect;

    vec2 lean = (uPointer - 0.5);
    lean.x *= aspect;
    p0 -= lean * uInteractive * 0.045;

    float t = uTime;
    // Real-time 1:1 with the 5.533s reference (keep uSpeed ≈ 1).
    float cycle = mod(t, 5.533);
    float fill = cycleFill(cycle);
    float sizeMul = cycleSize(cycle);

    float R0 = max(uRadius, 0.01);
    float R = R0 * sizeMul;
    float fw = 1.25 / max(uResolution.y, 1.0);

    float r0 = length(p0);
    float clip = smoothstep(R + fw, R - fw, r0);
    float inside = clip;

    float z0 = sqrt(max(R * R - r0 * r0, 0.0));
    vec3 n0 = vec3(p0, z0) / max(R, 1e-4);

    // Mild surface waves — reference deformity is subtle.
    float h = waveH(n0, t) * 0.12;
    float h2 = waveH(n0 + vec3(0.05, 0.02, -0.03), t + 0.7) * 0.12;
    float h3 = waveH(n0 + vec3(-0.03, 0.05, 0.02), t + 1.3) * 0.12;
    vec3 bump = normalize(n0 + vec3(h2 - h, h3 - h, 0.0) * 0.3);
    float ndv = clamp(dot(bump, vec3(0.0, 0.0, 1.0)), 0.0, 1.0);
    float fres = pow(1.0 - ndv, 2.3);

    float warpAmt = (0.004 + 0.008 * fres) * R;
    vec2 p = p0 - bump.xy * warpAmt * inside;
    float swirl = snoise(p * 2.6 / R + t * 0.14);
    p += vec2(swirl, snoise(p.yx * 2.6 / R - t * 0.1)) * warpAmt * 0.15;

    float r = length(p);
    float nr = clamp(r / R, 0.0, 2.0);
    float z = sqrt(max(R * R - r * r, 0.0));
    vec3 n = vec3(p, z) / max(R, 1e-4);

    float yaw = t * 0.22;
    float cy = cos(yaw), sy = sin(yaw);
    vec3 q = vec3(n.x * cy + n.z * sy, n.y, n.z * cy - n.x * sy);
    q += bump * h * 0.1;
    q = normalize(q + vec3(
      snoise(q.yz * 1.5 + t * 0.16),
      snoise(q.xz * 1.5 - t * 0.12),
      snoise(q.xy * 1.5 + t * 0.1)
    ) * 0.07);

    vec2 dir = p / max(r, 1e-4);

    // Warm/cool flank: reference rim is lemon ↔ icy cyan.
    // Widen warm arc (~55%) and bias lower-right so brand yellow holds.
    float spin = t * 0.38;
    float cs = cos(spin), ss = sin(spin);
    vec2 fdir = vec2(dir.x * cs - dir.y * ss, dir.x * ss + dir.y * cs);
    float flank = smoothstep(-0.75, 0.15, -fdir.x * 0.45 - fdir.y * 1.05);
    float warmAmt = clamp(flank * 1.35, 0.0, 1.0);
    vec3 edgeTint = mix(uCool, uWarm, warmAmt);

    float rimNr = nr + h * 0.01;
    float rimBand = smoothstep(0.86, 0.96, rimNr) * smoothstep(1.012, 0.992, rimNr);
    float rim = pow(fres, 1.45) * rimBand;
    float rimWeight = mix(1.55, 0.9, fill);

    vec3 col = vec3(0.0);

    // Body: hollow on rim phases; sapphire glass when filled — keep it from
    // overpowering the gold band.
    float body = inside * fill * (0.22 + 0.5 * fres) * smoothstep(0.02, 0.7, nr);
    vec3 sapphire = mix(vec3(0.05, 0.14, 0.36), uCool, 0.55);
    col += sapphire * body * 1.05;

    // Settled gold band — anchored lower-right like orb.mp4 (not spinning away).
    float goldMask = smoothstep(0.2, 0.9, nr)
                   * smoothstep(0.25, -0.55, dir.y)
                   * smoothstep(-0.35, 0.7, dir.x);
    goldMask = pow(clamp(goldMask, 0.0, 1.0), 0.85);
    col += uWarm * goldMask * fill * inside * 2.1;
    col += mix(uWarm, uCore, 0.3) * goldMask * fill * inside * 0.7;
    // Soft warm bleed along the warm rim into the volume.
    col += uWarm * warmAmt * fill * inside * fres * smoothstep(0.4, 0.95, nr) * 0.55;

    // Colour ripples — cooler sheets + gold crests on the lower band.
    float rip1 = ripple(q, t * 0.22, 0.9, 0.0);
    float rip2 = ripple(q.yzx, t * 0.18, 1.2, 1.4);
    float rip3 = ripple(q.zxy, t * 0.24, 1.05, 2.6);
    float shell = inside * smoothstep(0.25, 0.75, nr) * smoothstep(1.0, 0.88, nr);
    float lower = smoothstep(0.55, -0.35, q.y);
    float ripAmt = shell * fill * (0.3 + 0.7 * lower);
    col += uCool * rip1 * ripAmt * 0.45;
    col += mix(uCool, uWarm, 0.35) * rip2 * ripAmt * 0.4;
    col += uWarm * rip3 * ripAmt * (0.5 + 0.8 * goldMask);

    float ang = atan(dir.y, dir.x) + h * 0.18;
    float rimNoise = fbm(vec2(ang * 2.0 + t * 0.38, 2.0));
    rimNoise = rimNoise * 0.5 + 0.5;
    float rimMod = 0.7 + 0.45 * rimNoise;

    // Prismatic inward gleams — strongest on rim-only phases, but keep them thin.
    vec2 spokeUV = vec2(cos(ang + t * 0.14), sin(ang + t * 0.14));
    float spoke = pow(max(fbm(spokeUV * 4.0 + vec2(t * 0.18, -t * 0.12)) * 0.5 + 0.5, 0.0), 3.8);
    float spoke2 = pow(max(fbm(spokeUV * 7.0 + vec2(-t * 0.2, t * 0.1)) * 0.5 + 0.5, 0.0), 5.0);
    float spokeAmt = spoke * 0.55 + spoke2 * 0.45;
    float streakFade = pow(smoothstep(0.5, 0.92, nr), 1.5) * smoothstep(1.0, 0.86, nr);
    float streaks = spokeAmt * streakFade * inside * uRays * mix(0.55, 0.2, fill);

    float cOff = 0.05;
    float sR = pow(max(fbm(vec2(cos(ang + cOff), sin(ang + cOff)) * 4.0 + t * 0.18) * 0.5 + 0.5, 0.0), 3.5);
    float sB = pow(max(fbm(vec2(cos(ang - cOff), sin(ang - cOff)) * 4.0 + t * 0.18) * 0.5 + 0.5, 0.0), 3.5);
    vec3 streakCol = vec3(
      sR * mix(uWarm.r, 1.0, 0.4),
      spokeAmt * mix(uCool.g, uWarm.g, warmAmt),
      sB * mix(uCool.b, 0.75, 0.3)
    );
    col += streakCol * streaks * 1.25;

    float gleam = pow(max(fbm(spokeUV * 2.0 + nr * 1.4 + t * 0.14) * 0.5 + 0.5, 0.0), 2.4);
    col += edgeTint * gleam * streakFade * inside * 0.22 * uRays;

    vec3 halfV = normalize(vec3(-bump.xy * 0.3, 1.0));
    float spec = pow(max(dot(bump, halfV), 0.0), 36.0);
    col += mix(edgeTint, uCore, 0.45) * spec * inside * smoothstep(0.45, 0.95, nr) * 0.45 * uGlow;

    // Rim — saturated brand gold + icy cyan (avoid washing gold to cream).
    vec3 rimCol = mix(uCool, uWarm, clamp(warmAmt, 0.0, 1.0));
    col += rimCol * rim * rimMod * inside * 5.4 * uGlow * rimWeight;
    col += mix(rimCol, uWarm, 0.55) * pow(max(rim * inside * rimMod, 0.0), 1.25) * 2.2 * uGlow * rimWeight;
    col += mix(uWarm, uCore, 0.15) * rim * inside * warmAmt * 2.8 * uGlow * rimWeight;
    float lip = smoothstep(0.955, 0.999, rimNr) * inside;
    col += mix(rimCol, uCore, 0.3) * lip * 2.4 * uGlow;

    float outer = max(r0 - R, 0.0);
    col += rimCol * exp(-outer / max(fw * 0.55, 1e-4)) * 0.012 * uGlow;

    col += mix(uCore, vec3(1.0), 0.3)
         * sparks(vUv * vec2(aspect, 1.0), t)
         * inside * smoothstep(0.55, 0.95, nr) * (0.08 + 0.3 * fill) * uSparkle;

    // Hollow rim phases: kill residual centre glow so the ring stays empty.
    col *= mix(smoothstep(0.2, 0.78, nr), 1.0, fill);

    col = col / (1.0 + col * 0.75);
    col = pow(max(col, 0.0), vec3(0.92));
    float lit = clamp(max(max(col.r, col.g), col.b), 0.0, 1.0);
    col += (hash21(vUv * 1024.0 + fract(t)) - 0.5) * 0.004 * lit;
    col = max(col, 0.0);

    float a = clamp(max(max(col.r, col.g), col.b), 0.0, 1.0);
    a = max(a, inside * fres * mix(0.15, 0.35, fill) * smoothstep(0.35, 0.9, nr));
    col *= clip;
    a *= clip;
    gl_FragColor = vec4(col, a);
  }
`;

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error("EnergyOrb shader failed:", gl.getShaderInfoLog(s));
  }
  return s;
}

export type EnergyOrbProps = {
  /** Sphere radius, as a fraction of the container's height. */
  radius?: number;
  speed?: number;
  /** The cool flank of the glass rim. */
  coolColor?: string;
  /** The warm flank of the glass rim. */
  warmColor?: string;
  /** The deep glass body. */
  deepColor?: string;
  /** The brightest gleam on the rim and ripples. */
  coreColor?: string;
  /** How strongly the rim holds colour. */
  glow?: number;
  /** Soft internal caustics (contained — never outward rays). */
  rays?: number;
  sparkle?: number;
  /** How far the orb leans toward the pointer. 0 disables it. */
  interactive?: number;
  className?: string;
};

const DEFAULTS = {
  radius: 0.3,
  // 1.0 = real-time with the 5.533s reference loop.
  speed: 1,
  // Rim peaks from orb.mp4: icy cyan ↔ hot lemon (brand gold #e6b325 adjacent).
  coolColor: "#9ef0ff",
  warmColor: "#e6b325",
  deepColor: "#020814",
  coreColor: "#fff4c8",
  glow: 1.6,
  rays: 1.15,
  sparkle: 0.35,
  interactive: 1,
};

/** Rim-phase still for reduced motion — hollow gold/cyan ring. */
const STILL_TIME = 0.25;

export function EnergyOrb(props: EnergyOrbProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef(props);
  propsRef.current = props;

  // Set by the mount effect, read by the prop-sync effect. Uniforms are pushed
  // into the live context rather than rebuilt with it: tearing a context down
  // on every prop change is what exhausts the per-page budget.
  const syncRef = useRef<((p: EnergyOrbProps) => void) | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || typeof window === "undefined") return;

    const canvas = document.createElement("canvas");
    canvas.style.cssText = "display:block;width:100%;height:100%";
    canvas.setAttribute("aria-hidden", "true");
    host.appendChild(canvas);

    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
    });
    if (!gl) {
      canvas.remove();
      return;
    }

    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    gl.useProgram(program);

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    // One oversized triangle covers the viewport with no index buffer.
    const bind = (name: string, data: Float32Array) => {
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(program, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      return buf;
    };
    const posBuf = bind("position", new Float32Array([-1, -1, 3, -1, -1, 3]));
    const uvBuf = bind("uv", new Float32Array([0, 0, 2, 0, 0, 2]));

    const u = (n: string) => gl.getUniformLocation(program, n);
    const uTime = u("uTime");
    const uResolution = u("uResolution");
    const uPointer = u("uPointer");
    const uRadius = u("uRadius");
    const uCool = u("uCool");
    const uWarm = u("uWarm");
    const uDeep = u("uDeep");
    const uCore = u("uCore");
    const uGlow = u("uGlow");
    const uRays = u("uRays");
    const uSparkle = u("uSparkle");
    const uInteractive = u("uInteractive");

    let disposed = false;
    let contextLost = false;
    let raf = 0;
    let visible = true;
    let pageVisible = !document.hidden;
    let speed = DEFAULTS.speed;

    const reduceQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let reduceMotion = reduceQuery?.matches ?? false;

    const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    let elapsed = 0;
    let last = performance.now();

    const draw = () => {
      if (disposed || contextLost) return;
      gl.uniform1f(uTime, reduceMotion ? STILL_TIME : elapsed);
      gl.uniform2f(uPointer, pointer.x, pointer.y);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const sync = (p: EnergyOrbProps) => {
      if (disposed || contextLost) return;
      gl.useProgram(program);
      speed = p.speed ?? DEFAULTS.speed;
      gl.uniform1f(uRadius, p.radius ?? DEFAULTS.radius);
      gl.uniform3fv(uCool, hexToRgb(p.coolColor ?? DEFAULTS.coolColor));
      gl.uniform3fv(uWarm, hexToRgb(p.warmColor ?? DEFAULTS.warmColor));
      gl.uniform3fv(uDeep, hexToRgb(p.deepColor ?? DEFAULTS.deepColor));
      gl.uniform3fv(uCore, hexToRgb(p.coreColor ?? DEFAULTS.coreColor));
      gl.uniform1f(uGlow, p.glow ?? DEFAULTS.glow);
      gl.uniform1f(uRays, p.rays ?? DEFAULTS.rays);
      gl.uniform1f(uSparkle, p.sparkle ?? DEFAULTS.sparkle);
      // Reduced motion keeps the lean, at a third of its travel, so the still
      // is composed rather than inert.
      const lean = p.interactive ?? DEFAULTS.interactive;
      gl.uniform1f(uInteractive, reduceMotion ? lean * 0.35 : lean);
      if (!raf) draw();
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(host.clientWidth * dpr));
      const h = Math.max(1, Math.round(host.clientHeight * dpr));
      if (canvas.width === w && canvas.height === h) return;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uResolution, w, h);
      if (!raf) draw();
    };

    const loop = (now: number) => {
      if (disposed || contextLost) return;
      const dt = Math.min((now - last) * 0.001, 0.05);
      last = now;
      elapsed += dt * speed;
      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;
      draw();
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (raf || disposed || contextLost || reduceMotion) return;
      if (!visible || !pageVisible) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      pointer.tx = (e.clientX - rect.left) / Math.max(rect.width, 1);
      pointer.ty = 1 - (e.clientY - rect.top) / Math.max(rect.height, 1);
      if (reduceMotion) draw();
    };
    const onPointerLeave = () => {
      pointer.tx = 0.5;
      pointer.ty = 0.5;
      if (reduceMotion) draw();
    };
    const onVisibility = () => {
      pageVisible = !document.hidden;
      if (pageVisible) start();
      else stop();
    };
    const onReduce = (e: MediaQueryListEvent) => {
      reduceMotion = e.matches;
      if (reduceMotion) {
        stop();
        sync(propsRef.current);
        draw();
      } else {
        start();
      }
    };
    const onContextLost = (e: Event) => {
      e.preventDefault();
      contextLost = true;
      stop();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(host);

    // The page's WebGL budget is the reason this exists: an orb scrolled out
    // of view must not hold a rAF, and the context is only worth its slot
    // while the thing is actually on screen.
    let io: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
          if (visible) start();
          else stop();
        },
        { threshold: 0, rootMargin: "10%" }
      );
      io.observe(host);
    }

    host.addEventListener("pointermove", onPointerMove);
    host.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("webglcontextlost", onContextLost, false);
    document.addEventListener("visibilitychange", onVisibility);
    reduceQuery?.addEventListener("change", onReduce);

    syncRef.current = sync;
    sync(propsRef.current);
    resize();
    if (reduceMotion) draw();
    else start();

    return () => {
      disposed = true;
      syncRef.current = null;
      stop();
      ro.disconnect();
      io?.disconnect();
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      document.removeEventListener("visibilitychange", onVisibility);
      reduceQuery?.removeEventListener("change", onReduce);
      if (!contextLost) {
        gl.deleteBuffer(posBuf);
        gl.deleteBuffer(uvBuf);
        gl.deleteProgram(program);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      }
      canvas.remove();
    };
  }, []);

  const {
    radius,
    speed,
    coolColor,
    warmColor,
    deepColor,
    coreColor,
    glow,
    rays,
    sparkle,
    interactive,
    className,
  } = props;

  useEffect(() => {
    syncRef.current?.(propsRef.current);
  }, [
    radius,
    speed,
    coolColor,
    warmColor,
    deepColor,
    coreColor,
    glow,
    rays,
    sparkle,
    interactive,
  ]);

  return <div ref={hostRef} className={className} aria-hidden />;
}
