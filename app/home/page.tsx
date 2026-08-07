"use client";

import { useEffect, useState } from "react";
import { Preloader } from "@/components/Preloader";
import { Hero } from "@/components/Hero";
import { HomeSections } from "@/components/HomeSections";
import { CursorTrail } from "@/components/CursorTrail";
import SpinCursor from "@/components/vendor/SpinCursor";

export default function Home() {
  const [loading, setLoading] = useState(true);
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
      {/* No wipe between this and the hero: the preloader's own lit act fades
          itself out directly onto the dark page underneath (Preloader.tsx),
          so the handoff needs nothing bolted on after it. */}
      {loading && (
        <Preloader
          // Fired as the tunnel *starts* opening out, not after. The hero and
          // the sky begin their approach here, so the reader watches them
          // close in through the opening tunnel — one continuous zoom rather
          // than a ride that ends and a reveal that then begins.
          onHandoff={() => {
            setHeroActive(true);
            // One shared cue for everything that reveals at this exact
            // instant but isn't mounted/unmounted by it — the constellations
            // are already running behind the preloader the whole time, so
            // they can't pick up the handoff from a mount the way Hero does.
            window.dispatchEvent(new Event("adversado:reveal"));
          }}
          onDone={() => setLoading(false)}
        />
      )}
      <Hero active={heroActive} />
      <HomeSections />

      {/* Cursor. Fixed over the whole viewport and above everything, because
          it replaces the pointer rather than decorating a panel — it hides
          the native cursor for exactly the area its own frame covers. The
          trail sits just under it, so the ring stays the sharp thing and the
          trail reads as its wake rather than competing with it. */}
      <div className="pointer-events-none fixed inset-0 z-[55]">
        <CursorTrail />
      </div>
      <div className="pointer-events-none fixed inset-0 z-[60]">
        <SpinCursor label={false} fillColor="#e6b325" cursorSize={34} enableGlow glowColor="#e6b325" glowIntensity={45} />
      </div>
    </div>
  );
}
