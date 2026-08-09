"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { BoxReveal, CinematicScene, useDepthReveal } from "@/components/Cinematic";
import { BeliefSection } from "@/components/BeliefSection";
import { useMagnetic, useNearViewport } from "@/components/Interactions";
import { ContactDialog } from "@/components/ContactDialog";
import { Magnify } from "@/components/Magnify";
import { Silk } from "@/components/Silk";
import { SectionWipe } from "@/components/SectionWipe";
import { SlideBreaker } from "@/components/SlideBreaker";
import { IntroCard } from "@/components/vendor/IntroCard";
import TargetCursor from "@/components/vendor/TargetCursor";
import "@/components/vendor/TargetCursor.css";
import SplashCursor from "@/components/reactbits/SplashCursor";
import LaserFlow from "@/components/reactbits/LaserFlow";
import "@/components/reactbits/LaserFlow.css";

/** Brand gold, for the props that take a colour rather than a class. */
const GOLD = "#e6b325";

/** Brand cream, for the cursor's locked-on colour — pops against the CTA's
    gold fill and the MOVES line the way white would, without pulling the
    palette off the brand. */
const CREAM = "#f9f7f2";

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
    // `id`, not a ref: SectionWipe (HomeSections.tsx) needs this element as a
    // ScrollTrigger target, and a selector string resolved lazily by GSAP
    // sidesteps having to coordinate two components' ref timing.
    <section id="introduction" ref={ref} className="px-6 py-28 sm:py-40">
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
      className="focus-inset group relative h-[240px] min-w-0 cursor-pointer overflow-hidden rounded-2xl border border-cream/12 transition-[flex-grow] duration-700 ease-out sm:h-full"
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
            /* `min-h-11` (44px): the link's own line box is 17px tall, which
               is well under the touch-target floor on a phone. */
            className="group inline-flex min-h-11 items-center gap-3 text-base uppercase tracking-[0.2em] text-gold"
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

/** The three moves, each its own line of the rhythm. */
const MOVES = ["Launching.", "Repositioning.", "Expanding."];

function Invitation({
  active,
  onVisibilityChange,
}: {
  /** Whether this section currently occupies the viewport. The home page's
      cursor switches at this boundary: the tubes cursor runs everywhere else,
      and this section's targeting cursor only takes over while `active`. */
  active: boolean;
  onVisibilityChange: (visible: boolean) => void;
}) {
  const ref = useDepthReveal<HTMLElement>();
  const movesRef = useRef<HTMLParagraphElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const [laserRef, laserNear] = useNearViewport<HTMLDivElement>();

  // Viewport gate for the cursor swap. The section runs for the whole page
  // lifetime, so the gate has to follow scroll position — once `active` flips
  // off it must hand back to the tubes cursor as the section scrolls away.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) onVisibilityChange(entry.isIntersecting);
      },
      { threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [onVisibilityChange, ref]);

  // Written straight to the style attribute rather than through state, the way
  // the demo does it and the way `useCursorVars` does it elsewhere here — the
  // gesture fires on every pointer move and must not cost a render.
  const onStageMove = (e: React.MouseEvent<HTMLElement>) => {
    const el = revealRef.current;
    if (!el) return;
    const rect = e.currentTarget.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };
  const onStageLeave = () => {
    const el = revealRef.current;
    if (!el) return;
    el.style.setProperty("--mx", "-9999px");
    el.style.setProperty("--my", "-9999px");
  };
  const [contactOpen, setContactOpen] = useState(false);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Struck onto the page one at a time rather than faded in — the copy
        // is three clipped sentences and the reveal should read the same way.
        // (Same wipe the refusals used to carry, which is free again now.)
        gsap.from("[data-move]", {
          clipPath: "inset(0 100% 0 0)",
          duration: 0.7,
          ease: "power4.inOut",
          stagger: 0.16,
          scrollTrigger: { trigger: movesRef.current, start: "top 82%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    // The last section on the page now that the footer is gone, so its own
    // bottom padding is what sets how much air the button sits in — no
    // trailing footer left to supply that space.
    <section
      ref={ref}
      onMouseMove={onStageMove}
      onMouseLeave={onStageLeave}
      // `--stage` is the height of the beam's run before it strikes. The card
      // is placed at 70% of it, which is where the demo puts its box and
      // therefore where the beam's flare actually lands.
      className="relative overflow-hidden px-6 pb-32 [--stage:400px] sm:pb-48 sm:[--stage:620px]"
    >
      {/* The laser wants black to burn against — over the starfield and the
          horizon silhouette it read as a hairline. Transparent at the very top
          so there is no seam where the section starts. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(3,5,10,0) 0%, rgba(3,5,10,0.94) 20%, rgba(3,5,10,0.98) 100%)",
        }}
      />

      {/* React Bits' LaserFlow, in brand gold, run over the stage only rather
          than the whole section — the beam has to end on the card's top edge,
          and a full-height canvas puts it straight through the copy, which is
          what made this unreadable before.

          Offsets are the demo's own box-example values (0.1 / -0.2); they are
          what put the flare at 70% of the canvas. One more WebGL context, so
          it is gated behind `useNearViewport` like every other shader here —
          the component pauses its own loop off-screen, but it takes the
          context at mount, and the budget is what the gating is about. */}
      <div
        ref={laserRef}
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[var(--stage)]"
      >
        {laserNear && (
          <LaserFlow
            color={GOLD}
            horizontalBeamOffset={0.1}
            verticalBeamOffset={-0.2}
            flowSpeed={0.3}
            wispDensity={0.8}
            wispIntensity={4}
            fogIntensity={0.32}
            mouseTiltStrength={0.06}
            mouseSmoothTime={0.18}
          />
        )}
      </div>

      {/* The demo's cursor-tracked reveal — a soft circle masked to follow the
          pointer, sitting between the beam and the card exactly as theirs sits
          between beam and box. Theirs lights a stock image through the mask;
          this lights a gold sheen, so the page carries no hotlinked
          third-party asset. `lighten` so it only ever adds light. */}
      <div
        ref={revealRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[2] mix-blend-lighten"
        style={
          {
            background:
              "radial-gradient(circle at var(--mx) var(--my), rgba(230,179,37,0.32), rgba(230,179,37,0.10) 45%, rgba(230,179,37,0) 70%)",
            "--mx": "-9999px",
            "--my": "-9999px",
            WebkitMaskImage:
              "radial-gradient(circle at var(--mx) var(--my), rgba(255,255,255,1) 0px, rgba(255,255,255,0.95) 60px, rgba(255,255,255,0.6) 120px, rgba(255,255,255,0.25) 180px, rgba(255,255,255,0) 240px)",
            maskImage:
              "radial-gradient(circle at var(--mx) var(--my), rgba(255,255,255,1) 0px, rgba(255,255,255,0.95) 60px, rgba(255,255,255,0.6) 120px, rgba(255,255,255,0.25) 180px, rgba(255,255,255,0) 240px)",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
          } as React.CSSProperties
        }
      />

      {/* The card the beam lands on. Same treatment as the demo's box — near
          black fill, 2px gold edge, 20px radius, above the reveal at z-6 — and
          it starts at 70% of the stage so its top edge is exactly where the
          beam terminates. Unlike the demo's fixed 60%-height box this grows
          with the copy, which is the whole point of putting the copy in it.

          Widened to `max-w-6xl` so the two closing sentences each read as a
          single centered line across the card rather than a pair of narrow
          columns sitting in a sea of black. */}
      <div className="relative z-[6] mx-auto mt-[calc(var(--stage)*0.7)] max-w-6xl rounded-[20px] border-2 border-gold bg-[#120F17] px-6 py-14 text-center sm:px-12 sm:py-20">
        {/* The Invitation's own cursor. Fixed to the viewport, so it covers
            the whole page once mounted — it must therefore only be live while
            this section actually owns the viewport (`active`), or it would
            stack on the splash cursor everywhere else.

            Conditionally mounted rather than kept mounted and just visually
            hidden: TargetCursor sets `document.body.style.cursor = "none"` on
            mount and only restores it in its own unmount cleanup. Held
            mounted-but-invisible (the previous `visibility` toggle), it set
            that once on first entry to the Invitation and then never gave the
            native cursor back for the rest of the page — the reader lost
            their pointer everywhere, not just here. Unmounting on the way out
            is what runs the cleanup that hands it back. */}
        {active && (
          <TargetCursor
            targetSelector=".cursor-target"
            cursorColor={GOLD}
            cursorColorOnTarget={CREAM}
            hideDefaultCursor
            spinDuration={2}
            parallaxOn
          />
        )}

        <p data-depth className="mb-8 text-sm uppercase tracking-[0.35em] text-gold">
          The Invitation
        </p>
        <BoxReveal>
          <h2 className="font-serif text-[clamp(2.5rem,6.5vw,5rem)] leading-[1.1] text-cream">
            We’re not for everyone. <span className="text-gold">That’s deliberate.</span>
          </h2>
        </BoxReveal>

        <p
          data-depth
          className="mx-auto mt-10 max-w-3xl text-[clamp(1.25rem,2vw,1.6rem)] leading-[1.8] text-cream/70"
        >
          We work with <Magnify className="font-bold italic text-gold">ambitious</Magnify>{" "}
          brands ready to make{" "}
          <span className="rounded-[0.3em] bg-gold/18 px-[0.22em] py-[0.04em] font-bold text-gold [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
            bold moves.
          </span>
        </p>

        {/* The turn in the copy, and the only place it stops being a paragraph.
            Three clipped sentences set as one line of rhythm — sans and loud
            against the serif headline above them, so the eye lands here. A
            `cursor-target` so the TargetCursor's brackets close around the
            whole line rather than each word. */}
        <p
          ref={movesRef}
          className="cursor-target mx-auto mt-12 flex flex-wrap items-baseline justify-center gap-x-6 gap-y-2 font-sans text-[clamp(1.5rem,3.6vw,2.75rem)] font-black uppercase leading-tight tracking-tight text-gold sm:gap-x-10"
        >
          {MOVES.map((move) => (
            // `inline-block` so the wipe has a box of its own to clip against;
            // on an inline span it would clip the whole line.
            <span key={move} data-move className="inline-block">
              {move}
            </span>
          ))}
        </p>

        <p
          data-depth
          className="mx-auto mt-12 max-w-3xl text-[clamp(1.25rem,2vw,1.6rem)] leading-[1.8] text-cream/70"
        >
          If you’re looking for{" "}
          <span className="font-bold text-cream">a partner,</span>{" "}
          {/* Dimmed rather than marked: it's the thing being ruled out, so it
              should read quieter than what it's being set against. */}
          <span className="text-cream/40">not another agency,</span> we’d love to meet.
        </p>
        <div data-depth className="mt-12">
          <button
            type="button"
            onClick={() => setContactOpen(true)}
            className="group cursor-target inline-flex min-h-11 items-center gap-3 bg-gold px-9 py-4 text-sm font-bold uppercase tracking-[0.2em] text-charcoal transition-colors duration-300 hover:bg-cream"
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
  // Cursor handoff. `invitationActive` follows the Invitation's own
  // IntersectionObserver (inside the section): while it owns the viewport the
  // TargetCursor is live and the tubes cursor is blanked, everywhere else the
  // tubes cursor is the page's pointer. Latched in _this_ component because
  // the two cursor mounts live at different tree positions (tubes here, the
  // target cursor inside the Invitation) and both must agree on one value.
  const [invitationActive, setInvitationActive] = useState(false);

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
      {/* The site-wide cursor: the same gold fluid trail the countdown page
          runs (SplashCursor, reactbits) rather than the threejs tubes this
          used to be — the request was to bring the landing page's cursor over
          here. It renders itself `fixed`/`z-50`/`pointer-events-none` with no
          prop to blank it, so it's unmounted for the Invitation instead of
          hidden; TargetCursor takes over there. Unmounting also means a fresh
          fluid sim on every re-entry rather than one asked to resume mid-decay,
          which is the cheaper and simpler of the two anyway. */}
      {!invitationActive && (
        <SplashCursor RAINBOW_MODE={false} COLOR={GOLD} SPLAT_RADIUS={0.22} DENSITY_DISSIPATION={2.5} />
      )}
      {/* Clipped sideways: the tilted vertical cards swing their corners a few
          px past the viewport at the extremes of the effect, which is enough
          to put a horizontal scrollbar on the whole page. */}
      {/* The Belief closes on "Attention is rented. Memory is owned."; this is
          the wipe that carries the reader across the seam into Introduction
          rather than a plain scroll cut. Scoped here rather than inside
          either section since it belongs to neither — it's the boundary. */}
      <SectionWipe trigger="#introduction" />
      <div className="relative z-10 overflow-x-hidden">
        <BeliefSection />
        <Introduction />
        <Verticals />
        <SlideBreaker />
        <SixDs />
        <Invitation active={invitationActive} onVisibilityChange={setInvitationActive} />
      </div>
    </>
  );
}
