// Gallery Tunnel — Originkit
// Originkit — props baked into the default export.
"use client";

import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import * as THREE from "three";

const DEFAULT_IMAGES = [
    "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/f8b3688c-11d0-425c-0b6f-66f133322c00/w=800",
    "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/c083d83a-f5a4-4434-989f-4eaa9bbe7500/w=800",
    "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/12e8b0be-f114-4134-1ab7-53116bfc2800/w=800",
    "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/b14ae2a2-1116-4a7f-0a18-1d74c4a46f00/w=800",
    "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/babdb603-8b5b-4520-58d6-240a34463c00/w=800",
];

const DEFAULTS = {
    background: "#000000",
    lineColor: "#B0B0B0",
    lineOpacity: 50,
    colors: ["#FF6A00", "#AB54F7", "#EA3737", "#0072E3", "#00AA3C", "#FFB200"],
    grid: 4,
    speed: 100,
    boost: 100,
    fade: 100,
    label: true,
    labelText: "Press to Start",
    labelFill: "#FFFFFF",
    labelColor: "#000000",
    labelFont: { fontFamily: "Inter", fontSize: 14, fontWeight: 500 } as CSSProperties,
};

const TUNNEL_RADIUS = 0.92; // cross-section radius — the box never had one; the warp wants a tube
const SEGMENT_DEPTH = 1;
const NUM_SEGMENTS = 15;
const LINE_RADIUS = 0.003;
const SCROLL_TO_Z = 0.05;
const CAMERA_CHASE = 0.1;
const FADE_IN = 1;

const FOG_FAR = NUM_SEGMENTS * SEGMENT_DEPTH * 0.95;

interface ImageBoxImage {
    src: string;
    alt?: string;
}

interface ImageBoxProps {
    images: ImageBoxImage[];
    colors: string[];
    background: string;
    lineColor: string;
    lineOpacity: number;
    grid: number;
    speed: number;
    boost: number;
    fade: number;
    label: boolean;
    labelText: string;
    labelFill: string;
    labelColor: string;
    labelFont: CSSProperties;
    style?: CSSProperties;
}

const srcOf = (image: any): string =>
    typeof image === "string" ? image : (image?.src ?? "");

function __OriginkitBase_ImageBox(props: Partial<ImageBoxProps>) {
    const {
        images,
        colors,
        background = DEFAULTS.background,
        lineColor = DEFAULTS.lineColor,
        lineOpacity = DEFAULTS.lineOpacity,
        grid = DEFAULTS.grid,
        speed = DEFAULTS.speed,
        boost = DEFAULTS.boost,
        fade = DEFAULTS.fade,
        label = DEFAULTS.label,
        labelText = DEFAULTS.labelText,
        labelFill = DEFAULTS.labelFill,
        labelColor = DEFAULTS.labelColor,
        labelFont = DEFAULTS.labelFont,
        style,
    } = props;

    const frameRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const cursorRef = useRef<HTMLDivElement | null>(null);

    const urls = useMemo(() => {
        const list = (images ?? []).map(srcOf).filter(Boolean);
        return list.length ? list : DEFAULT_IMAGES;
    }, [images]);

    const palette = useMemo(() => {
        const list = (colors ?? []).filter(Boolean);
        return list.length ? list : DEFAULTS.colors;
    }, [colors]);

    const cfgRef = useRef<{ speed: number; boost: number }>({ speed: 1, boost: 1 });
    cfgRef.current = {
        speed: Math.max(0, speed) / 100,
        boost: Math.max(0, boost) / 10,
    };

    useEffect(() => {
        const frame = frameRef.current;
        const canvas = canvasRef.current;
        if (!frame || !canvas) return;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(background);

        const fogNear = Math.min(
            FOG_FAR * (1 - Math.min(100, Math.max(0, fade)) / 100),
            FOG_FAR - 0.01
        );
        scene.fog = new THREE.Fog(new THREE.Color(background), fogNear, FOG_FAR);

        const camera = new THREE.PerspectiveCamera(45, 1, 1, 1000);
        camera.position.set(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

        const lineMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(lineColor),
            transparent: true,
            opacity: Math.min(100, Math.max(0, lineOpacity)) / 100,
        });

        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin("anonymous");
        const fading: THREE.MeshBasicMaterial[] = [];

        let imageIndex = 0;
        let colorIndex = 0;
        let populateIndex = 0;
        let scrollPos = 0;
        let raf = 0;
        let last = 0;
        let pressed = false;
        let alive = true;

        // Circular cross-section: a ring of panels forming the wall of a tube.
        // More cells than the old box wanted — a circle drawn with a handful of
        // flat panels reads as a jagged octagon, so the grid count is bumped
        // and the whole look is a warp winding toward the vanishing point.
        const CELLS = Math.max(10, Math.round(grid) * 3);
        const RADIUS = TUNNEL_RADIUS;
        const dTh = (Math.PI * 2) / CELLS;
        const panelWidth = 2 * RADIUS * Math.sin(dTh / 2);

        // One flat panel per arc, sized to span the chord between neighbours
        // and wound so its narrow edge wraps back exactly once around the tube.
        const geoPanel = new THREE.PlaneGeometry(panelWidth, SEGMENT_DEPTH);

        // Depth rays: straight tubes running the whole length of a segment —
        // the columns that converge on the vanishing point and sell the warp.
        const geoRay = new THREE.TubeGeometry(
            new THREE.LineCurve3(
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, -SEGMENT_DEPTH)
            ),
            1,
            LINE_RADIUS,
            8
        );

        // The ring at each depth: a smooth circle closing the tube's throat,
        // which is what reads as "round" where the old box read as "corners".
        const ringSegs = 64;
        const ringPts: THREE.Vector3[] = [];
        for (let i = 0; i < ringSegs; i++) {
            const a = (i / ringSegs) * Math.PI * 2;
            ringPts.push(new THREE.Vector3(Math.cos(a) * RADIUS, Math.sin(a) * RADIUS, 0));
        }
        const ringCurve = new THREE.CatmullRomCurve3(ringPts, true, "catmullrom", 0.5);
        const geoRing = new THREE.TubeGeometry(ringCurve, ringSegs, LINE_RADIUS, 8);

        const colorMats = palette.map(
            (hex) =>
                new THREE.MeshBasicMaterial({
                    color: new THREE.Color(hex),
                    side: THREE.DoubleSide,
                })
        );

        const imageMats = urls.map((url) => {
            const mat = new THREE.MeshBasicMaterial({
                transparent: true,
                opacity: 0,
                side: THREE.DoubleSide,
            });
            loader.load(
                url,
                (tex) => {
                    if (!alive) {
                        tex.dispose();
                        return;
                    }
                    tex.minFilter = THREE.LinearFilter;
                    tex.generateMipmaps = false;
                    tex.colorSpace = THREE.SRGBColorSpace;
                    mat.map = tex;
                    mat.needsUpdate = true;
                    fading.push(mat);
                },
                undefined,
                () => {
                    // A dead URL should cost a blank slab, not a broken tunnel.
                }
            );
            return mat;
        });

        const tube = (
            geo: THREE.BufferGeometry,
            x: number,
            y: number,
            z = 0,
            rot: THREE.Euler = new THREE.Euler(0, 0, 0)
        ) => {
            const m = new THREE.Mesh(geo, lineMaterial);
            m.position.set(x, y, z);
            m.rotation.copy(rot);
            return m;
        };

        const SLOTS: Array<{
            geo: THREE.BufferGeometry;
            pos: THREE.Vector3;
            quat: THREE.Quaternion;
        }> = [];
        {
            const z = SEGMENT_DEPTH / 2;
            // Each panel sits on the cylinder wall at the midpoint of its arc,
            // wound round the tube axis so its normal points radially outward
            // and its width lies along the tangent — a flat quad hugging a
            // circle from the inside.
            const zAxis = new THREE.Vector3(0, 0, 1);
            for (let i = 0; i < CELLS; i++) {
                const mid = i * dTh + dTh / 2;
                const cx = Math.cos(mid) * RADIUS;
                const cy = Math.sin(mid) * RADIUS;
                const tangent = new THREE.Vector3(-Math.sin(mid), Math.cos(mid), 0);
                const normal = new THREE.Vector3(Math.cos(mid), Math.sin(mid), 0);
                const quat = new THREE.Quaternion().setFromRotationMatrix(
                    new THREE.Matrix4().makeBasis(tangent, zAxis, normal)
                );
                SLOTS.push({
                    geo: geoPanel,
                    pos: new THREE.Vector3(cx, cy, -z),
                    quat,
                });
            }
        }

        function populate(group: THREE.Group) {
            const takesSlabs = populateIndex % 2 === 0;
            populateIndex++;
            const slabs = group.userData.slabs as THREE.Mesh[];

            for (const slab of slabs) {
                if (!takesSlabs || Math.random() > 0.5) {
                    slab.visible = false;
                    continue;
                }
                slab.visible = true;
                if (Math.random() > 0.5) {
                    slab.material =
                        colorMats[(5 * colorIndex) % colorMats.length];
                    colorIndex++;
                } else {
                    slab.material =
                        imageMats[(3 * imageIndex) % imageMats.length];
                    imageIndex++;
                }
            }
        }

        function createSegment(z: number) {
            const group = new THREE.Group();
            group.position.z = z;

            // Depth columns: a straight ray out from the camera at every angle,
            // converging on the vanishing point — the thing that makes the pass
            // read as motion into a tube rather than forward along a box.
            for (let i = 0; i < CELLS; i++) {
                const th = i * dTh;
                group.add(
                    tube(geoRay, Math.cos(th) * RADIUS, Math.sin(th) * RADIUS, 0)
                );
            }
            // One smooth ring at the segment's near face, closing the throat of
            // the tube — this is what reads as "round" where the box read as
            // "corners". It is traced in the X/Y plane, so it already sits
            // perpendicular to the depth axis with no extra rotation.
            group.add(tube(geoRing, 0, 0, 0));

            const slabs: THREE.Mesh[] = SLOTS.map((slot) => {
                const m = new THREE.Mesh(slot.geo, colorMats[0]);
                m.position.copy(slot.pos);
                m.quaternion.copy(slot.quat);
                m.visible = false;
                group.add(m);
                return m;
            });
            group.userData.slabs = slabs;

            populate(group);
            return group;
        }

        const segments: THREE.Group[] = [];
        for (let i = 0; i < NUM_SEGMENTS; i++) {
            const g = createSegment(-i * SEGMENT_DEPTH);
            scene.add(g);
            segments.push(g);
        }

        const resize = () => {
            const w = Math.max(1, frame.clientWidth);
            const h = Math.max(1, frame.clientHeight);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h, false);
        };
        const ro = new ResizeObserver(resize);
        ro.observe(frame);
        resize();

        const animate = (now: number) => {
            if (!alive) return;
            raf = requestAnimationFrame(animate);
            const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
            last = now;

            const cfg = cfgRef.current;
            scrollPos += pressed ? cfg.boost : cfg.speed;

            const want = -SCROLL_TO_Z * scrollPos;
            camera.position.z += CAMERA_CHASE * (want - camera.position.z);

            const span = NUM_SEGMENTS * SEGMENT_DEPTH;
            const z = camera.position.z;
            for (const seg of segments) {
                if (seg.position.z > z + SEGMENT_DEPTH) {
                    let min = 0;
                    for (const s of segments) min = Math.min(min, s.position.z);
                    seg.position.z = min - SEGMENT_DEPTH;
                    populate(seg);
                } else if (seg.position.z < z - span - SEGMENT_DEPTH) {
                    let max = -999999;
                    for (const s of segments) max = Math.max(max, s.position.z);
                    seg.position.z = max + SEGMENT_DEPTH;
                    populate(seg);
                }
            }

            for (let i = fading.length - 1; i >= 0; i--) {
                const m = fading[i];
                m.opacity = Math.min(1, m.opacity + dt / FADE_IN);
                if (m.opacity >= 1) fading.splice(i, 1);
            }

            renderer.render(scene, camera);
        };
        raf = requestAnimationFrame(animate);

        const onMove = (e: PointerEvent) => {
            const el = cursorRef.current;
            if (!el) return;
            const rect = frame.getBoundingClientRect();
            const sx = rect.width > 0 ? frame.clientWidth / rect.width : 1;
            const sy = rect.height > 0 ? frame.clientHeight / rect.height : 1;
            el.style.left = `${(e.clientX - rect.left) * sx}px`;
            el.style.top = `${(e.clientY - rect.top) * sy}px`;
        };
        const onEnter = () => {
            const el = cursorRef.current;
            if (el) el.style.opacity = "1";
        };
        const onLeave = () => {
            pressed = false;
            const el = cursorRef.current;
            if (el) {
                el.style.opacity = "0";
                el.style.transform = "translate(0%, -100%) scale(1)";
            }
        };
        const onDown = () => {
            pressed = true;
            const el = cursorRef.current;
            if (el) el.style.transform = "translate(0%, -100%) scale(0.85)";
        };
        const onUp = () => {
            pressed = false;
            const el = cursorRef.current;
            if (el) el.style.transform = "translate(0%, -100%) scale(1)";
        };

        frame.addEventListener("pointermove", onMove);
        frame.addEventListener("pointerenter", onEnter);
        frame.addEventListener("pointerleave", onLeave);
        frame.addEventListener("pointerdown", onDown);
        window.addEventListener("pointerup", onUp);

        return () => {
            alive = false;
            cancelAnimationFrame(raf);
            ro.disconnect();
            frame.removeEventListener("pointermove", onMove);
            frame.removeEventListener("pointerenter", onEnter);
            frame.removeEventListener("pointerleave", onLeave);
            frame.removeEventListener("pointerdown", onDown);
            window.removeEventListener("pointerup", onUp);

            geoPanel.dispose();
            geoRay.dispose();
            geoRing.dispose();
            for (const m of colorMats) m.dispose();
            for (const m of imageMats) {
                m.map?.dispose();
                m.dispose();
            }
            lineMaterial.dispose();
            renderer.dispose();
        };
    }, [urls, palette, background, lineColor, lineOpacity, grid, fade]);

    return (
        <div
            ref={frameRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                cursor: label ? "none" : "default",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{ display: "block", width: "100%", height: "100%" }}
            />
            {label && (
                <div
                    ref={cursorRef}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        transform: "translate(0%, -100%) scale(1)",
                        pointerEvents: "none",
                        opacity: 0,
                        background: labelFill,
                        borderRadius: 9999,
                        padding: "10px 20px",
                        transition: "transform 0.1s ease, opacity 0.2s ease",
                        whiteSpace: "nowrap",
                        userSelect: "none",
                        ...labelFont,
                        color: labelColor,
                    }}
                >
                    {labelText}
                </div>
            )}
        </div>
    );
}

const __originkitPresetProps = {
  "label": "Encrypt data"
};

export default function ImageBox(props: Record<string, unknown>) {
  return <__OriginkitBase_ImageBox {...(__originkitPresetProps as Record<string, unknown>)} {...props} />;
}
