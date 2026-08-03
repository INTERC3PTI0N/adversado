"use client";

import { useEffect, useRef } from "react";

/**
 * Page-reveal wipe — the dissolve mechanic from the "Ironhill" section
 * rebuild (Webgl & ThreeJS Effects #17): an fbm-noise edge sweeping across
 * the screen instead of a straight line, so the reveal tears like a rough
 * horizon rather than a clean wipe.
 *
 * The source drives its edge from scroll position; here it's driven by a
 * fixed-duration tween that runs once, right after the preloader hands off,
 * covering the screen in the preloader's exit colour and then dissolving
 * away to reveal the page underneath.
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

  uniform vec2 uResolution;
  uniform vec3 uColor;
  uniform float uProgress;
  uniform float uSpread;

  varying vec2 vUv;

  float hash(vec2 p) {
    vec3 p3 = vec3(p.xy, 1.0);
    return fract(sin(dot(p3, vec3(37.1, 61.7, 12.4))) * 3758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    v += noise(p * 1.0) * 0.5;
    v += noise(p * 2.0) * 0.25;
    v += noise(p * 4.0) * 0.125;
    return v;
  }

  void main() {
    float aspect = uResolution.x / uResolution.y;
    vec2 centeredUv = (vUv - 0.5) * vec2(aspect, 1.0);

    // Bottom edge dissolves first: low uv.y clears the rising threshold soonest.
    float edge = vUv.y + fbm(centeredUv * 15.0) * uSpread;
    float threshold = uProgress * (1.0 + uSpread);
    float pixelSize = 1.0 / uResolution.y;
    float alpha = smoothstep(threshold - pixelSize, threshold + pixelSize, edge);

    gl_FragColor = vec4(uColor, alpha);
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
    console.error("IronhillTransition shader failed:", gl.getShaderInfoLog(s));
  }
  return s;
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function IronhillTransition({
  color = "#000000",
  spread = 0.5,
  duration = 1.1,
  onDone,
}: {
  color?: string;
  spread?: number;
  duration?: number;
  onDone?: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const canvas = document.createElement("canvas");
    canvas.style.cssText = "display:block;width:100%;height:100%";
    host.appendChild(canvas);

    const gl = canvas.getContext("webgl", { alpha: true, antialias: false });
    if (!gl) {
      onDone?.();
      return;
    }

    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

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
    const uResolution = u("uResolution");
    const uProgress = u("uProgress");
    gl.uniform3fv(u("uColor"), hexToRgb(color));
    gl.uniform1f(u("uSpread"), spread);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(host.clientWidth * dpr));
      const h = Math.max(1, Math.round(host.clientHeight * dpr));
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uResolution, w, h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const draw = (progress: number) => {
      gl.uniform1f(uProgress, progress);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let cancelled = false;

    if (reduced) {
      draw(1);
      const t = setTimeout(() => onDone?.(), 150);
      return () => {
        clearTimeout(t);
        ro.disconnect();
        gl.getExtension("WEBGL_lose_context")?.loseContext();
        canvas.remove();
      };
    }

    draw(0);
    const start = performance.now();
    const loop = (now: number) => {
      if (cancelled) return;
      const t = Math.min(1, (now - start) / 1000 / duration);
      draw(easeInOutCubic(t));
      if (t < 1) {
        raf = requestAnimationFrame(loop);
      } else {
        onDone?.();
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={hostRef}
      className="fixed inset-0 z-[60]"
      style={{ pointerEvents: "none" }}
      aria-hidden
    />
  );
}
