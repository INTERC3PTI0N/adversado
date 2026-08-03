"use client";

import { useEffect, useRef } from "react";

/**
 * Uilora's "Topographic Pulse" background — the real thing this time. The
 * previous version was a guess built to the paid uilora.com listing's public
 * description, since that domain ships the component gated behind
 * `isPremium` with empty source. library.uilora.com serves a different,
 * free build of the same component with the actual shader in its bundle
 * (`_next/static/chunks/262de8f887aa7c13.js`) — ported verbatim below, off
 * OGL onto raw WebGL like the rest of this file's backgrounds.
 */

const VERT = `
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0, 1);
  }
`;

const FRAG = `
  precision highp float;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform vec3 uBaseColor;
  uniform vec3 uLineColor;
  uniform float uSpeed;
  uniform float uComplexity;

  varying vec2 vUv;

  vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
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

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    vec2 p = uv;
    p.x *= aspect;

    // Pulse factor (heartbeat)
    float pulse = sin(uTime * uSpeed * 2.0) * 0.1 + 0.9;

    // Gravity distortion: lines bend toward the mouse
    float mouseDist = distance(uv, uMouse);
    float gravity = smoothstep(0.6, 0.0, mouseDist);
    p += (uMouse - uv) * gravity * 0.2;

    // Topographic heightmap
    float noiseVal = snoise(p * uComplexity + uTime * uSpeed * 0.2);

    // Isolines: fract(noise * density) creates repeating contour bands.
    // Narrower than the source demo's 0.45/0.55 window so the gold reads as
    // fine streaks over the navy instead of broad ribbons competing with it.
    float bands = fract(noiseVal * 4.0);
    float line = smoothstep(0.47, 0.5, bands) - smoothstep(0.5, 0.53, bands);

    // Clamped before the mix. The gravity term pushes this above 1 near the
    // cursor and mix() extrapolates past uLineColor rather than stopping on
    // it — harmless when the line colour was near-black like the original
    // demo's, but with brand gold it overshoots into a hot off-palette
    // yellow. Clamping holds the streaks at exactly gold, never brighter.
    line = clamp(line * pulse * (0.4 + gravity * 0.8), 0.0, 1.0);

    vec3 color = mix(uBaseColor, uLineColor, line);

    float grain = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453) * 0.05;
    color += grain;

    gl_FragColor = vec4(color, 1.0);
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
    console.error("TopographicPulse shader failed:", gl.getShaderInfoLog(s));
  }
  return s;
}

export function TopographicPulse({
  // Brand book palette: navy is the field, gold rides the contour lines.
  // The shader only ever mixes toward lineColor on the thin isoline bands
  // (and scales that by the pulse and mouse proximity), so gold reads as
  // sparse streaks over the blue rather than taking over the frame.
  baseColor = "#1f355e",
  lineColor = "#e6b325",
  speed = 0.4,
  complexity = 1.5,
  className,
}: {
  baseColor?: string;
  lineColor?: string;
  speed?: number;
  complexity?: number;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const canvas = document.createElement("canvas");
    canvas.style.cssText = "display:block;width:100%;height:100%";
    host.appendChild(canvas);

    const gl = canvas.getContext("webgl", { alpha: false, antialias: true });
    if (!gl) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    gl.useProgram(program);

    const bind = (name: string, data: Float32Array) => {
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(program, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    };
    bind("position", new Float32Array([-1, -1, 3, -1, -1, 3]));
    bind("uv", new Float32Array([0, 0, 2, 0, 0, 2]));

    const u = (n: string) => gl.getUniformLocation(program, n);
    const uTime = u("uTime");
    const uResolution = u("uResolution");
    const uMouse = u("uMouse");
    gl.uniform3fv(u("uBaseColor"), hexToRgb(baseColor));
    gl.uniform3fv(u("uLineColor"), hexToRgb(lineColor));
    gl.uniform1f(u("uSpeed"), speed);
    gl.uniform1f(u("uComplexity"), complexity);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(host.clientWidth * dpr));
      const h = Math.max(1, Math.round(host.clientHeight * dpr));
      if (canvas.width === w && canvas.height === h) return;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uResolution, w, h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    // Mouse tracked relative to the host element, damped toward the target —
    // origin used the full window since its background was fixed/global.
    const target = [0.5, 0.5];
    const current = [0.5, 0.5];
    const onMove = (e: MouseEvent) => {
      const rect = host.getBoundingClientRect();
      target[0] = (e.clientX - rect.left) / rect.width;
      target[1] = 1 - (e.clientY - rect.top) / rect.height;
    };
    window.addEventListener("mousemove", onMove);

    const draw = (tMs: number) => {
      current[0] += (target[0] - current[0]) * 0.05;
      current[1] += (target[1] - current[1]) * 0.05;
      gl.uniform2f(uMouse, current[0], current[1]);
      gl.uniform1f(uTime, tMs * 0.001);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    if (reduced) {
      draw(0);
    } else {
      const loop = (t: number) => {
        raf = requestAnimationFrame(loop);
        draw(t);
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("mousemove", onMove);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.remove();
    };
  }, [baseColor, lineColor, speed, complexity]);

  return <div ref={hostRef} className={className} aria-hidden />;
}
