"use client";

// The preloader's "THIS HEADLINE WILL VANISH..." scene, replacing the old
// Schwarzschild black hole (EventHorizon.tsx, kept in the tree but no longer
// mounted here).
//
// Client reference: a polished glass marble — smooth and glossy, with broad
// liquid swirl bands suspended inside it, one hard specular hotspot and a
// bright refractive rim. Explicitly NOT a cloud: an earlier pass displaced the
// geometry with fbm and shaded it with the same noise, which produced exactly
// the puffy, mottled ball the reference is the opposite of. So the sphere here
// is left perfectly smooth and every bit of character comes from the shading —
// broad domain-warped bands with hard smoothstep edges, which is what reads as
// ink suspended in glass rather than vapour.
//
// Brand palette throughout: gold and cream swirls in a navy-tinted glass, over
// a near-black navy ground. The constellations behind it are the page's own
// star sheets (Cinematic.tsx), not a second field invented here.

import { useEffect, useRef, type CSSProperties } from "react";
import {
  Color,
  Group,
  IcosahedronGeometry,
  LineBasicMaterial,
  Mesh,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { createStarSheets } from "@/components/Cinematic";

// Two hues only, as asked: brand yellow and brand blue. Each gets a lifted
// tint for the highlight end of its range, so the marble can have bright and
// dark passages without ever reaching for a neutral — the previous version
// used cream for the specular, the fine ribbons and the rim, and that white
// is what stopped it reading as strictly blue-and-yellow.
const GOLD = new Color("#e6b325");
const GOLD_LIGHT = new Color("#ffd964");
const NAVY = new Color("#1f355e");
const BLUE_LIGHT = new Color("#4a83d6");
const GROUND = new Color("#02030a");

/** Ashima's 3D simplex noise. Used only to *warp* the band coordinate here —
 *  never summed into an fbm and used as colour directly, which is what made
 *  the previous version look like weather. */
const SNOISE_GLSL = `
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
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

// Geometry is untouched — a sphere stays a sphere. The object-space position
// goes through so the swirl is anchored to the marble and turns with it,
// rather than swimming across the surface as the orb rotates.
const ORB_VERT = `
varying vec3 v_obj;
varying vec3 v_normal;
varying vec3 v_view;
void main(){
  v_obj = position;
  v_normal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  v_view = mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

const ORB_FRAG = `
precision highp float;
${SNOISE_GLSL}
uniform float u_time;
uniform vec3 u_gold;
uniform vec3 u_goldLight;
uniform vec3 u_navy;
uniform vec3 u_blue;
varying vec3 v_obj;
varying vec3 v_normal;
varying vec3 v_view;

void main(){
  vec3 n = normalize(v_normal);
  vec3 viewDir = normalize(-v_view);

  // ── The swirl ────────────────────────────────────────────────────────
  // Two-stage domain warp, then bands. The bands are the whole look: a
  // smooth coordinate pushed through sin() and then hard-edged with
  // smoothstep gives broad ribbons with clean boundaries — ink in glass.
  // Warping with noise (rather than adding noise to the colour) is what
  // makes those ribbons curl instead of turning into static.
  vec3 p = v_obj * 1.15;
  float w1 = snoise(p + vec3(0.0, 0.0, u_time * 0.5));
  float w2 = snoise(p * 1.6 + vec3(w1 * 1.4) + vec3(u_time * 0.34));
  float band = sin((v_obj.y * 2.3 + w1 * 2.1 + w2 * 1.5) * 2.4);
  band = smoothstep(-0.35, 0.35, band);

  // A second, finer ribbon set riding the first, so the marble has some
  // internal depth rather than one flat two-tone split.
  float fine = sin((v_obj.x * 1.7 - v_obj.z * 1.3 + w2 * 2.6) * 3.6);
  fine = smoothstep(-0.2, 0.2, fine);

  // Blue in the troughs, yellow on the crests, and each ribbon set brightens
  // toward its own hue's light tint — never toward white.
  vec3 col = mix(u_navy * 0.6, u_gold, band);
  col = mix(col, u_blue, (1.0 - band) * fine * 0.6);
  col = mix(col, u_goldLight, band * fine * 0.4);
  // Deep navy pooling toward the bottom of the marble, so it isn't lit flat.
  col = mix(col, u_navy * 0.28, smoothstep(0.1, -0.9, v_obj.y) * 0.6);

  // ── Glass ────────────────────────────────────────────────────────────
  // Hard specular hotspot — the single brightest thing in frame, and the
  // main cue that the surface is polished rather than vapour.
  vec3 lightDir = normalize(vec3(-0.45, 0.72, 0.85));
  vec3 halfDir = normalize(lightDir + viewDir);
  float spec = pow(max(dot(n, halfDir), 0.0), 110.0);
  // Broad sheen under it, so the highlight sits on a lit face.
  float sheen = pow(max(dot(n, halfDir), 0.0), 12.0);

  // Refractive rim: bright all the way round, tightest right at the edge.
  float fres = pow(1.0 - max(dot(n, viewDir), 0.0), 3.0);

  // Yellow hotspot, blue sheen, yellow rim — all three used to be cream.
  col += u_goldLight * spec * 1.1;
  col += u_blue * sheen * 0.14;
  col += u_gold * fres * 0.7;

  gl_FragColor = vec4(min(col, vec3(1.05)), 1.0);
}
`;

export function BrandOrb({
  rotationSpeed = 1,
  className,
  style,
}: {
  rotationSpeed?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setClearColor(GROUND, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

    const scene = new Scene();
    const camera = new PerspectiveCamera(50, 1, 0.1, 200);
    camera.position.set(0, 0, 6.4);

    const orbGroup = new Group();
    scene.add(orbGroup);

    const orbMat = new ShaderMaterial({
      vertexShader: ORB_VERT,
      fragmentShader: ORB_FRAG,
      uniforms: {
        u_time: { value: 0 },
        u_gold: { value: GOLD },
        u_goldLight: { value: GOLD_LIGHT },
        u_navy: { value: NAVY },
        u_blue: { value: BLUE_LIGHT },
      },
    });
    // Detail 32 is plenty for a sphere that is never displaced — the old
    // version needed 48 only because the geometry itself was being pushed
    // around and low-poly facets showed in the silhouette.
    const orb = new Mesh(new IcosahedronGeometry(1.0, 32), orbMat);
    orbGroup.add(orb);

    // The page's own constellations, not a second set. Pushed back behind the
    // marble and given a slow roll of their own so they read as their own
    // depth rather than being glued to the orb.
    const { group: stars, sheets } = createStarSheets();
    stars.position.z = -6;
    scene.add(stars);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    // Threshold high enough that only the specular hotspot and the rim bloom
    // — a low threshold blows the whole marble out into a lamp. Kept
    // deliberately weak: this sits directly behind the headline, and every
    // bit of glow here is contrast the type has to fight.
    const bloom = new UnrealBloomPass(new Vector2(1, 1), 0.24, 0.45, 0.88);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

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
      composer.setSize(w, h);
      bloom.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    const startedAt = performance.now();
    function tick(now: number) {
      if (!running) return;
      if (needsResize) resize();
      const t = prefersReduced ? 0 : (now - startedAt) * 0.001;
      orbMat.uniforms.u_time.value = t;

      curX += (aimX - curX) * 0.05;
      curY += (aimY - curY) * 0.05;
      orbGroup.rotation.y = t * 0.42 * rotationSpeed + curX * 0.35;
      orbGroup.rotation.x = curY * 0.22;
      stars.rotation.y = t * 0.035;
      stars.position.x = -curX * 0.6;
      stars.position.y = -curY * 0.4;

      composer.render();
      raf = requestAnimationFrame(tick);
    }

    resize();
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      composer.dispose();
      renderer.dispose();
      orb.geometry.dispose();
      orbMat.dispose();
      sheets.forEach(({ points, geo }) => {
        geo.dispose();
        (points.material as PointsMaterial | LineBasicMaterial).dispose();
      });
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
