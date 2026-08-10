"use client";

import { CinematicScene, PeachScene } from "@/components/Cinematic";
import { SiteFooter } from "@/components/SiteFooter";

type SitePageProps = {
  children: React.ReactNode;
  /**
   * `stars` — cinematic starfield (default).
   * `peach` — adv-orb PeachWeb 3D scene as the page ground (About).
   */
  background?: "stars" | "peach";
  /** `deep` — heavier black scrim (readable type over stars). */
  sky?: "default" | "deep";
};

/**
 * Shared shell for About / Services / Contact.
 *
 * About can swap the starfield for the adv-orb PeachWeb scene; other pages
 * keep the night flight. Nav lives in the root layout (Staggered Menu).
 */
export function SitePage({
  children,
  background = "stars",
  sky = "default",
}: SitePageProps) {
  const peach = background === "peach";

  return (
    <div className="relative flex min-h-screen flex-col">
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 bg-black" />
      {peach ? <PeachScene /> : <CinematicScene />}
      {peach ? (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[3]"
          style={{
            background: [
              "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.28) 40%, rgba(0,0,0,0.62) 100%)",
              "radial-gradient(ellipse 80% 60% at 50% 35%, rgba(0,0,0,0.12), rgba(0,0,0,0.55) 75%)",
            ].join(", "),
          }}
        />
      ) : sky === "deep" ? (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[3]"
          style={{
            background: [
              "linear-gradient(180deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.62) 42%, rgba(0,0,0,0.88) 100%)",
              "radial-gradient(ellipse 90% 70% at 50% 18%, rgba(0,0,0,0.2), rgba(0,0,0,0.82) 72%)",
            ].join(", "),
          }}
        />
      ) : null}
      <div className="relative z-10 flex flex-1 flex-col overflow-x-hidden pt-20 sm:pt-24">
        {children}
        <SiteFooter />
      </div>
    </div>
  );
}
