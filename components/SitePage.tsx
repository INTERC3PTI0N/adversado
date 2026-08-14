"use client";

/**
 * Shared shell for About / Services / Contact.
 * Night starfield ground (same as home). Nav lives in the root layout.
 */
import { AuroraField } from "@/components/AuroraField";
import { CinematicScene } from "@/components/Cinematic";
import { SiteFooter } from "@/components/SiteFooter";

type SitePageProps = {
  children: React.ReactNode;
  /** `deep` — heavier black scrim (readable type over stars). */
  sky?: "default" | "deep";
  /** `aurora` swaps the WebGL starfield for the painted aurora ground. */
  ground?: "stars" | "aurora";
};

export function SitePage({ children, sky = "default", ground = "stars" }: SitePageProps) {
  const aurora = ground === "aurora";

  return (
    <div className="relative flex min-h-screen flex-col">
      {!aurora && (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0 bg-black" />
      )}
      {aurora ? <AuroraField /> : <CinematicScene />}
      {sky === "deep" && !aurora ? (
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
