"use client";

import { useEffect, useRef } from "react";

/**
 * Flowing silk/satin shader — the fragment program is Uilora's "Velvet"
 * (library.uilora.com/Backgrounds&Visuals/GradientsPacks/UiloraSilk), kept
 * verbatim: layered simplex noise folds, a specular satin highlight on the
 * peaks, and a little grain.
 *
 * Their build ships it as an OGL component. This runs the same shader on raw
 * WebGL instead — it's a single fullscreen triangle with no geometry, textures
 * or scene graph, so pulling in a 3D library for it would put ~150KB gz in
 * front of the preloader, which is the one thing on the site that must paint
 * immediately.
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
  uniform vec3 uPrimaryColor;
  uniform vec3 uSecondaryColor;
  uniform float uSpeed;
  uniform float uInteractive;
  uniform float uIntensity;

  varying vec2 vUv;

  // --- Smooth Noise Logic ---
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
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
    float ratio = uResolution.x / uResolution.y;
    vec2 pos = vec2(uv.x * ratio, uv.y);

    // SMOOTH INTERACTIVE WAKE
    float dist = distance(uv, uMouse);
    float wake = smoothstep(0.6, 0.0, dist) * uInteractive;
    pos += (uv - uMouse) * wake * 0.3;

    float t = uTime * uSpeed * 0.15;

    // LAYERED FLOW (Creating the Silk folds)
    float n1 = snoise(pos * 0.5 + t);
    float n2 = snoise(pos * 1.2 - t + n1);
    float n3 = snoise(pos * 2.0 + n2 + (t * 0.5));

    // COLOR BLENDING
    float mask = smoothstep(-0.5, 0.8, n3);
    vec3 color = mix(uSecondaryColor, uPrimaryColor, mask);

    // --- SATIN SHINE (Specular) ---
    // This finds the "peaks" of the flow and adds a creamy highlight
    float specular = pow(max(0.0, n3), 3.0) * uIntensity;
    color += specular * vec3(1.0, 1.0, 0.95);

    // Subtle grain for high-end texture
    float grain = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453) * 0.04;
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
    console.error("Silk shader failed:", gl.getShaderInfoLog(s));
  }
  return s;
}

export function Silk({
  primaryColor = "#2d1b69",
  secondaryColor = "#050212",
  speed = 1,
  interactive = 0.5,
  intensity = 0.4,
  className,
}: {
  primaryColor?: string;
  secondaryColor?: string;
  speed?: number;
  interactive?: number;
  intensity?: number;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const canvas = document.createElement("canvas");
    canvas.style.cssText = "display:block;width:100%;height:100%";
    host.appendChild(canvas);

    const gl = canvas.getContext("webgl", { alpha: false, antialias: false });
    if (!gl) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    gl.useProgram(program);

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
    bind("position", new Float32Array([-1, -1, 3, -1, -1, 3]));
    bind("uv", new Float32Array([0, 0, 2, 0, 0, 2]));

    const u = (n: string) => gl.getUniformLocation(program, n);
    const uTime = u("uTime");
    const uResolution = u("uResolution");
    const uMouse = u("uMouse");

    gl.uniform3fv(u("uPrimaryColor"), hexToRgb(primaryColor));
    gl.uniform3fv(u("uSecondaryColor"), hexToRgb(secondaryColor));
    gl.uniform1f(u("uSpeed"), speed);
    gl.uniform1f(u("uInteractive"), interactive);
    gl.uniform1f(u("uIntensity"), intensity);

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

    // Pointer wake, damped so it trails the cursor rather than snapping to it.
    const target = [0.5, 0.5];
    const current = [0.5, 0.5];
    const onMove = (e: MouseEvent) => {
      target[0] = e.clientX / window.innerWidth;
      target[1] = 1 - e.clientY / window.innerHeight;
    };
    window.addEventListener("mousemove", onMove);

    const draw = (tMs: number) => {
      current[0] += (target[0] - current[0]) * 0.06;
      current[1] += (target[1] - current[1]) * 0.06;
      gl.uniform2f(uMouse, current[0], current[1]);
      gl.uniform1f(uTime, tMs * 0.001);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    if (reduced) {
      // Still a silk field, just not a moving one.
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
  }, [primaryColor, secondaryColor, speed, interactive, intensity]);

  return <div ref={hostRef} className={className} aria-hidden />;
}
