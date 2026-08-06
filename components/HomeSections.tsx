"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { BoxReveal, CinematicScene, PeachScene, useDepthReveal } from "@/components/Cinematic";
import { BeliefSection } from "@/components/BeliefSection";
import { useCursorVars, useMagnetic } from "@/components/Interactions";
import { ContactDialog } from "@/components/ContactDialog";
import { Silk } from "@/components/Silk";

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
 *   Introduction — WebGL dot matrix that scatters from the pointer
 *   Verticals    — 3D card tilt with a light source tracking the cursor
 *   Refusals     — hover strikes the line through and swells it
 *   Six Ds       — hovering one step dims the rest
 *   Invitation   — magnetic CTA that leans toward the pointer
 *   Footer       — marquee that slows when you reach into it
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

const REFUSALS = [
  "We don’t execute without strategy.",
  "We don’t say yes to briefs we don’t believe in.",
  "We don’t compete on price.",
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

function Introduction() {
  const ref = useDepthReveal<HTMLElement>();

  return (
    <section ref={ref} className="relative overflow-hidden px-6 py-28 sm:py-40">
      <div className="relative mx-auto max-w-5xl">
        <p data-depth className="mb-8 text-sm uppercase tracking-[0.35em] text-gold">
          The Introduction
        </p>
        <BoxReveal className="max-w-3xl">
          <h2 className="text-[clamp(2.5rem,6.5vw,5rem)] font-bold leading-[1.08] tracking-tight text-cream">
            One team. The whole picture.
          </h2>
        </BoxReveal>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <p data-depth className="text-[clamp(1.15rem,1.9vw,1.5rem)] leading-[1.8] text-cream/75">
            Adversado brings branding, advertising, marketing, events and performance under
            one roof. It sounds like a service list, but it’s actually a philosophy. Your
            brand should be the same brand everywhere it shows up.
          </p>
          <p data-depth className="text-[clamp(1.15rem,1.9vw,1.5rem)] leading-[1.8] text-cream/75">
            The voice in the strategy room. The ad. The event. The feed. Same voice. Same
            standard. Same slightly obsessive attention to detail.
          </p>
        </div>
        <p
          data-depth
          className="mt-14 font-serif text-[clamp(1.7rem,3.6vw,3rem)] font-light italic text-gold"
        >
          The Brand Behind The Brands.
        </p>
      </div>
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

  return (
    <li
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
      <Silk
        className="absolute inset-0 h-full w-full"
        primaryColor={theme.primary}
        secondaryColor={theme.secondary}
        speed={0.7}
        interactive={0.25}
        intensity={0.3}
      />
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

function Refusals() {
  const ref = useRef<HTMLElement>(null);
  const linesRef = useRef<HTMLUListElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const lines = gsap.utils.toArray<HTMLElement>("li", linesRef.current);
        // Clip-path wipe rather than a fade: the refusals are meant to land
        // like statements being struck onto the page, not drift in.
        gsap.from(lines, {
          clipPath: "inset(0 100% 0 0)",
          duration: 0.8,
          ease: "power4.inOut",
          stagger: 0.15,
          scrollTrigger: { trigger: ref.current, start: "top 70%", once: true },
        });
        gsap.from("[data-depth]", {
          opacity: 0,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.1,
          scrollTrigger: { trigger: ref.current, start: "top 70%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <section ref={ref} className="px-6 py-28 sm:py-40">
      <div className="mx-auto max-w-5xl">
        <p data-depth className="mb-10 text-sm uppercase tracking-[0.35em] text-gold">
          What We Don’t Do
        </p>
        <ul ref={linesRef} className="space-y-9">
          {REFUSALS.map((line) => (
            <li key={line} className="group w-fit max-w-full cursor-default">
              {/* Sized to hold the longest refusal on one line from `sm` up.
                  Below that it's allowed to wrap, and the strike still lands
                  correctly because it's painted per line fragment rather than
                  as one bar across the block. */}
              <span className="inline-block origin-left transition-transform duration-500 group-hover:scale-[1.02]">
                <span className="strike-hover text-[clamp(1.2rem,3vw,2.9rem)] font-bold leading-[1.25] tracking-tight text-cream sm:whitespace-nowrap">
                  {line}
                </span>
              </span>
            </li>
          ))}
        </ul>
        <p data-depth className="mt-10 font-serif text-lg font-light italic text-cream/45">
          Saves everyone time, honestly.
        </p>
      </div>
    </section>
  );
}

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
    <section ref={ref} className="relative overflow-hidden px-6 py-28 sm:py-40">
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

/* ── Footer ─────────────────────────────────────────────────────────────── */

function Footer() {
  const ref = useRef<HTMLElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // The strip holds two identical copies, so sliding exactly one copy
        // width lands on a frame identical to the start — seamless loop.
        const tween = gsap.to(marqueeRef.current, {
          xPercent: -50,
          duration: 28,
          ease: "none",
          repeat: -1,
        });

        // Reaching into the strip slows it to a crawl so the line becomes
        // readable instead of sliding out from under the pointer. Bound
        // imperatively next to the tween rather than through React's
        // onPointerEnter: the handler needs the tween instance, and going
        // via a ref means whichever of the two lands second wins.
        const strip = stripRef.current;
        const slow = () => tween.timeScale(0.15);
        const resume = () => tween.timeScale(1);
        strip?.addEventListener("pointerenter", slow);
        strip?.addEventListener("pointerleave", resume);

        return () => {
          strip?.removeEventListener("pointerenter", slow);
          strip?.removeEventListener("pointerleave", resume);
        };
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <footer ref={ref} className="border-t border-cream/10">
      <div ref={stripRef} className="overflow-hidden py-12">
        <div ref={marqueeRef} className="flex w-max gap-16 whitespace-nowrap">
          {Array.from({ length: 2 }).map((_, copy) => (
            <div key={copy} className="flex gap-16" aria-hidden={copy === 1}>
              {Array.from({ length: 4 }).map((__, i) => (
                <span
                  key={i}
                  className="cursor-default font-serif text-[clamp(1.75rem,5vw,3.5rem)] font-light italic text-cream/15 transition-colors duration-500 hover:text-gold/60"
                >
                  The Brand Behind The Brands.
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 pb-14 sm:flex-row sm:items-end sm:justify-between">
        <p className="max-w-md text-xl leading-relaxed text-cream/60">
          Strategy to execution, end to end.
        </p>
        <p className="text-xs uppercase tracking-[0.2em] text-cream/40">
          Branding <span className="text-gold/60">/</span> Advertising{" "}
          <span className="text-gold/60">/</span> Marketing{" "}
          <span className="text-gold/60">/</span> Events{" "}
          <span className="text-gold/60">/</span> Performance
        </p>
      </div>
    </footer>
  );
}

export function HomeSections() {
  return (
    <>
      {/* One camera move, one space. The scene is fixed behind the whole run
          of sections and the scrollbar is its dolly track; nothing above it
          paints a ground of its own, so there is no seam anywhere to read as
          the end of one page and the start of the next. */}
      {/* Three fixed layers under the copy, in paint order: black ground,
          the authored scene, then the starfield over the top of it. The
          scene clears its own canvas opaque, so the stars have to sit above
          it to be seen at all — and since they are additive points on
          transparency, they land on its black and read as one night sky
          the whole scene stands in. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 bg-black" />
      <PeachScene />
      <CinematicScene />
      {/* Clipped sideways: the tilted vertical cards swing their corners a few
          px past the viewport at the extremes of the effect, which is enough
          to put a horizontal scrollbar on the whole page. */}
      <div className="relative z-10 overflow-x-hidden">
        <BeliefSection />
        <Introduction />
        <Verticals />
        <Refusals />
        <SixDs />
        <Invitation />
      </div>
    </>
  );
}
