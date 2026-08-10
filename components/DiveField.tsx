"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

export type DiveFieldLayer = {
  body: string;
};

export type DiveFieldProps = {
  layers: DiveFieldLayer[];
  /** 0..1 scrub through the stack. Driven by DiveFieldSection. */
  progress?: number;
  className?: string;
  style?: CSSProperties;
  textColor?: string;
  accent?: string;
  rgbShift?: number;
  rgbShiftVel?: number;
  damping?: number;
  uppercase?: boolean;
  sideMargin?: number;
  fontFamily?: string;
  fontWeight?: number;
  fontSize?: number;
  lineHeight?: number;
  letterSpacing?: number;
  /** UV wave amplitude for the text planes (0 = flat). */
  wobble?: number;
};

export type DiveFieldSectionProps = Omit<DiveFieldProps, "progress"> & {
  /** Viewport-heights of scroll runway per plane after the first. */
  vhPerPlane?: number;
  caption?: string;
};

type LayerGpu = {
  tex: WebGLTexture;
  w: number;
  h: number;
  hRatio: number;
  offX: number;
  offY: number;
  rot: number;
  seed: number;
};

type Runtime = {
  gl: WebGLRenderingContext;
  textProg: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
  aPos: number;
  quad: WebGLBuffer;
  layers: LayerGpu[];
  dispose: () => void;
};

const TEX_W = 2048;
const TEX_H_MAX = 4096;
const DPR_CAP = 1.5;
const FOCUS_OFFSET = 1.0;

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
uniform vec2 uScale;
uniform vec3 uPlanePos;
uniform float uRot;
uniform float uAspect;
uniform float uFov;
uniform vec3 uCam;

void main() {
  vUv = aPos * 0.5 + 0.5;
  float c = cos(uRot);
  float s = sin(uRot);
  vec2 local = aPos * 0.5 * uScale;
  vec2 spun = vec2(local.x * c - local.y * s, local.x * s + local.y * c);
  vec3 world = vec3(spun.x + uPlanePos.x, spun.y + uPlanePos.y, uPlanePos.z);
  vec3 view = world - uCam;
  float f = 1.0 / tan(uFov * 0.01745329251 * 0.5);
  float z = max(-view.z, 0.05);
  vec2 clip = vec2(view.x * f / (z * uAspect), view.y * f / z);
  float depth = clamp((z - 0.05) / 80.0, 0.0, 1.0);
  gl_Position = vec4(clip, depth * 2.0 - 1.0, 1.0);
}
`;

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform float uTime;
uniform float uVel;
uniform float uFog;
uniform float uDiss;
uniform float uAct;
uniform float uFar;
uniform float uSeed;
uniform float uRgbShift;
uniform float uRgbShiftVel;
uniform float uWarmth;
uniform float uWobble;
uniform float uDepthTint;
uniform vec3 uTextColor;
uniform vec3 uHeadingColor;

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

void main() {
  float wobX = sin(vUv.y * 15.0 + uTime * 1.4) * uWobble;
  float wobY = sin(vUv.x * 21.0 - uTime * 1.1) * uWobble * 0.7;
  vec2 uv = vec2(vUv.x + wobX, 1.0 - (vUv.y + wobY));
  float shift = uRgbShift + abs(uVel) * uRgbShiftVel;
  vec2 off = (uv - 0.5) * shift;
  vec4 sR = texture2D(uTex, uv + off);
  vec4 sG = texture2D(uTex, uv + off * uWarmth);
  vec4 sB = texture2D(uTex, uv - off);

  float n = noise(uv * vec2(9.0, 5.0) + uSeed) * 0.65
    + noise(uv * vec2(27.0, 15.0) + uSeed) * 0.35;
  float edge0 = uDiss * 1.15 - 0.1;
  float keep = smoothstep(edge0, edge0 + 0.09, n);
  float rim = smoothstep(edge0, edge0 + 0.16, n)
    * (1.0 - smoothstep(edge0 + 0.16, edge0 + 0.34, n));

  vec3 rgb = vec3(
    uTextColor.r * sR.r + uHeadingColor.r * sR.g,
    uTextColor.g * sG.r + uHeadingColor.g * sG.g,
    uTextColor.b * sB.r + uHeadingColor.b * sB.g
  );
  float alpha = max(sG.r, sG.g);
  rgb = mix(rgb, uHeadingColor * 0.55 * alpha, uFar * uDepthTint);
  rgb *= keep * uFog;
  vec3 rimCol = mix(uHeadingColor, vec3(1.0, 0.95, 0.9), 0.35);
  rgb += rimCol * rim * alpha * uAct * uFog;
  float a = alpha * keep * uFog;
  if (a < 0.01) discard;
  gl_FragColor = vec4(rgb, a);
}
`;

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

function hash(n: number) {
  const t = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return t - Math.floor(t);
}

function parseColor(input: string): [number, number, number] {
  const t = input.trim();
  const hex = t.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    return [
      parseInt(h.slice(0, 2), 16) / 255,
      parseInt(h.slice(2, 4), 16) / 255,
      parseInt(h.slice(4, 6), 16) / 255,
    ];
  }
  return [1, 1, 1];
}

function normalizeLayers(layers: DiveFieldLayer[]) {
  const out = layers
    .map((l) => (l.body || "").trim())
    .filter(Boolean)
    .map((body) => ({ body: [body] }));
  return out.length ? out : [{ body: ["Add a layer to begin."] }];
}

function tokenizeMarked(text: string, uppercase: boolean) {
  type Token = { text: string; mark: boolean };
  const tokens: Token[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    if (match.index > last) {
      tokens.push({ text: text.slice(last, match.index), mark: false });
    }
    tokens.push({ text: match[1], mark: true });
    last = match.index + match[0].length;
  }
  if (last < text.length) tokens.push({ text: text.slice(last), mark: false });

  const words: { text: string; mark: boolean }[] = [];
  for (const token of tokens) {
    const parts = token.text.split(/(\s+)/);
    for (const part of parts) {
      if (!part || /^\s+$/.test(part)) continue;
      words.push({
        text: uppercase ? part.toUpperCase() : part,
        mark: token.mark,
      });
    }
  }
  return words;
}

function rasterizeLayer(
  layer: { body: string[] },
  opts: {
    uppercase: boolean;
    sideMargin: number;
    fontFamily: string;
    fontWeight: number;
    fontSize: number;
    lineHeight: number;
    letterSpacing: number;
  },
) {
  const scale = TEX_W / 1000;
  const size = opts.fontSize * scale;
  const lineH = size * opts.lineHeight;
  const tracking = opts.letterSpacing;
  const usable = TEX_W - TEX_W * opts.sideMargin * 2;

  const canvas = document.createElement("canvas");
  canvas.width = TEX_W;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const applyFont = () => {
    ctx.font = `${opts.fontWeight} ${size}px ${opts.fontFamily}`;
    ctx.letterSpacing = `${tracking * size}px`;
  };
  applyFont();

  const spaceW = ctx.measureText(" ").width;
  type Word = { text: string; mark: boolean; width: number };
  type Line = { words: Word[]; sum: number };
  const lines: Line[] = [];
  const paraBreak: boolean[] = [];

  for (const para of layer.body) {
    const words = tokenizeMarked(para, opts.uppercase).map((w) => ({
      ...w,
      width: ctx.measureText(w.text).width,
    }));
    const start = lines.length;
    let cur: Line = { words: [], sum: 0 };
    const flush = () => {
      if (!cur.words.length) return;
      lines.push(cur);
      paraBreak.push(false);
      cur = { words: [], sum: 0 };
    };
    for (const word of words) {
      const nextSum =
        cur.sum + word.width + (cur.words.length > 0 ? spaceW : 0);
      if (cur.words.length > 0 && nextSum > usable) flush();
      cur.words.push(word);
      cur.sum += word.width;
    }
    flush();
    if (lines.length > start) paraBreak[lines.length - 1] = true;
  }

  const paraGap = lineH * 0.45;
  let height = size * 0.85 * 2;
  for (let i = 0; i < lines.length; i++) {
    height += lineH;
    if (paraBreak[i] && i < lines.length - 1) height += paraGap;
  }

  canvas.height = Math.min(TEX_H_MAX, Math.max(128, Math.ceil(height)));
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textBaseline = "alphabetic";
  applyFont();

  let y = size * 0.85 * 2;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const width = line.sum + spaceW * Math.max(0, line.words.length - 1);
    let x = (TEX_W - width) / 2;
    for (const word of line.words) {
      ctx.fillStyle = word.mark ? "#00ff00" : "#ff0000";
      ctx.fillText(word.text, x, y);
      x += word.width + spaceW;
    }
    y += lineH;
    if (paraBreak[i] && i < lines.length - 1) y += paraGap;
  }
  return canvas;
}

function compileShader(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function linkProgram(gl: WebGLRenderingContext, vsSrc: string, fsSrc: string) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSrc);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    gl.deleteProgram(prog);
    return null;
  }
  return prog;
}

function makeTexture(gl: WebGLRenderingContext, image: HTMLCanvasElement) {
  const tex = gl.createTexture();
  if (!tex) return null;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  return tex;
}

function getUniforms(gl: WebGLRenderingContext, prog: WebGLProgram) {
  const names = [
    "uTex",
    "uScale",
    "uPlanePos",
    "uRot",
    "uAspect",
    "uFov",
    "uCam",
    "uTime",
    "uVel",
    "uFog",
    "uDiss",
    "uAct",
    "uFar",
    "uSeed",
    "uRgbShift",
    "uRgbShiftVel",
    "uWarmth",
    "uWobble",
    "uDepthTint",
    "uTextColor",
    "uHeadingColor",
  ] as const;
  const out: Record<string, WebGLUniformLocation | null> = {};
  for (const name of names) out[name] = gl.getUniformLocation(prog, name);
  return out;
}

/**
 * Dive Field canvas — camera is driven by `progress` (0..1).
 * Use DiveFieldSection so the frame pins full-viewport before scrubbing.
 */
export function DiveField({
  layers,
  progress = 0,
  className = "",
  style,
  textColor = "#f9f7f2",
  accent = "#e6b325",
  rgbShift = 0,
  rgbShiftVel = 0,
  damping = 0.48,
  uppercase = false,
  sideMargin = 0.04,
  fontFamily = "Montserrat, ui-sans-serif, system-ui, sans-serif",
  fontWeight = 800,
  fontSize = 64,
  lineHeight = 1.15,
  letterSpacing = -0.04,
  wobble = 0.0035,
}: DiveFieldProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  const [reduced, setReduced] = useState(false);

  const contentRef = useRef({
    layers,
    uppercase,
    sideMargin,
    fontFamily,
    fontWeight,
    fontSize,
    lineHeight,
    letterSpacing,
  });
  contentRef.current = {
    layers,
    uppercase,
    sideMargin,
    fontFamily,
    fontWeight,
    fontSize,
    lineHeight,
    letterSpacing,
  };

  const lookRef = useRef({ textColor, accent, rgbShift, rgbShiftVel, wobble });
  lookRef.current = { textColor, accent, rgbShift, rgbShiftVel, wobble };

  const progressRef = useRef(progress);
  progressRef.current = progress;

  const dampingRef = useRef(damping);
  dampingRef.current = damping;

  const apiRef = useRef<{ markDirty: () => void; kick: () => void } | null>(
    null,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    apiRef.current?.markDirty();
    apiRef.current?.kick();
  }, [
    layers,
    uppercase,
    sideMargin,
    fontFamily,
    fontWeight,
    fontSize,
    lineHeight,
    letterSpacing,
    textColor,
    accent,
    rgbShift,
    rgbShiftVel,
    wobble,
  ]);

  useEffect(() => {
    apiRef.current?.kick();
  }, [progress]);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    let dead = false;
    let raf = 0;
    let runtime: Runtime | null = null;
    let layersDirty = true;
    let building = false;
    let camera = 0;
    let last = performance.now();
    let visible = true;
    let size = { w: 1, h: 1 };
    let textRgb: [number, number, number] = parseColor(textColor);
    let accentRgb: [number, number, number] = parseColor(accent);
    let textKey = "";
    let accentKey = "";
    let layerKey = "";

    const fov = 78;
    const layerGap = 13.5;
    const fill = 0.72;
    const scatter = 0.08;
    const tilt = 0.03;
    const fogNear = 1.05;
    const fogFar = 2.35;
    const dissolveStart = 1.05;
    const depthTint = 0.42;

    const kick = () => {
      if (dead || raf !== 0) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const rebuildLayers = async (rt: Runtime) => {
      const cfg = contentRef.current;
      const key = JSON.stringify([
        cfg.layers,
        cfg.uppercase,
        cfg.sideMargin,
        cfg.fontFamily,
        cfg.fontWeight,
        cfg.fontSize,
        cfg.lineHeight,
        cfg.letterSpacing,
      ]);
      if (key === layerKey) return;
      layerKey = key;
      await Promise.race([
        (async () => {
          const family =
            cfg.fontFamily.split(",")[0]?.trim().replace(/["']/g, "") ||
            "sans-serif";
          await document.fonts.load(`${cfg.fontWeight} 20px ${family}`);
          await document.fonts.ready;
        })(),
        new Promise((resolve) => setTimeout(resolve, 1200)),
      ]);
      if (dead) return;
      for (const layer of rt.layers) rt.gl.deleteTexture(layer.tex);
      rt.layers = [];
      const items = normalizeLayers(cfg.layers);
      for (let i = 0; i < items.length; i++) {
        const bmp = rasterizeLayer(items[i], cfg);
        const tex = makeTexture(rt.gl, bmp);
        if (!tex) continue;
        rt.layers.push({
          tex,
          w: bmp.width,
          h: bmp.height,
          hRatio: bmp.height / bmp.width,
          offX: 0,
          offY: 0,
          rot: 0,
          seed: hash(i * 3.1 + 0.7) * 37,
        });
      }
    };

    const resize = () => {
      size.w = root.clientWidth || 1;
      size.h = root.clientHeight || 1;
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      canvas.width = Math.max(1, Math.floor(size.w * dpr));
      canvas.height = Math.max(1, Math.floor(size.h * dpr));
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      runtime?.gl.viewport(0, 0, canvas.width, canvas.height);
      kick();
    };

    const draw = (rt: Runtime, dt: number) => {
      const look = lookRef.current;
      const gl = rt.gl;
      const max = Math.max(0, rt.layers.length - 1);
      const desired = clamp(progressRef.current, 0, 1) * max;
      const settle = reduced
        ? 1
        : 1 - (1 - Math.min(0.99, dampingRef.current)) ** (dt * 60);
      camera += (desired - camera) * settle;

      const aspect = size.w / size.h;
      const now = performance.now() / 1000;

      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(rt.textProg);
      gl.bindBuffer(gl.ARRAY_BUFFER, rt.quad);
      gl.enableVertexAttribArray(rt.aPos);
      gl.vertexAttribPointer(rt.aPos, 2, gl.FLOAT, false, 0, 0);

      if (look.textColor !== textKey) {
        textKey = look.textColor;
        textRgb = parseColor(look.textColor);
      }
      if (look.accent !== accentKey) {
        accentKey = look.accent;
        accentRgb = parseColor(look.accent);
      }

      const u = rt.uniforms;
      const nearPlane = -0.75;
      const count = rt.layers.length;

      for (let i = 0; i < count; i++) {
        const layer = rt.layers[i];
        const depth = i - camera + FOCUS_OFFSET;
        if (!(depth > nearPlane - 0.05 && depth < fogFar + 0.3)) continue;

        layer.offX = (hash(i * 13.7 + 1.3) - 0.5) * 2;
        layer.offY = (hash(i * 27.9 + 5.1) - 0.5) * 2;
        layer.rot = (hash(i * 7.3 + 9.7) - 0.5) * 2;
        layer.seed = hash(i * 3.1 + 0.7) * 37;

        const z = -depth * layerGap;
        let width =
          2 * layerGap * Math.tan((fov * Math.PI) / 360) * aspect * fill;
        const maxH = 2 * layerGap * Math.tan((fov * Math.PI) / 360) * 0.86;
        if (width * layer.hRatio > maxH) width = maxH / layer.hRatio;
        const height = width * layer.hRatio;

        const fog =
          1 -
          clamp((depth - fogNear) / Math.max(fogFar - fogNear, 0.01), 0, 1);
        const fogCube = fog * fog * fog;
        const dissolve =
          1 -
          clamp(
            (depth - nearPlane) / Math.max(dissolveStart - nearPlane, 0.01),
            0,
            1,
          );
        const far = clamp((depth - 1) / Math.max(fogFar - 1, 0.01), 0, 1);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, layer.tex);
        gl.uniform1i(u.uTex, 0);
        gl.uniform2f(u.uScale, width, height);
        gl.uniform3f(
          u.uPlanePos,
          layer.offX * scatter * width * 0.35,
          layer.offY * scatter * width * 0.16,
          z,
        );
        gl.uniform1f(u.uRot, layer.rot * tilt * (Math.PI / 180));
        gl.uniform1f(u.uAspect, aspect);
        gl.uniform1f(u.uFov, fov);
        gl.uniform3f(u.uCam, 0, 0, 0);
        gl.uniform1f(u.uTime, now);
        gl.uniform1f(u.uVel, 0);
        gl.uniform1f(u.uFog, fogCube);
        gl.uniform1f(u.uDiss, dissolve);
        gl.uniform1f(u.uAct, 0);
        gl.uniform1f(u.uFar, far);
        gl.uniform1f(u.uSeed, layer.seed);
        gl.uniform1f(u.uRgbShift, look.rgbShift);
        gl.uniform1f(u.uRgbShiftVel, look.rgbShiftVel);
        gl.uniform1f(u.uWarmth, 0.32);
        gl.uniform1f(u.uWobble, reduced ? 0 : look.wobble);
        gl.uniform1f(u.uDepthTint, depthTint);
        gl.uniform3f(u.uTextColor, textRgb[0], textRgb[1], textRgb[2]);
        gl.uniform3f(
          u.uHeadingColor,
          accentRgb[0],
          accentRgb[1],
          accentRgb[2],
        );
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
      gl.disable(gl.BLEND);
    };

    const shouldTick = () => {
      if (!visible) return false;
      if (layersDirty || building) return true;
      const look = lookRef.current;
      if (!reduced && look.wobble > 0) return true;
      const max = Math.max(0, (runtime?.layers.length ?? 1) - 1);
      const desired = clamp(progressRef.current, 0, 1) * max;
      return Math.abs(desired - camera) > 0.0008;
    };

    const frame = (now: number) => {
      if (dead || !runtime) {
        raf = 0;
        return;
      }
      raf = 0;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (layersDirty && !building) {
        layersDirty = false;
        building = true;
        rebuildLayers(runtime)
          .catch(() => {})
          .finally(() => {
            building = false;
            if (!dead) kick();
          });
      }
      draw(runtime, dt);
      if (shouldTick()) raf = requestAnimationFrame(frame);
    };

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
    });
    if (!gl) {
      setFailed(true);
      return;
    }
    const prog = linkProgram(gl, VERT, FRAG);
    if (!prog) {
      setFailed(true);
      return;
    }
    const quad = gl.createBuffer();
    if (!quad) {
      setFailed(true);
      return;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    runtime = {
      gl,
      textProg: prog,
      uniforms: getUniforms(gl, prog),
      aPos: gl.getAttribLocation(prog, "aPos"),
      quad,
      layers: [],
      dispose: () => {
        for (const layer of runtime?.layers ?? []) gl.deleteTexture(layer.tex);
        gl.deleteBuffer(quad);
        gl.deleteProgram(prog);
      },
    };

    apiRef.current = {
      markDirty: () => {
        layersDirty = true;
        layerKey = "";
      },
      kick,
    };

    resize();
    layersDirty = true;
    kick();

    const ro = new ResizeObserver(resize);
    ro.observe(root);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (visible) kick();
      else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    io.observe(root);

    return () => {
      dead = true;
      apiRef.current = null;
      cancelAnimationFrame(raf);
      raf = 0;
      ro.disconnect();
      io.disconnect();
      runtime?.dispose();
      runtime = null;
    };
  }, [accent, reduced, textColor]);

  return (
    <div
      ref={rootRef}
      data-kern-dive-field
      role="region"
      aria-label="Dive Field"
      className={`relative h-full w-full overflow-hidden ${className}`.trim()}
      style={style}
    >
      <canvas ref={canvasRef} className="block h-full w-full bg-transparent" />
      {failed && (
        <div className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-cream/70">
          WebGL unavailable — Dive Field needs a GPU canvas.
        </div>
      )}
      <div className="sr-only">
        {layers.map((layer, i) => (
          <p key={i}>{layer.body.replace(/\*\*/g, "")}</p>
        ))}
      </div>
    </div>
  );
}

/**
 * Full-viewport dive scrubbed by page scroll.
 *
 * Uses a manual fixed pin (not position:sticky) because About/Site shells use
 * overflow-x-hidden, which forces overflow-y and kills sticky.
 * Progress stays 0 until the section is fully parked (top ≤ 0).
 */
export function DiveFieldSection({
  layers,
  vhPerPlane = 90,
  caption = "The Story · scroll through the planes",
  className = "",
  ...fieldProps
}: DiveFieldSectionProps) {
  const trackRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    const pin = pinRef.current;
    if (!track || !pin) return;

    const update = () => {
      const rect = track.getBoundingClientRect();
      const vh = window.innerHeight;
      const range = Math.max(1, track.offsetHeight - vh);

      // Match track horizontal box when fixed (full-bleed on About).
      const applyBox = (mode: "before" | "pinned" | "after") => {
        pin.style.height = `${vh}px`;
        pin.style.width = `${rect.width}px`;
        if (mode === "pinned") {
          pin.style.position = "fixed";
          pin.style.top = "0px";
          pin.style.left = `${rect.left}px`;
          pin.style.bottom = "auto";
        } else if (mode === "before") {
          pin.style.position = "absolute";
          pin.style.top = "0px";
          pin.style.left = "0px";
          pin.style.bottom = "auto";
          pin.style.width = "100%";
        } else {
          pin.style.position = "absolute";
          pin.style.top = "auto";
          pin.style.left = "0px";
          pin.style.bottom = "0px";
          pin.style.width = "100%";
        }
      };

      if (rect.top > 0) {
        applyBox("before");
        setProgress(0);
        return;
      }
      if (rect.bottom <= vh) {
        applyBox("after");
        setProgress(1);
        return;
      }
      applyBox("pinned");
      setProgress(clamp(-rect.top / range, 0, 1));
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const lenis = window.__lenis;
    lenis?.on("scroll", update);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      lenis?.off("scroll", update);
    };
  }, [layers.length, vhPerPlane]);

  const runway = Math.max(1, layers.length - 1) * vhPerPlane + 100;

  return (
    <section
      ref={trackRef}
      className={`relative w-full ${className}`.trim()}
      style={{ height: `${runway}svh` }}
    >
      <div
        ref={pinRef}
        className="z-[1] w-full"
        style={{ position: "absolute", top: 0, left: 0, height: "100svh" }}
      >
        <div className="absolute inset-0 bg-[#06040a]/55" aria-hidden />
        <DiveField
          className="relative z-[1]"
          layers={layers}
          progress={progress}
          {...fieldProps}
        />
        {caption ? (
          <p className="pointer-events-none absolute bottom-6 left-1/2 z-[2] -translate-x-1/2 text-center text-[0.65rem] uppercase tracking-[0.28em] text-cream/45">
            {caption}
          </p>
        ) : null}
      </div>
    </section>
  );
}

export default DiveField;
