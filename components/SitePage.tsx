"use client";

/**
 * Shared shell for About / Services / Contact.
 * Night starfield ground (same as home). Nav lives in the root layout.
 */
import { CinematicScene } from "@/components/Cinematic";
import { SiteFooter } from "@/components/SiteFooter";

type SitePageProps = {
  children: React.ReactNode;
  /** `deep` — heavier black scrim (readable type over stars). */
  sky?: "default" | "deep";
};

export function SitePage({ children, sky = "default" }: SitePageProps) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 bg-black" />
      <CinematicScene />
      {sky === "deep" ? (
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
