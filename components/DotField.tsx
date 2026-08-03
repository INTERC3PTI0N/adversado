"use client";

import { useEffect, useRef } from "react";

/**
 * Interactive dot matrix: a regular grid of points that scatters away from
 * the cursor and warms toward gold as it does. The displacement falls off
 * smoothly with distance, so the pointer reads as a repulsion field pushing
 * through the grid rather than a hard cutoff.
 *
 * Drawn as GL_POINTS with the displacement done in the vertex shader — the
 * whole field is one draw call and the CPU never touches per-dot geometry,
 * which is what makes a few thousand dots viable on every pointer move.
 */

const VERT = `
  attribute vec2 aPos;
  uniform vec2 uMouse;
  uniform float uAspect;
  uniform float uRadius;
  uniform float uStrength;
  uniform float uSize;
  varying float vFall;

  void main() {
    // Distance measured in aspect-corrected space so the field of influence
    // is a circle on screen rather than an ellipse stretched by the viewport.
    vec2 d = aPos - uMouse;
    d.x *= uAspect;
    float dist = length(d);

    float fall = 1.0 - smoothstep(0.0, uRadius, dist);
    vFall = fall;

    vec2 dir = dist > 0.0001 ? d / dist : vec2(0.0);
    dir.x /= uAspect;

    gl_Position = vec4(aPos + dir * fall * uStrength, 0.0, 1.0);
    gl_PointSize = uSize * (1.0 + fall * 1.8);
  }
`;

const FRAG = `
  precision mediump float;
  uniform vec3 uDot;
  uniform vec3 uAccent;
  varying float vFall;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float edge = smoothstep(0.5, 0.34, d);
    gl_FragColor = vec4(mix(uDot, uAccent, vFall), edge * (0.32 + vFall * 0.68));
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
    console.error("DotField shader failed:", gl.getShaderInfoLog(s));
  }
  return s;
}

export function DotField({
  dotColor = "#1f355e",
  accentColor = "#e6b325",
  spacing = 26,
  dotSize = 2.1,
  radius = 0.26,
  strength = 0.045,
  className,
}: {
  dotColor?: string;
  accentColor?: string;
  spacing?: number;
  dotSize?: number;
  radius?: number;
  strength?: number;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const canvas = document.createElement("canvas");
    canvas.style.cssText = "display:block;width:100%;height:100%";
    host.appendChild(canvas);

    const gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: false });
    if (!gl) return;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = (n: string) => gl.getUniformLocation(program, n);
    const uMouse = u("uMouse");
    const uAspect = u("uAspect");
    gl.uniform3fv(u("uDot"), hexToRgb(dotColor));
    gl.uniform3fv(u("uAccent"), hexToRgb(accentColor));
    gl.uniform1f(u("uRadius"), radius);
    gl.uniform1f(u("uStrength"), strength);

    let count = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const build = () => {
      const w = Math.max(1, host.clientWidth);
      const h = Math.max(1, host.clientHeight);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(uAspect, w / h);
      gl.uniform1f(u("uSize"), dotSize * dpr);

      const cols = Math.ceil(w / spacing);
      const rows = Math.ceil(h / spacing);
      const pts = new Float32Array(cols * rows * 2);
      let i = 0;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          // Half-step inset keeps the grid visually centred instead of
          // hugging the top-left corner when the size isn't a clean multiple.
          pts[i++] = ((x + 0.5) / cols) * 2 - 1;
          pts[i++] = 1 - ((y + 0.5) / rows) * 2;
        }
      }
      count = cols * rows;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, pts, gl.STATIC_DRAW);
    };
    build();
    const ro = new ResizeObserver(build);
    ro.observe(host);

    // Parked far outside clip space so the field rests undisturbed until the
    // pointer actually arrives over the section.
    const PARKED = 99;
    const target = [PARKED, PARKED];
    const current = [PARKED, PARKED];

    // Listens on the window, not the canvas: the copy sits above this layer,
    // so a canvas-bound listener would go dead the moment the pointer crossed
    // a paragraph — and the alternative, pointer-events-none on the text,
    // would cost the reader the ability to select it.
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      const inside =
        e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) {
        target[0] = PARKED;
        target[1] = PARKED;
        return;
      }
      target[0] = ((e.clientX - r.left) / r.width) * 2 - 1;
      target[1] = 1 - ((e.clientY - r.top) / r.height) * 2;
    };
    window.addEventListener("pointermove", onMove);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const draw = () => {
      current[0] += (target[0] - current[0]) * 0.12;
      current[1] += (target[1] - current[1]) * 0.12;
      gl.uniform2f(uMouse, current[0], current[1]);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.POINTS, 0, count);
    };

    if (reduced) {
      draw();
    } else {
      const loop = () => {
        raf = requestAnimationFrame(loop);
        draw();
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={hostRef} className={className} aria-hidden />;
}
