"use client";

import { useEffect, useState } from "react";
import ElasticMesh from "@/components/reactbits/ElasticMesh";
import RippleDistortion from "@/components/reactbits/RippleDistortion";

const NAVY = "#1F355E";
const GOLD = "#E6B325";

/** Launch moment. Six days out from the build date — edit this one line to move it. */
const TARGET = new Date("2026-08-11T09:00:00+05:30").getTime();

const UNITS = ["Days", "Hours", "Minutes", "Seconds"] as const;

function remaining(): number[] {
  const ms = Math.max(0, TARGET - Date.now());
  const s = Math.floor(ms / 1000);
  return [Math.floor(s / 86400), Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60];
}

export default function CountdownPage() {
  // Left null on the server: the clock reads `Date.now()`, so rendering it
  // during SSR guarantees a hydration mismatch a second later.
  const [parts, setParts] = useState<number[] | null>(null);

  useEffect(() => {
    const first = setTimeout(() => setParts(remaining()), 0);
    const id = setInterval(() => setParts(remaining()), 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  return (
    <main
      className="relative min-h-screen w-full overflow-x-hidden"
      style={{ background: NAVY, color: GOLD }}
    >
      {/* Night sky, rippling under the cursor. `grayscale` is on by default
          upstream and would drain the blue straight out of the wallpaper.
          Wrapped rather than given `absolute` directly: the component ships
          its own unlayered stylesheet pinning the container to `relative`,
          and unlayered CSS beats Tailwind's layered utilities. */}
      {/* Fixed, not absolute: on a short viewport the copy has to be allowed
          to overflow and scroll, and a background pinned to the document
          would scroll away with it. */}
      <div className="fixed inset-0">
        <RippleDistortion
          src="/night-sky.svg"
          grayscale={false}
          // A gold tint multiplies against a blue sky and lands on olive —
          // the ripple has to brighten the night, not muddy it, so the tint
          // is a cool moonlight blue and the dispersion is kept low enough
          // that the point stars fringe rather than speckle.
          tint="#7fb0ff"
          tintAmount={0.18}
          highlightColor="#e8f0ff"
          glint={0.3}
          strength={0.12}
          swirl={0.55}
          rings={3}
          dispersion={0.07}
          brushSize={190}
          quality="medium"
        />
      </div>

      {/* Keeps the wallpaper from swallowing the type where the two overlap. */}
      <div
        aria-hidden
        className="fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 46%, rgba(5,10,22,0.72), rgba(5,10,22,0) 75%)",
        }}
      />

      {/* Transparent to the pointer as a whole so the background shader keeps
          receiving mousemove; only the mesh tiles opt back in. */}
      <div className="pointer-events-none relative z-10 flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-14 text-center">
        {/* Masked rather than dropped in as an <img>: the file's gold is
            rgb(247,197,9), a shade off the brand's #E6B325, and painting a
            mask is the only way to get the exact value without editing the
            SVG or guessing at a filter chain. */}
        <h1
          aria-label="Adversado"
          className="h-24 w-[min(92vw,54rem)] sm:h-36"
          style={{
            background: GOLD,
            WebkitMask: "url(/logo.svg) center/contain no-repeat",
            mask: "url(/logo.svg) center/contain no-repeat",
          }}
        />

        <p className="font-serif text-[clamp(0.95rem,2.4vw,1.6rem)] font-light italic tracking-[0.08em]">
          The Brand Behind The Brands.
        </p>

        <p className="mt-2 text-[0.62rem] font-bold uppercase tracking-[0.34em] text-cream/70 sm:text-xs">
          The site goes live in
        </p>

        {/* Grid rather than a wrapping flex row: four tiles wrap 3+1 on a
            phone, which reads as a mistake. 2×2 reads as a layout. */}
        <div className="grid grid-cols-2 place-items-center gap-4 sm:grid-cols-4 sm:gap-6">
          {UNITS.map((label, i) => (
            <div key={label} className="flex flex-col items-center gap-3">
              <div className="pointer-events-auto relative h-[clamp(5rem,17vw,9.5rem)] w-[clamp(5rem,17vw,9.5rem)]">
                <ElasticMesh
                  color1={GOLD}
                  color2="#c2930f"
                  highlight="#fff6dc"
                  gridColor={NAVY}
                  gridOpacity={0.22}
                  gridDensity={16}
                  borderRadius={28}
                  tilt={12}
                  pull={0.55}
                  wobble={6}
                />
                <span
                  // Keyed on the value so each tick remounts the span and
                  // replays the entry animation — no timers, no state.
                  key={parts?.[i]}
                  className="digit-in pointer-events-none absolute inset-0 flex items-center justify-center text-[clamp(1.9rem,6vw,3.4rem)] font-bold tabular-nums"
                  style={{ color: NAVY }}
                >
                  {parts ? String(parts[i]).padStart(2, "0") : "--"}
                </span>
              </div>
              <span className="text-[0.6rem] font-bold uppercase tracking-[0.3em] sm:text-xs">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Copy lifted from the brand's own documents rather than written
            fresh: the pull quote closes THE BELIEF in the content doc, and
            the body line is the INTRODUCTION section compressed. The brand
            book bans "we're excited to announce" and the rest of the
            coming-soon vocabulary by name, so none of it appears here. */}
        <p className="mt-6 max-w-2xl font-serif text-[clamp(1.05rem,2.6vw,1.75rem)] leading-snug text-cream">
          Attention is rented. Memory is owned.
        </p>

        <p className="max-w-xl text-[clamp(0.8rem,1.6vw,1rem)] leading-relaxed text-cream/70">
          An integrated creative agency in Kochi, building brands across India.
          Branding, advertising, marketing, events and performance under one roof.
          <span className="mt-3 block font-bold text-cream">
            One team. One voice. One standard.
          </span>
        </p>

        <p className="mt-2 text-[0.55rem] font-bold uppercase tracking-[0.28em] text-gold/80 sm:text-[0.65rem]">
          Branding <span className="text-cream/30">/</span> Advertising{" "}
          <span className="text-cream/30">/</span> Marketing{" "}
          <span className="text-cream/30">/</span> Events{" "}
          <span className="text-cream/30">/</span> Performance
        </p>
      </div>
    </main>
  );
}
