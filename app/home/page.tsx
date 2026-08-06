"use client";

import { useEffect, useState } from "react";
import { Preloader } from "@/components/Preloader";
import { IronhillTransition } from "@/components/IronhillTransition";
import { Hero } from "@/components/Hero";
import { HomeSections } from "@/components/HomeSections";
import SpinCursor from "@/components/vendor/SpinCursor";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [revealing, setRevealing] = useState(false);
  const [heroActive, setHeroActive] = useState(false);

  // A reload part-way down the page would otherwise restore that scroll
  // position and then play the whole intro over a hero nobody can see —
  // and the scroll lock below would pin them there until it finished.
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
  }, []);

  // The page is fully rendered behind the preloader, so without this the
  // wheel scrolls the homepage out of frame while the intro is still playing.
  useEffect(() => {
    document.body.style.overflow = loading ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [loading]);

  return (
    <div className="flex flex-1 flex-col">
      {loading && (
        <Preloader
          onDone={() => {
            setLoading(false);
            setRevealing(true);
            setHeroActive(true);
          }}
        />
      )}
      {revealing && (
        <IronhillTransition color="#212121" onDone={() => setRevealing(false)} />
      )}
      <Hero active={heroActive} />
      <HomeSections />

      {/* Cursor. Fixed over the whole viewport and above everything, because
          it replaces the pointer rather than decorating a panel — it hides
          the native cursor for exactly the area its own frame covers. */}
      <div className="pointer-events-none fixed inset-0 z-[60]">
        <SpinCursor label={false} fillColor="#e6b325" cursorSize={34} enableGlow glowColor="#e6b325" glowIntensity={45} />
      </div>
    </div>
  );
}
