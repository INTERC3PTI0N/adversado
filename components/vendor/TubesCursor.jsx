"use client";

import { useEffect, useRef } from "react";

// The pipe colour — brand gold, as asked.
const GOLD = "#e6b325";

// Turbopack rewrites every `import(...)` into its own chunk loader, which breaks
// remote URLs (`__turbopack_context__.x is not a function`). Bypass the bundler
// so the browser fetches the CDN module natively.
const importRemote = (url) => new Function("u", "return import(u)")(url);

export default function TubesCursor({ className = "", hidden = false }) {
  const canvasRef = useRef(null);
  const appRef = useRef(null);

  useEffect(() => {
    const initTimer = setTimeout(() => {
      importRemote("https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js")
        .then((module) => {
          const TubesCursor = module.default;
          if (!canvasRef.current) return;
          const app = TubesCursor(canvasRef.current, {
            tubes: {
              colors: [GOLD],
              lights: {
                intensity: 130,
                colors: [GOLD, "#ffd97a"],
              },
            },
          });
          // The wrapper uses `mix-blend-screen`, so the renderer's opaque
          // black pass drops to transparent and only the tubes' glow lands on
          // the page — bloom keeps its punch without blanking the starfield.
          app.three?.renderer?.setClearColor(0x000000, 1);
          appRef.current = app;
        })
        .catch((err) => console.error("Failed to load TubesCursor module:", err));
    }, 100);

    return () => {
      clearTimeout(initTimer);
      if (appRef.current && typeof appRef.current.dispose === "function") {
        appRef.current.dispose();
      }
    };
  }, []);

  return (
    <div
      aria-hidden
      className={"pointer-events-none fixed inset-0 mix-blend-screen " + className}
      style={{ visibility: hidden ? "hidden" : "visible" }}
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}