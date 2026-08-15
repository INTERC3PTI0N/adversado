"use client";

import { useEffect, useRef } from "react";

/**
 * Dither Reveal — an image redrawn as an ordered-dither pattern that ripples on
 * its own and tears open into full colour under the cursor.
 *
 * Same construction as Silk: one fullscreen triangle on raw WebGL, no 3D
 * library. The whole effect is a single fragment program.
 *
 * The page runs close to the browser's per-page WebGL context ceiling (~16), so
 * this only creates its context once it is near the viewport and drops it again
 * on unmount. It also parks the rAF loop while off-screen.
 *
 * ponytail: bayer8 only — the diagonal/noise dither modes aren't used anywhere,
 * add them as a `ditherStyle` branch in the shader if a second look is needed.
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

  uniform sampler2D uImage;
  uniform vec2 uResolution;   // canvas, device px
  uniform vec2 uImageSize;    // natural image size
  uniform vec2 uReveal;       // reveal centre, canvas px
  uniform float uTime;
  uniform float uFit;         // 0 = cover, 1 = contain
  uniform float uFocusY;      // 0..1 crop anchor when covering
  uniform float uDotSize;     // dither cell, CSS px * dpr
  uniform float uRadius;      // reveal radius, CSS px * dpr
  uniform float uSoftness;    // 0 hard cut .. 1 all gradient
  uniform float uWave;
  uniform float uWaveDensity;
  uniform vec3 uInk;          // colour of the dithered dots
  uniform float uKeyWhite;    // 1 = knock a flat white backdrop out of the art

  varying vec2 vUv;

  /* Ordered 8x8 Bayer threshold, built by nesting the 2x2 kernel twice — a
     lookup texture for 64 constants would be a second texture unit for nothing. */
  float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
  float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
  float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer4(a); }

  void main() {
    vec2 frag = vUv * uResolution;

    // Sample per dither cell, not per pixel, so the pattern reads as dots
    // rather than as noise over a photo.
    vec2 cell = (floor(frag / uDotSize) + 0.5) * uDotSize;

    // Cover/contain mapping. Scale is the ratio of the frame's aspect to the
    // image's; cover takes the larger crop, contain the smaller.
    float frameA = uResolution.x / uResolution.y;
    float imageA = uImageSize.x / uImageSize.y;
    vec2 s = frameA > imageA
      ? vec2(1.0, imageA / frameA)
      : vec2(frameA / imageA, 1.0);
    if (uFit < 0.5) s = 1.0 / s;                    // cover = invert contain
    vec2 uv = (cell / uResolution - 0.5) / s + 0.5;
    uv.y += (uFit < 0.5) ? (uFocusY - 0.5) * (1.0 - s.y) / s.y : 0.0;
    uv.y = 1.0 - uv.y;                              // GL origin is bottom-left

    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
      gl_FragColor = vec4(0.0);
      return;
    }

    vec4 photo = texture2D(uImage, uv);

    /* Artwork delivered on a flat white plate would otherwise dither to a solid
       cream block edge to edge. Keying on the darkest channel drops the plate
       without touching saturated pixels — a gold highlight still has a low blue. */
    float plate = smoothstep(0.86, 0.99, min(min(photo.r, photo.g), photo.b));
    photo.a *= 1.0 - plate * uKeyWhite;

    float lum = dot(photo.rgb, vec3(0.2126, 0.7152, 0.0722));

    // Idle ripple: a travelling crest that pushes the threshold up and down, so
    // dots gain and shed weight in bands instead of the frame sitting still.
    float ripple = sin((uv.x + uv.y) * uWaveDensity + uTime) * 0.5 + 0.5;
    lum += (ripple - 0.5) * 0.22 * uWave;

    float threshold = bayer8(frag / uDotSize);
    float dot_ = step(threshold, lum);

    // Flashlight. Softness 0 is a hard edge, 1 fades from the centre out.
    float d = distance(frag, uReveal);
    float inner = uRadius * (1.0 - clamp(uSoftness, 0.0, 0.999));
    float m = 1.0 - smoothstep(inner, uRadius, d);

    vec3 rgb = mix(uInk, photo.rgb, m);
    float a = mix(dot_ * photo.a, photo.a, m);
    gl_FragColor = vec4(rgb, a);
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
    console.error("DitherReveal shader failed:", gl.getShaderInfoLog(s));
  }
  return s;
}

export function DitherReveal({
  image,
  alt,
  fit = "cover",
  focusY = 50,
  dotSize = 5,
  revealRadius = 100,
  revealSoftness = 50,
  wave = true,
  waveDensity = 25,
  waveSpeed = 82,
  ink = "#f9f7f2",
  keyWhite = false,
  className,
}: {
  image: string;
  /** Read out to assistive tech; the canvas itself is decorative. */
  alt: string;
  fit?: "cover" | "contain";
  focusY?: number;
  dotSize?: number;
  revealRadius?: number;
  revealSoftness?: number;
  wave?: boolean;
  waveDensity?: number;
  waveSpeed?: number;
  ink?: string;
  /** Knock a flat white backdrop out of the artwork so the page shows through. */
  keyWhite?: boolean;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let stop: (() => void) | undefined;

    // Don't take a WebGL context until the section is nearly on screen.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !stop) stop = start(host);
      },
      { rootMargin: "300px" }
    );
    io.observe(host);

    return () => {
      io.disconnect();
      stop?.();
    };

    function start(host: HTMLDivElement) {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const canvas = document.createElement("canvas");
      canvas.style.cssText = "display:block;width:100%;height:100%";
      host.appendChild(canvas);

      const gl = canvas.getContext("webgl", {
        alpha: true,
        premultipliedAlpha: false,
        antialias: false,
      });
      if (!gl) {
        // No context to spare, or no WebGL — show the plain photo instead of a
        // hole where the image should be.
        const img = document.createElement("img");
        img.src = image;
        img.alt = "";
        img.style.cssText = `display:block;width:100%;height:100%;object-fit:${fit}`;
        host.appendChild(img);
        return () => img.remove();
      }

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

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      const u = (n: string) => gl.getUniformLocation(program, n);
      const uResolution = u("uResolution");
      const uReveal = u("uReveal");
      const uTime = u("uTime");
      const uDotSize = u("uDotSize");
      const uRadius = u("uRadius");

      gl.uniform1i(u("uImage"), 0);
      gl.uniform1f(u("uFit"), fit === "contain" ? 1 : 0);
      gl.uniform1f(u("uFocusY"), focusY / 100);
      gl.uniform1f(u("uSoftness"), revealSoftness / 100);
      gl.uniform1f(u("uWave"), wave ? 1 : 0);
      gl.uniform1f(u("uWaveDensity"), waveDensity);
      gl.uniform3fv(u("uInk"), hexToRgb(ink));
      gl.uniform1f(u("uKeyWhite"), keyWhite ? 1 : 0);

      // 1x1 placeholder so the first frames draw something rather than sampling
      // an incomplete texture.
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.uniform2f(u("uImageSize"), 1, 1);

      const img = new Image();
      img.decoding = "async";
      img.src = image;

      // The reveal follows the pointer while it is over the frame, and drifts on
      // a slow figure-of-eight otherwise — touch devices have no hover, and a
      // frozen flashlight in the corner looks broken rather than idle.
      let pointerOn = false;
      const target = [0.5, 0.5];
      const current = [0.5, 0.5];
      const onMove = (e: PointerEvent) => {
        const r = host.getBoundingClientRect();
        pointerOn = true;
        target[0] = (e.clientX - r.left) / r.width;
        target[1] = (e.clientY - r.top) / r.height;
      };
      const onLeave = () => {
        pointerOn = false;
      };
      host.addEventListener("pointermove", onMove);
      host.addEventListener("pointerdown", onMove);
      host.addEventListener("pointerleave", onLeave);
      host.addEventListener("pointercancel", onLeave);

      // Hoisted, so TS can't carry the null-check narrowing on `gl` in here.
      const g = gl;
      function draw(tMs: number) {
        const t = (tMs * 0.001 * waveSpeed) / 100;
        if (!pointerOn && !reduced) {
          target[0] = 0.5 + Math.sin(t * 0.55) * 0.26;
          target[1] = 0.5 + Math.sin(t * 0.83) * 0.2;
        }
        current[0] += (target[0] - current[0]) * 0.08;
        current[1] += (target[1] - current[1]) * 0.08;
        g.uniform2f(uReveal, current[0] * canvas.width, (1 - current[1]) * canvas.height);
        g.uniform1f(uTime, reduced ? 0 : t);
        g.drawArrays(g.TRIANGLES, 0, 3);
      }

      // Dot size, reveal radius and the idle orbit are all authored against a
      // desktop frame. On a phone the frame can be a third of that width, and
      // fixed CSS-pixel values there give coarse dots and a reveal that swallows
      // the whole image — so both scale with the frame's short side.
      let dpr = 1;
      let scale = 1;
      const resize = () => {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.max(1, Math.round(host.clientWidth * dpr));
        const h = Math.max(1, Math.round(host.clientHeight * dpr));
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
          gl.viewport(0, 0, w, h);
          gl.uniform2f(uResolution, w, h);
        }
        scale = Math.max(0.55, Math.min(host.clientWidth, host.clientHeight) / 460);
        gl.uniform1f(uDotSize, Math.max(2, dotSize * scale) * dpr);
        gl.uniform1f(uRadius, revealRadius * scale * dpr);
        if (reduced) draw(0);
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(host);

      let raf = 0;
      let running = false;
      const loop = (t: number) => {
        raf = requestAnimationFrame(loop);
        draw(t);
      };
      const run = (on: boolean) => {
        if (on === running) return;
        running = on;
        if (on) raf = requestAnimationFrame(loop);
        else cancelAnimationFrame(raf);
      };

      // Only burn frames while the frame is actually on screen.
      const vis = new IntersectionObserver(
        ([e]) => run(e.isIntersecting && !reduced),
        { threshold: 0 }
      );
      vis.observe(host);

      const upload = () => {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.uniform2f(u("uImageSize"), img.naturalWidth, img.naturalHeight);
        // Reduced motion never starts the loop, so paint the one static frame.
        if (!running) draw(0);
      };
      img.onload = upload;
      if (img.complete && img.naturalWidth) upload();

      return () => {
        run(false);
        vis.disconnect();
        ro.disconnect();
        host.removeEventListener("pointermove", onMove);
        host.removeEventListener("pointerdown", onMove);
        host.removeEventListener("pointerleave", onLeave);
        host.removeEventListener("pointercancel", onLeave);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
        canvas.remove();
      };
    }
  }, [
    image,
    fit,
    focusY,
    dotSize,
    revealRadius,
    revealSoftness,
    wave,
    waveDensity,
    waveSpeed,
    ink,
    keyWhite,
  ]);

  return (
    <div ref={hostRef} className={className} role="img" aria-label={alt} />
  );
}
