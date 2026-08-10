import { useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import "./App.css";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Vortex from "./components/Vortex";
import StarField from "./components/StarField";
import SecondSection from "./components/SecondSection";

const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const smooth = (t) => t * t * (3 - 2 * t);

function App() {
  const rootRef = useRef(null);
  const wrapRef = useRef(null);
  const [progress, setProgress] = useState(0);

  // Lenis smooth scrolling + scroll progress for the dive
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.08, wheelMultiplier: 1, smoothWheel: true });

    const update = () => {
      const el = wrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      setProgress(total > 0 ? scrolled / total : 0);
    };

    lenis.on("scroll", update);

    let rafId;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);
    update();

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  // whole scene reacts to the mouse (smoothed parallax via CSS variables)
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let raf = null;
    let tx = 0, ty = 0, cx = 0, cy = 0;
    const apply = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      root.style.setProperty("--mx", cx.toFixed(4));
      root.style.setProperty("--my", cy.toFixed(4));
      if (Math.abs(tx - cx) > 0.0008 || Math.abs(ty - cy) > 0.0008) {
        raf = requestAnimationFrame(apply);
      } else {
        raf = null;
      }
    };
    const onMove = (e) => {
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
      if (raf == null) raf = requestAnimationFrame(apply);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // --- Dive: zoom INTO the orb; the feathery galaxy cloud swirls and its
  //     central hole opens to reveal section 2 behind it. ---
  const heroOpacity = 1 - clamp((progress - 0.05) / 0.16);

  const s2Opacity = clamp((progress - 0.06) / 0.22);
  const s2Scale = 1.12 - smooth(clamp((progress - 0.06) / 0.6)) * 0.12;

  const orbScale = 1 + progress * 4.6; // zoom into the orb
  const holeScale = progress * 2.6; // feathery portal opens from the centre
  const cloudRotate = progress * 260; // galaxy cloud swirls (spiral)
  const orbOpacity = 1 - clamp((progress - 0.86) / 0.12); // clean at the end

  return (
    <div className="App" ref={rootRef}>
      <Navbar />

      {/* Tall scroll track; the scene stays sticky while we dive into the orb */}
      <div className="scroll-track" ref={wrapRef}>
        <div className="sticky-stage">
          {/* persistent starry backdrop */}
          <div className="stage-bg">
            <StarField />
          </div>

          {/* next section, full-screen, revealed THROUGH the feathery hole */}
          <div
            className="s2-layer"
            style={{ opacity: s2Opacity, transform: `scale(${s2Scale})` }}
          >
            <SecondSection />
          </div>

          {/* the orb-portal: galaxy cloud inside the orb, hole opens to section */}
          <div className="orb-parallax">
            <Vortex
              scale={orbScale}
              rotate={cloudRotate}
              holeScale={holeScale}
              opacity={orbOpacity}
            />
          </div>

          {/* hero text overlay, fades out as we dive in */}
          <div className="hero-layer" style={{ opacity: heroOpacity }}>
            <Hero />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
