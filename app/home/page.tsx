"use client";

import { useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Preloader } from "@/components/Preloader";
import { Hero } from "@/components/Hero";
import { HomeSections } from "@/components/HomeSections";

gsap.registerPlugin(ScrollTrigger);

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
    // Every ScrollTrigger on the page is built while this lock is on, so they
    // all measure a document with no scroll range — the hero's pin in
    // particular comes out with a start and an end of zero and simply never
    // fires. Nothing tells them the lock has lifted, so this has to.
    if (!loading) ScrollTrigger.refresh();
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
      {/* Plain block wrapper, and it has to stay one. ScrollTrigger pins the
          hero by swapping in a pin-spacer that reserves the scrolled distance
          as padding — and as a direct child of the flex column above, that
          padding was absorbed instead of adding height, so the spacer came out
          one viewport short and every trigger below it (the Belief's half of
          the zoom) measured against the wrong document position. */}
      <div>
        <Hero active={heroActive} />
      </div>
      <HomeSections />

      {/* Cursor. Both live inside HomeSections, which owns the swap: the
          site-wide tubes cursor (threejs, brand navy + gold) renders under the
          copy everywhere, and the React Bits TargetCursor takes over only
          while the Invitation occupies the viewport, locking its brackets
          around `.cursor-target` (the move set and CTA). HomeSections pairs
          them through one `invitationActive` bit so only one is visible at a
          time. There's no cursor markup here — the page's old SpinCursor +
          CursorTrail stack was removed when the tubes cursor took its place,
          since a second/third fixed cursor would stack on top of it. */}
    </div>
  );
}
