"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { BoxReveal, CinematicScene, useDepthReveal } from "@/components/Cinematic";
import { BeliefSection } from "@/components/BeliefSection";
import { useCursorVars, useMagnetic, useNearViewport } from "@/components/Interactions";
import { ContactDialog } from "@/components/ContactDialog";
import { Silk } from "@/components/Silk";
import { IntroCard } from "@/components/vendor/IntroCard";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Everything below the hero. Copy is verbatim from the website content doc
 * (Adversado_Website_final_SEO); palette and type follow the brand book.
 *
 * No section paints its own background. They used to alternate charcoal /
 * bone / navy / gold, and every one of those edges read as the end of a page
 * and the start of another. Now the cinematic scene is the only ground and
 * the sections are transparent panes of type moving across it — separation
 * comes from hairlines, spacing and the camera moving, not from colour
 * blocks. That is the difference between a site in sections and a site.
 *
 * Every section still carries its own interaction, chosen to suit what it is
 * saying rather than repeating one effect six times:
 *   Belief       — the monolith, craned down as you scroll past it
 *   Introduction — navy wash that tracks the cursor across the whole block
 *   Verticals    — accordion of shader panels, magnetic CTA under them
 *   Six Ds       — hovering one step dims the rest
 *   Invitation   — gold wash and a magnetic CTA that leans toward the pointer
 */

const VERTICALS = [
  {
    name: "Brand Foundation",
    tagline: "Build what you stand on.",
    quip: "Because “vibes” is not a positioning.",
  },
  {
    name: "Brand Marketing",
    tagline: "Say it so people listen.",
    quip: "Talking is not the same as being heard.",
  },
  {
    name: "Brand Reach",
    tagline: "Make sure the right people find you.",
    quip: "Van Gogh sold one painting in his lifetime. Don’t be Van Gogh.",
  },
  {
    name: "Brand Experience",
    tagline: "Make people feel it.",
    quip: "Nobody ever fell in love with a PDF.",
  },
];

const SIX_DS = [
  { d: "Discover", line: "We learn the business before we touch the brand." },
  { d: "Debate", line: "The insight gets argued before it gets approved. Conviction, not consensus." },
  { d: "Define", line: "One position that makes every future decision easier." },
  { d: "Design", line: "Identity, communication and experience as one connected system." },
  { d: "Deliver", line: "Consistency measured as strictly as quality." },
  { d: "Develop", line: "Measure, refine, repeat. A brand is a living thing." },
];

/* ── The Introduction ───────────────────────────────────────────────────── */
/* No card any more — the wordmark, tagline and argument sit directly on the
 * page's own starfield, like every other section. The body copy still runs
 * through React Bits' VariableProximity, thickening each letter as the cursor
 * passes, and key phrases are still marked. */

function Introduction() {
  const ref = useDepthReveal<HTMLElement>();

  return (
    <section ref={ref} className="px-6 py-28 sm:py-40">
      <IntroCard className="mx-auto w-full max-w-[130rem]" />
    </section>
  );
}

/* ── The Four Verticals ─────────────────────────────────────────────────── */
/* Accordion gallery (reactbits.dev/components/accordion-gallery): the hovered
 * panel grows, the rest collapse to a spine. Media is swapped for the Silk
 * shader, tinted per card, in place of a photo. */

const VERTICAL_THEMES = [
  { primary: "#1f355e", secondary: "#0a1220" },
  { primary: "#e6b325", secondary: "#241a05" },
  { primary: "#7a2e2e", secondary: "#1a0808" },
  { primary: "#2f6b4f", secondary: "#081712" },
];

function VerticalCard({
  v,
  i,
  active,
  onActivate,
}: {
  v: (typeof VERTICALS)[number];
  i: number;
  active: boolean;
  onActivate: (i: number) => void;
}) {
  const theme = VERTICAL_THEMES[i % VERTICAL_THEMES.length];
  // Four shaders, four WebGL contexts, all of them far below the fold while
  // the preloader is still running its own ten. Held back until the card is
  // nearly in view — see `useNearViewport`.
  const [cardRef, near] = useNearViewport<HTMLLIElement>();

  return (
    <li
      ref={cardRef}
      data-depth
      tabIndex={0}
      role="listitem"
      aria-current={active ? "true" : undefined}
      onMouseEnter={() => onActivate(i)}
      onFocus={() => onActivate(i)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") onActivate((i + 1) % VERTICALS.length);
        if (e.key === "ArrowLeft" || e.key === "ArrowUp")
          onActivate((i - 1 + VERTICALS.length) % VERTICALS.length);
      }}
      className="group relative h-[240px] min-w-0 cursor-pointer overflow-hidden rounded-2xl border border-cream/12 transition-[flex-grow] duration-700 ease-out sm:h-full"
      style={{ flexGrow: active ? 5 : 1, flexBasis: 0 }}
    >
      {/* The card keeps its own colour underneath, so a panel that hasn't
          been scrolled to yet is still the right shape and tone rather than a
          hole — the shader fades in over it once it arrives. */}
      <span aria-hidden className="absolute inset-0" style={{ background: theme.secondary }} />
      {near && (
        <Silk
          className="absolute inset-0 h-full w-full"
          primaryColor={theme.primary}
          secondaryColor={theme.secondary}
          speed={0.7}
          interactive={0.25}
          intensity={0.3}
        />
      )}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/15 to-transparent transition-opacity duration-500"
        style={{ opacity: active ? 0.5 : 0.85 }}
      />

      <div className="relative flex h-full flex-col justify-end p-6 sm:p-8">
        <span className="font-serif text-sm text-cream/70">{String(i + 1).padStart(2, "0")}</span>
        <h3 className="mt-3 text-lg font-bold uppercase tracking-[0.14em] text-cream sm:text-xl">
          {v.name}
        </h3>
        <div
          className="grid transition-[grid-template-rows,opacity] duration-500 ease-out"
          style={{ gridTemplateRows: active ? "1fr" : "0fr", opacity: active ? 1 : 0 }}
        >
          <div className="overflow-hidden">
            <p className="mt-4 text-[clamp(1.15rem,2.2vw,1.6rem)] leading-snug text-cream">
              {v.tagline}
            </p>
            <p className="mt-3 font-serif text-base font-light italic leading-relaxed text-cream/60">
              {v.quip}
            </p>
          </div>
        </div>
        <span
          className="mt-6 block h-px w-full origin-left bg-gold transition-transform duration-500"
          style={{ transform: active ? "scaleX(1)" : "scaleX(0)" }}
        />
      </div>
    </li>
  );
}

function Verticals() {
  const ref = useDepthReveal<HTMLElement>(0.1);
  const ctaRef = useMagnetic<HTMLAnchorElement>({ strength: 0.35, radius: 100 });
  const [active, setActive] = useState(0);

  return (
    <section ref={ref} className="px-6 py-28 sm:py-40">
      <div className="mx-auto max-w-6xl">
        <p data-depth className="mb-8 text-sm uppercase tracking-[0.35em] text-gold">
          The Four Verticals
        </p>
        <BoxReveal>
          <h2 className="text-[clamp(2.5rem,6.5vw,5rem)] font-bold leading-[1.08] tracking-tight text-cream">
            Four verticals. One journey.
          </h2>
        </BoxReveal>

        <ul
          data-depth
          role="list"
          aria-label="The four verticals"
          className="mt-16 flex flex-col gap-3 sm:h-[520px] sm:flex-row"
        >
          {VERTICALS.map((v, i) => (
            <VerticalCard key={v.name} v={v} i={i} active={active === i} onActivate={setActive} />
          ))}
        </ul>

        <div data-depth className="mt-14">
          <Link
            ref={ctaRef}
            href="/services"
            prefetch={false}
            className="group inline-flex items-center gap-3 text-base uppercase tracking-[0.2em] text-gold"
          >
            Explore the full journey
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── What We Don’t Do ───────────────────────────────────────────────────── */

/* ── How We Work ────────────────────────────────────────────────────────── */

function SixDs() {
  const ref = useDepthReveal<HTMLElement>(0.08);
  const trackRef = useRef<HTMLSpanElement>(null);
  const listRef = useRef<HTMLOListElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Gold rail draws downward as the list scrolls past — a literal read
        // of "it's a loop, not a line" from the book's process page.
        gsap.from(trackRef.current, {
          scaleY: 0,
          transformOrigin: "top center",
          ease: "none",
          scrollTrigger: {
            trigger: listRef.current,
            start: "top 70%",
            end: "bottom 80%",
            scrub: 0.5,
          },
        });
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <section ref={ref} className="px-6 py-28 sm:py-40">
      <div className="mx-auto max-w-4xl">
        <p data-depth className="mb-8 text-sm uppercase tracking-[0.35em] text-gold">
          How We Work
        </p>
        <BoxReveal>
          <h2 className="text-[clamp(2.5rem,6.5vw,5rem)] font-bold leading-[1.08] tracking-tight text-cream">
            Six Ds. No filler.
          </h2>
        </BoxReveal>

        <div className="relative mt-16 pl-8 sm:pl-12">
          <span className="absolute left-0 top-0 h-full w-px bg-cream/12" aria-hidden />
          <span
            ref={trackRef}
            className="absolute left-0 top-0 h-full w-px bg-gold"
            aria-hidden
          />
          <ol ref={listRef} className="focus-list space-y-14">
            {SIX_DS.map(({ d, line }) => (
              // The scroll reveal animates the inner wrapper, not the <li>.
              // `.focus-list` puts a CSS transition on the li's own opacity
              // for the hover dimming, and GSAP writing inline opacity to
              // that same element every frame leaves the two fighting — the
              // tween stalls and the item never becomes visible at all.
              <li key={d} className="group relative cursor-default">
                <div data-depth>
                  <span
                    className="absolute -left-8 top-2.5 h-1.5 w-1.5 rounded-full bg-gold transition-transform duration-500 group-hover:scale-[2.2] sm:-left-12"
                    aria-hidden
                  />
                  <h3 className="text-2xl font-bold uppercase tracking-[0.16em] text-gold">{d}</h3>
                  <p className="mt-3 max-w-2xl text-[clamp(1.05rem,1.7vw,1.35rem)] leading-[1.8] text-cream/70">{line}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <p data-depth className="mt-14 font-serif text-lg font-light italic text-cream/45">
          Every engagement starts with an audit. No exceptions. Even the ones we like.
        </p>
      </div>
    </section>
  );
}

/* ── The Invitation ─────────────────────────────────────────────────────── */

function Invitation() {
  const ref = useDepthReveal<HTMLElement>();
  const glowRef = useCursorVars<HTMLDivElement>();
  const magnetRef = useMagnetic<HTMLButtonElement>({ strength: 0.4, radius: 110 });
  const [contactOpen, setContactOpen] = useState(false);

  return (
    // The last section on the page now that the footer is gone, so its own
    // bottom padding is what sets how much air the button sits in — no
    // trailing footer left to supply that space.
    <section ref={ref} className="relative overflow-hidden px-6 pb-32 pt-28 sm:pb-48 sm:pt-40">
      <div
        ref={glowRef}
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(560px circle at var(--mx, 50%) var(--my, 50%), rgba(230,179,37,0.10), transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-4xl text-center">
        <p data-depth className="mb-8 text-sm uppercase tracking-[0.35em] text-gold">
          The Invitation
        </p>
        <BoxReveal>
          <h2 className="font-serif text-[clamp(2.5rem,6.5vw,5rem)] leading-[1.1] text-cream">
            We’re not for everyone. That’s deliberate.
          </h2>
        </BoxReveal>
        <p
          data-depth
          className="mx-auto mt-10 max-w-2xl text-[clamp(1.15rem,1.9vw,1.5rem)] leading-[1.8] text-cream/70"
        >
          We do our best work at turning points — launching, relaunching, repositioning,
          expanding. Brands ready to treat branding as an investment, take one partner over
          ten vendors, and hear the honest answer even when a comfortable one is available.
          If reading that felt like relief, we should talk.
        </p>
        <div data-depth className="mt-12">
          <button
            ref={magnetRef}
            type="button"
            onClick={() => setContactOpen(true)}
            className="group inline-flex items-center gap-3 bg-gold px-9 py-4 text-sm font-bold uppercase tracking-[0.2em] text-charcoal transition-colors duration-300 hover:bg-cream"
          >
            Tell us where it hurts
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </button>
        </div>
      </div>

      <ContactDialog open={contactOpen} onClose={() => setContactOpen(false)} />
    </section>
  );
}

export function HomeSections() {
  return (
    <>
      {/* One camera move, one space. The scene is fixed behind the whole run
          of sections and the scrollbar is its dolly track; nothing above it
          paints a ground of its own, so there is no seam anywhere to read as
          the end of one page and the start of the next. */}
      {/* Two fixed layers under the copy: black ground, then the parallax
          constellations over it. The authored figure scene is off for now —
          `PeachScene` is still in Cinematic.tsx, unmounted, so turning it
          back on is one line. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 bg-black" />
      <CinematicScene />
      {/* Clipped sideways: the tilted vertical cards swing their corners a few
          px past the viewport at the extremes of the effect, which is enough
          to put a horizontal scrollbar on the whole page. */}
      <div className="relative z-10 overflow-x-hidden">
        <BeliefSection />
        <Introduction />
        <Verticals />
        <SixDs />
        <Invitation />
      </div>
    </>
  );
}
