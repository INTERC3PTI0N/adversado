import type { Metadata } from "next";
import { EnergyOrb } from "@/components/EnergyOrb";

export const metadata: Metadata = {
  title: "Energy Orb — Adversado",
  robots: { index: false, follow: false },
};

/**
 * Preview surface for the EnergyOrb component. Not linked from the site — it
 * exists so the shader can be looked at on its own and its props driven
 * against something. Safe to delete once the orb has a home.
 */

const VARIANTS = [
  {
    name: "Default",
    note: "Matched to orb.mp4 — brand gold / cyan rim, 5.53s fill surge, gold band in the settled marble.",
    props: {},
  },
  {
    name: "Signal",
    note: "Brand palette — signal gold #e6b325 against icy cyan.",
    props: {
      coolColor: "#a8f0ff",
      warmColor: "#e6b325",
      deepColor: "#0a1020",
      coreColor: "#f9f7f2",
      rays: 1.0,
      glow: 1.45,
    },
  },
  {
    name: "Gleam",
    note: "Peak rim yellows from the ref (#ffff5f) — denser glass, still clipped to the circle.",
    props: {
      coolColor: "#bdffff",
      warmColor: "#ffff5f",
      deepColor: "#020814",
      coreColor: "#fff8d0",
      radius: 0.28,
      rays: 1.25,
      sparkle: 0.45,
      glow: 1.65,
      speed: 1,
    },
  },
];

export default function OrbPage() {
  return (
    <main className="min-h-screen bg-black text-cream">
      <section className="relative flex min-h-screen flex-col items-center justify-end overflow-hidden px-6 pb-[11vh]">
        {/* Radius is a fraction of height, so a wide viewport needs a smaller
            one than the square reference frame to keep the same breathing. */}
        <EnergyOrb className="absolute inset-0 h-full w-full" radius={0.22} />

        <div className="pointer-events-none relative z-10 text-center">
          <h1 className="font-serif text-[clamp(2.5rem,6.5vw,5rem)] font-light leading-[1.1] tracking-tight">
            A sphere of light,
            <span className="block font-sans font-black uppercase tracking-tight text-cream">
              drawn in one triangle.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-cream/50">
            Move the pointer — it leans. Scroll away and it stops drawing.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-40">
        <div className="grid gap-10 sm:grid-cols-3">
          {VARIANTS.map((v) => (
            <figure key={v.name}>
              <div className="relative aspect-square w-full overflow-hidden rounded-[20px] border border-cream/12 bg-black">
                <EnergyOrb className="absolute inset-0 h-full w-full" {...v.props} />
              </div>
              <figcaption className="mt-5">
                <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-gold">
                  {v.name}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-cream/50">{v.note}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </main>
  );
}
