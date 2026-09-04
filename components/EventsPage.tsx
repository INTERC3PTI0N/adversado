"use client";

import { useState, useEffect, useRef } from "react";
import { useMotionValue, useSpring, animate, useScroll } from "motion/react";
import { HeroStage } from "@/components/events/HeroStage";
import { ServicesSection } from "@/components/events/ServicesSection";
import { AboutSection } from "@/components/events/AboutSection";
import { WhySection } from "@/components/events/WhySection";
import { ProcessSection } from "@/components/events/ProcessSection";
import { CTASection } from "@/components/events/CTASection";
import { EV } from "@/components/events/palette";
import { SiteFooter } from "@/components/SiteFooter";

/**
 * Events.
 *
 * Ported from the standalone prototype. Two things the prototype owned are
 * dropped here because the site already provides them: it booted its own Lenis
 * instance (the site's `SmoothScroll` is global, and a second one fights the
 * first for the wheel), and it drew its own centred wordmark header (the site
 * has `SiteChrome`). Everything else is the prototype's, with its off-brand
 * palette mapped onto the book's tokens in `events/palette`.
 *
 * The hero is a 400vh scroll region with a sticky stage: the showreel card
 * grows from a rounded 520px panel to full bleed as you scroll, while its
 * internal cut sequence runs on its own 18s loop, independent of scroll.
 */
export function EventsPage() {
  const [, setIsHovered] = useState(false);
  const playhead = useMotionValue(0);
  const smoothPlayhead = useSpring(playhead, { stiffness: 100, damping: 20 });
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    const controls = animate(playhead, 1, {
      duration: 18,
      ease: "linear",
      repeat: Infinity,
      repeatType: "loop",
    });
    return () => controls?.stop();
  }, [playhead]);

  return (
    <main
      className="font-sans selection:bg-gold selection:text-charcoal"
      style={{ background: EV.ink }}
    >
      {/* Hero: bone ground under the chrome, so the wordmark inverts. */}
      <div ref={containerRef} data-nav-light className="relative h-[400vh]">
        <div className="sticky top-0 h-screen overflow-hidden">
          <HeroStage
            scrollProgress={scrollYProgress}
            playhead={smoothPlayhead}
            onHover={() => setIsHovered(true)}
            onLeave={() => setIsHovered(false)}
          />
        </div>
      </div>

      <AboutSection />
      <WhySection />
      <ServicesSection />
      <ProcessSection />
      <CTASection />
      <SiteFooter variant="events" />
    </main>
  );
}
