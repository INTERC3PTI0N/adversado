"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Which ground the fixed chrome is currently sitting over.
 *
 * The site is no longer dark end to end — About cuts to full-bleed gold and
 * bone spreads — and fixed cream/gold chrome disappears against both. Any
 * section can declare its ground with `data-nav-light` (light ground: bone,
 * gold, cream) or `data-nav-navy` (navy ground), and the wordmark and menu
 * button both read from here so they stay legible without either component
 * re-implementing the scroll maths.
 *
 * The band is the chrome's own strip, not the whole viewport: a section counts
 * only while it is actually passing under the header.
 */
export type NavGround = "dark" | "light" | "navy";

export function useNavGround(): NavGround {
  const [ground, setGround] = useState<NavGround>("dark");
  const pathname = usePathname();

  useEffect(() => {
    const triggers: ScrollTrigger[] = [];
    const lightTriggers: ScrollTrigger[] = [];
    const navyTriggers: ScrollTrigger[] = [];

    const sync = () => {
      if (navyTriggers.some((t) => t.isActive)) setGround("navy");
      else if (lightTriggers.some((t) => t.isActive)) setGround("light");
      else setGround("dark");
    };

    const band = { start: "top 40px", end: "bottom 72px" } as const;

    /* Deferred a frame on purpose. SiteChrome renders *before* `{children}` in
       the root layout, so at effect time the page's own sections are not in
       the DOM yet and a synchronous querySelectorAll finds nothing — the
       chrome then stays gold over every light spread. */
    const raf = requestAnimationFrame(() => {
      document.querySelectorAll("[data-nav-light]").forEach((el) => {
        const t = ScrollTrigger.create({ trigger: el, ...band, onToggle: sync });
        lightTriggers.push(t);
        triggers.push(t);
      });
      document.querySelectorAll("[data-nav-navy]").forEach((el) => {
        const t = ScrollTrigger.create({ trigger: el, ...band, onToggle: sync });
        navyTriggers.push(t);
        triggers.push(t);
      });
      sync();
    });

    return () => {
      cancelAnimationFrame(raf);
      triggers.forEach((t) => t.kill());
    };
  }, [pathname]);

  return ground;
}
