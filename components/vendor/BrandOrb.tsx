"use client";

// Engaged-style landing bubble for the /home preloader unveil:
// matcap × perlin dual-mix swirl, soft bokeh spheres, portal reveal
// (uReveal) that opens into the hero underneath. Brand navy + gold matcap.

import { useEffect, useRef, type CSSProperties } from "react";
import {
  AdditiveBlending,
  Color,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
  WebGLRenderer,
  RepeatWrapping,
} from "three";

const SNOISE = `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m; return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float fbm(vec3 x, int octaves){
  float v=0.0; float a=0.5; vec3 shift=vec3(100.0);
  for(int i=0;i<4;i++){ if(i>=octaves) break; v+=a*snoise(x); x=x*2.0+shift; a*=0.5; }
  return v;
}
vec3 contrast(vec3 col, float k){ return (col-0.5)*k+0.5; }
vec2 rotateUV(vec2 uv, float ang){
  float s=sin(ang), c=cos(ang);
  uv-=0.5; return vec2(c*uv.x-s*uv.y, s*uv.x+c*uv.y)+0.5;
}
`;

const VERT = `
varying vec3 vViewPosition;
varying vec3 vNormal;
varying vec2 vUv;
void main(){
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mv.xyz;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * mv;
}
`;

// Engaged landing-bubble look: dual matcap mixed by scrolling perlin, then
// a spiral portal that eats alpha as uReveal climbs (hero shows through).
const FRAG = `
precision highp float;
${SNOISE}
uniform float uTime;
uniform float uNoiseSpeed;
uniform float uNoiseScale;
uniform float uBrightness;
uniform float uReveal;
uniform float uRevealOpacity;
uniform float uOpacity;
uniform vec2 uResolution;
uniform sampler2D tMatcap;
uniform sampler2D tPerlin;
varying vec3 vViewPosition;
varying vec3 vNormal;
varying vec2 vUv;

void main(){
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);

  // Engaged matcap basis (view-aligned).
  vec3 x = normalize(vec3(viewDir.z, 0.0, -viewDir.x));
  vec3 y = cross(viewDir, x);
  vec2 matcapUv1 = vec2(dot(x, normal), dot(y, normal)) * 0.495 + 0.5;
  vec2 matcapUv2 = matcapUv1;
  matcapUv1.y = sin(uTime) * uNoiseSpeed * 0.025 - matcapUv1.y;
  matcapUv1.x = cos(uTime) * uNoiseSpeed * 0.025 - matcapUv1.x;
  matcapUv2.x = 1.0 - matcapUv2.x;

  // Avoid reserved GLSL type names for these samples.
  vec3 capA = texture2D(tMatcap, clamp(matcapUv1, 0.001, 0.999)).rgb;
  vec3 capB = texture2D(tMatcap, clamp(matcapUv2, 0.001, 0.999)).rgb;

  vec2 noiseUv = vUv * uNoiseScale;
  noiseUv.x += uTime * uNoiseSpeed * 0.05;
  noiseUv.y += uTime * uNoiseSpeed * 0.05;
  vec3 perlin = contrast(texture2D(tPerlin, noiseUv).rgb, 3.0);
  vec3 col = mix(capA, capB, perlin.r) * uBrightness;

  // Soft glass rim lift.
  float fres = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.4);
  col += vec3(0.95, 0.88, 0.55) * fres * 0.18;

  float alpha = uOpacity;

  // Portal unveil — Engaged spiral fbm hole. Hero underneath shows through.
  if (uReveal > 0.01 && uReveal < 0.995 && uOpacity > 0.01) {
    vec2 screenUv = gl_FragCoord.xy / uResolution.xy;
    vec2 aUv = screenUv;
    aUv.x = (aUv.x - 0.5) * uResolution.x / uResolution.y + 0.5;
    aUv = rotateUV(aUv, uTime * 0.1);
    aUv -= 0.5;
    float baseRadius = length(aUv);
    float radius = baseRadius / (1.5 * uReveal + 0.001);
    float angle = atan(aUv.y, aUv.x);
    angle -= (baseRadius + 10.0) * 1.5;
    float yN = fbm(vec3(cos(1.0 + angle), sin(1.0 + angle), radius + uTime * 0.075 + uReveal), 4);
    float c = (yN + radius * 5.0) / (4.0 + (uReveal * 7.5));
    float finalMask = smoothstep(0.125, 0.55, c);
    float finalMask3 = smoothstep(0.3, 1.0, c);
    float finalMask4 = smoothstep(0.5, 1.0, c);
    col += (finalMask - finalMask3) * 0.25 * uRevealOpacity * vec3(0.9, 0.75, 0.35);
    col += (finalMask - finalMask4) * 0.1 * uRevealOpacity * vec3(1.0, 0.92, 0.7);
    alpha = (1.0 - (1.0 - finalMask) * uRevealOpacity) * uOpacity;
  } else if (uReveal >= 0.995) {
    alpha = 0.0;
  }

  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
}
`;

export function BrandOrb({
  rotationSpeed = 1,
  diveRef,
  className,
  style,
}: {
  rotationSpeed?: number;
  /** 0 = closed orb, 1 = portal fully open (Engaged uReveal). */
  diveRef?: { current: number };
  className?: string;
  style?: CSSProperties;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

    const scene = new Scene();
    const camera = new PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 3.15);

    const root = new Group();
    scene.add(root);

    const loader = new TextureLoader();
    const matcap = loader.load("/textures/matcap-brand.jpg");
    matcap.colorSpace = SRGBColorSpace;
    const perlin = loader.load("/textures/perlin.png");
    perlin.wrapS = perlin.wrapT = RepeatWrapping;

    const uniforms = {
      uTime: { value: 0 },
      uNoiseSpeed: { value: 2.1 },
      uNoiseScale: { value: 0.35 },
      uBrightness: { value: 0.95 },
      uReveal: { value: 0 },
      uRevealOpacity: { value: 0 },
      uOpacity: { value: 1 },
      uResolution: { value: new Vector2(1, 1) },
      tMatcap: { value: matcap },
      tPerlin: { value: perlin },
    };

    const orbMat = new ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms,
      transparent: true,
      depthWrite: false,
    });
    const orb = new Mesh(new IcosahedronGeometry(1, 48), orbMat);
    root.add(orb);

    // Soft bokeh background spheres (Engaged depth field).
    const bokehGroup = new Group();
    scene.add(bokehGroup);
    const bokehGeo = new SphereGeometry(1, 24, 24);
    const bokehSpecs = [
      { pos: [-2.4, 0.6, -4.5], s: 2.2, c: "#1a2f55", o: 0.35 },
      { pos: [2.8, -0.8, -5.2], s: 2.8, c: "#152848", o: 0.28 },
      { pos: [-1.2, -1.6, -3.8], s: 1.6, c: "#243a62", o: 0.22 },
      { pos: [1.6, 1.4, -6.0], s: 3.2, c: "#121f3a", o: 0.3 },
      { pos: [0.2, 0.1, -7.5], s: 4.0, c: "#0c1528", o: 0.25 },
    ];
    const bokehMeshes = bokehSpecs.map((b) => {
      const m = new Mesh(
        bokehGeo,
        new MeshBasicMaterial({
          color: new Color(b.c),
          transparent: true,
          opacity: b.o,
          depthWrite: false,
        })
      );
      m.position.set(b.pos[0], b.pos[1], b.pos[2]);
      m.scale.setScalar(b.s);
      bokehGroup.add(m);
      return m;
    });

    // Tiny star dust.
    const dustGeo = new SphereGeometry(0.012, 6, 6);
    const dustMat = new MeshBasicMaterial({
      color: 0xfff2c8,
      transparent: true,
      opacity: 0.55,
      blending: AdditiveBlending,
      depthWrite: false,
    });
    for (let i = 0; i < 48; i++) {
      const d = new Mesh(dustGeo, dustMat);
      d.position.set(
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 4,
        -2 - Math.random() * 5
      );
      bokehGroup.add(d);
    }

    let aimX = 0,
      aimY = 0,
      curX = 0,
      curY = 0;
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      aimX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      aimY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let running = true;
    let raf = 0;
    let needsResize = true;
    const onResize = () => {
      needsResize = true;
    };
    window.addEventListener("resize", onResize);

    function resize() {
      needsResize = false;
      const w = canvas!.clientWidth;
      const h = Math.max(1, canvas!.clientHeight);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      uniforms.uResolution.value.set(w * dpr, h * dpr);
    }

    // RepeatWrapping set above on load.

    const startedAt = performance.now();
    function tick(now: number) {
      if (!running) return;
      if (needsResize) resize();
      const t = prefersReduced ? 0 : (now - startedAt) * 0.001;
      uniforms.uTime.value = t;

      const reveal = diveRef ? diveRef.current : 0;
      uniforms.uReveal.value = reveal;
      // Engaged ramps reveal opacity with the hole — full by mid-open.
      uniforms.uRevealOpacity.value = Math.min(1, reveal * 1.35);
      uniforms.uOpacity.value = reveal > 0.98 ? Math.max(0, 1 - (reveal - 0.98) / 0.02) : 1;

      // Fade depth field so the portal hole shows the HTML hero, not bokeh.
      const fieldFade = Math.max(0, 1 - reveal * 1.45);
      bokehGroup.visible = fieldFade > 0.02;
      bokehMeshes.forEach((m, i) => {
        const mat = m.material as MeshBasicMaterial;
        mat.opacity = bokehSpecs[i].o * fieldFade;
      });
      dustMat.opacity = 0.55 * fieldFade;

      // Gentle camera ease as portal opens (less push than old dive).
      camera.position.z = 3.15 - 0.55 * (reveal * reveal);

      curX += (aimX - curX) * 0.04;
      curY += (aimY - curY) * 0.04;
      root.rotation.y = t * 0.08 * rotationSpeed + curX * 0.2;
      root.rotation.x = curY * 0.12;
      bokehGroup.rotation.y = t * 0.02 + curX * 0.05;
      bokehMeshes.forEach((m, i) => {
        m.position.y += Math.sin(t * 0.35 + i) * 0.0008;
      });

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }

    resize();
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      renderer.dispose();
      orb.geometry.dispose();
      orbMat.dispose();
      matcap.dispose();
      perlin.dispose();
      bokehGeo.dispose();
      dustGeo.dispose();
      dustMat.dispose();
      bokehMeshes.forEach((m) => (m.material as MeshBasicMaterial).dispose());
    };
  }, [rotationSpeed]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={className}
      style={{ display: "block", width: "100%", height: "100%", ...style }}
    />
  );
}

export default BrandOrb;
