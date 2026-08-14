"use client";

import SplashCursor from "@/components/reactbits/SplashCursor";

const GOLD = "#e6b325";

/**
 * Site-wide fluid cursor. Settings match the BG Studio reference;
 * color is brand gold (rainbow off).
 */
export function SiteSplash() {
  return (
    <SplashCursor
      DENSITY_DISSIPATION={3.5}
      VELOCITY_DISSIPATION={2}
      PRESSURE={0.1}
      CURL={3}
      SPLAT_RADIUS={0.2}
      SPLAT_FORCE={6000}
      SHADING
      COLOR_UPDATE_SPEED={10}
      RAINBOW_MODE={false}
      COLOR={GOLD}
      TRANSPARENT
    />
  );
}
