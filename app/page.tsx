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

  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    document.body.style.overflow = loading ? "hidden" : "";
    if (!loading) ScrollTrigger.refresh();
    return () => {
      document.body.style.overflow = "";
    };
  }, [loading]);

  return (
    <div className="flex flex-1 flex-col">
      {loading && (
        <Preloader
          onHandoff={() => {
            setHeroActive(true);
            window.dispatchEvent(new Event("adversado:reveal"));
          }}
          onDone={() => setLoading(false)}
        />
      )}
      <div>
        <Hero active={heroActive} />
      </div>
      <HomeSections />
    </div>
  );
}
