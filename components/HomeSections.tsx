"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { BoxReveal, CinematicScene, useDepthReveal } from "@/components/Cinematic";
import { BeliefSection } from "@/components/BeliefSection";
import { useMagnetic } from "@/components/Interactions";
import { InvitationContactForm } from "@/components/InvitationContactForm";
import { Magnify } from "@/components/Magnify";
import { SlideBreaker } from "@/components/SlideBreaker";
import { WelcomeVerticalsRail } from "@/components/WelcomeVerticalsRail";
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
 *   Belief       — fly-through into the belief
 *   Introduction — welcome argument + wordmark
 *   Verticals    — pinned pack-44 flip cards, magnetic CTA under them
 *   Six Ds       — hovering one step dims the rest
 *   Invitation   — constellation field; 3D audit form tracks the cursor
 */

const VERTICALS = [
  {
    name: "Brand Foundation",
    tagline: "Build what you stand on.",
    quip: "Because “vibes” is not a positioning.",
    rank: "A",
    cat: "/images/cards/1.png",
    catAlt: "Gold cat sitting, head tilted",
  },
  {
    name: "Brand Communication",
    tagline: "Say it so people listen.",
    quip: "Talking is not the same as being heard.",
    rank: "K",
    cat: "/images/cards/2.png",
    catAlt: "Navy cat in a play-bow stretch",
  },
  {
    name: "Brand Growth",
    tagline: "Build the engine to scale.",
    quip: "Van Gogh sold one painting in his lifetime. Don’t be Van Gogh.",
    rank: "Q",
    cat: "/images/cards/3.png",
    catAlt: "Gold cat stretching forward",
  },
  {
    name: "Brand Experience",
    tagline: "Make people feel it.",
    quip: "Nobody ever fell in love with a PDF.",
    rank: "J",
    cat: "/images/cards/4.png",
    catAlt: "Gold cat mid-leap",
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

/** Scales its child down to fit the section height on short/wide viewports
 *  so the welcome stack never clips top or bottom. Width-bound too. */
function FitWelcome({ children }: { children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const boxEl = box.current;
    const innerEl = inner.current;
    if (!boxEl || !innerEl) return;

    const measure = () => {
      const availH = boxEl.clientHeight;
      const availW = boxEl.clientWidth;
      // `transform: scale` does not change layout size, so offset* is the
      // natural content box every time.
      const needH = innerEl.offsetHeight;
      const needW = innerEl.offsetWidth;
      if (!needH || !needW) return;
      setScale(Math.min(1, (availH * 0.94) / needH, (availW * 0.96) / needW));
    };

    const ro = new ResizeObserver(measure);
    ro.observe(boxEl);
    ro.observe(innerEl);
    measure();
    // Fonts settling can grow the stack after the first paint.
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={box} className="flex min-h-0 w-full flex-1 items-center justify-center">
      <div
        ref={inner}
        className="w-full origin-center will-change-transform"
        style={{ transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}

function Introduction() {
  return (
    <section
      id="introduction"
      className="relative z-10 flex h-screen w-full max-w-none flex-col px-5 py-[clamp(1rem,3.5vh,4rem)] sm:px-8 lg:px-12"
    >
      <FitWelcome>
        <IntroCard className="w-full" />
      </FitWelcome>
    </section>
  );
}

/* ── The Four Verticals ─────────────────────────────────────────────────── */
/* Pack 44 (Lusion cards): pin the stage, spread the stack, then flip each
 * card to the vertical. Faces are brand playing cards — navy backs, cream
 * ranks, and the four cats from /public/images/cards. */

const CARD_SPREAD_X = [14, 38, 62, 86];
const CARD_SPREAD_ROT = [-15, -7.5, 7.5, 15];

type VerticalCard = (typeof VERTICALS)[number];

/** Cream face — cat sits on the copy; copy clears the corner ranks. */
function VerticalCardFace({
  v,
  priority = false,
}: {
  v: VerticalCard;
  priority?: boolean;
}) {
  return (
    <div className="playing-card playing-card-face relative h-full w-full overflow-hidden">
      <div className="playing-card-frame flex flex-col">
        <div className="playing-card-corner absolute top-3 left-2.5 z-[2] sm:top-3.5 sm:left-3">
          <span className="playing-card-rank">{v.rank}</span>
          <Image
            src={v.cat}
            alt=""
            width={36}
            height={36}
            className="h-5 w-5 object-contain sm:h-6 sm:w-6"
            draggable={false}
          />
        </div>
        <div className="playing-card-corner absolute right-2.5 bottom-3 z-[2] rotate-180 sm:right-3 sm:bottom-3.5">
          <span className="playing-card-rank">{v.rank}</span>
          <Image
            src={v.cat}
            alt=""
            width={36}
            height={36}
            className="h-5 w-5 object-contain sm:h-6 sm:w-6"
            draggable={false}
          />
        </div>

        <div className="relative z-[1] flex min-h-0 flex-1 flex-col px-3.5 pt-12 sm:px-4 sm:pt-14">
          {/* items-end = cat rests on the text, no dead gap under the silhouette */}
          <div className="flex min-h-0 flex-1 items-end justify-center px-1 pb-0">
            <Image
              src={v.cat}
              alt={v.catAlt}
              width={360}
              height={360}
              className="h-auto max-h-full w-full object-contain object-bottom"
              draggable={false}
              priority={priority}
            />
          </div>
          {/* mb clears inverted corner (rank + icon + gap); px keeps long quips off it */}
          <div className="mt-1.5 mb-14 w-full shrink-0 px-2 text-center sm:mb-16 sm:px-2.5">
            <h3 className="font-sans text-[clamp(0.68rem,1.45vw,0.95rem)] font-bold uppercase leading-tight tracking-[0.14em] text-navy">
              {v.name}
            </h3>
            <p className="mt-1 font-sans text-[clamp(0.75rem,1.35vw,0.95rem)] font-medium leading-snug text-navy/85">
              {v.tagline}
            </p>
            <p className="mt-1 font-serif text-[0.68rem] font-light italic leading-snug text-navy/55 sm:text-[0.78rem]">
              {v.quip}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Verticals({
  railDriven = false,
  cardDriverRef,
}: {
  railDriven?: boolean;
  cardDriverRef?: MutableRefObject<((progress: number) => void) | null>;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tiltRefs = useRef<(HTMLDivElement | null)[]>([]);
  const ctaRef = useMagnetic<HTMLAnchorElement>({ strength: 0.35, radius: 100 });

  useGSAP(
    () => {
      const stage = stageRef.current;
      if (!stage) return;

      const mm = gsap.matchMedia();

      const flipToBack = (card: HTMLDivElement) => {
        const front = card.querySelector<HTMLElement>("[data-card-front]");
        const back = card.querySelector<HTMLElement>("[data-card-back]");
        if (front) front.style.transform = "rotateY(-180deg)";
        if (back) back.style.transform = "rotateY(0deg)";
      };

      const applyCardProgress = (progress: number) => {
        const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[];
        const tilts = tiltRefs.current.filter(Boolean) as HTMLDivElement[];
        if (cards.length !== VERTICALS.length) return;

        const spreadX = CARD_SPREAD_X;
        const spreadRot = CARD_SPREAD_ROT;

        const spreadT = Math.min(1, progress / (1 / 3));
        cards.forEach((card, index) => {
          const left = 50 + (spreadX[index] - 50) * spreadT;
          card.style.left = `${left}%`;
          const tilt = tilts[index];
          if (!tilt) return;
          const front = card.querySelector<HTMLElement>("[data-card-front]");
          const back = card.querySelector<HTMLElement>("[data-card-back]");
          if (!front || !back) return;

          const staggerOffset = index * 0.05;
          const startOffset = 1 / 3 + staggerOffset;
          const endOffset = 2 / 3 + staggerOffset;

          if (progress < startOffset) {
            front.style.transform = "rotateY(0deg)";
            back.style.transform = "rotateY(180deg)";
            gsap.set(tilt, { rotation: spreadRot[index] * spreadT });
            return;
          }
          if (progress > endOffset) {
            front.style.transform = "rotateY(-180deg)";
            back.style.transform = "rotateY(0deg)";
            gsap.set(tilt, { rotation: 0 });
            return;
          }
          const t = (progress - startOffset) / (1 / 3);
          front.style.transform = `rotateY(${-180 * t}deg)`;
          back.style.transform = `rotateY(${180 - 180 * t}deg)`;
          gsap.set(tilt, { rotation: spreadRot[index] * (1 - t) });
        });
      };

      // Desktop: pack flip scrub (Welcome rail drives progress when railDriven).
      mm.add(
        "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
        () => {
          const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[];
          const tilts = tiltRefs.current.filter(Boolean) as HTMLDivElement[];
          if (cards.length !== VERTICALS.length || tilts.length !== VERTICALS.length) return;

          if (railDriven) {
            applyCardProgress(0);
            if (cardDriverRef) cardDriverRef.current = applyCardProgress;
            return () => {
              if (cardDriverRef && cardDriverRef.current === applyCardProgress) {
                cardDriverRef.current = null;
              }
            };
          }

          const scrollLen = () => window.innerHeight * 3;

          ScrollTrigger.create({
            trigger: stage,
            start: "top top",
            end: () => `+=${scrollLen()}`,
            pin: true,
            pinSpacing: true,
          });

          cards.forEach((card, index) => {
            gsap.fromTo(
              card,
              { left: "50%" },
              {
                left: `${CARD_SPREAD_X[index]}%`,
                ease: "none",
                scrollTrigger: {
                  trigger: stage,
                  start: "top top",
                  end: () => `+=${window.innerHeight}`,
                  scrub: 0.5,
                },
              }
            );

            gsap.fromTo(
              tilts[index],
              { rotation: 0 },
              {
                rotation: CARD_SPREAD_ROT[index],
                ease: "none",
                scrollTrigger: {
                  trigger: stage,
                  start: "top top",
                  end: () => `+=${window.innerHeight}`,
                  scrub: 0.5,
                },
              }
            );
          });

          cards.forEach((card, index) => {
            const front = card.querySelector<HTMLElement>("[data-card-front]");
            const back = card.querySelector<HTMLElement>("[data-card-back]");
            const tilt = tilts[index];
            if (!front || !back || !tilt) return;

            const staggerOffset = index * 0.05;
            const startOffset = 1 / 3 + staggerOffset;
            const endOffset = 2 / 3 + staggerOffset;

            ScrollTrigger.create({
              trigger: stage,
              start: "top top",
              end: () => `+=${scrollLen()}`,
              scrub: 1,
              onUpdate: (self) => {
                const progress = self.progress;
                if (progress < startOffset) {
                  front.style.transform = "rotateY(0deg)";
                  back.style.transform = "rotateY(180deg)";
                  return;
                }
                if (progress > endOffset) {
                  front.style.transform = "rotateY(-180deg)";
                  back.style.transform = "rotateY(0deg)";
                  gsap.set(tilt, { rotation: 0 });
                  return;
                }

                const t = (progress - startOffset) / (1 / 3);
                front.style.transform = `rotateY(${-180 * t}deg)`;
                back.style.transform = `rotateY(${180 - 180 * t}deg)`;
                gsap.set(tilt, { rotation: CARD_SPREAD_ROT[index] * (1 - t) });
              },
            });
          });
        }
      );

      // Reduced motion (desktop): final fan, already flipped.
      mm.add(
        "(min-width: 768px) and (prefers-reduced-motion: reduce)",
        () => {
          const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[];
          const tilts = tiltRefs.current.filter(Boolean) as HTMLDivElement[];
          cards.forEach((card, index) => {
            gsap.set(card, { left: `${CARD_SPREAD_X[index]}%` });
            if (tilts[index]) gsap.set(tilts[index], { rotation: 0 });
            flipToBack(card);
          });
        }
      );

      return () => mm.revert();
    },
    { scope: sectionRef, dependencies: [railDriven] }
  );

  return (
    <section
      ref={sectionRef}
      className={`relative ${railDriven ? "h-full md:h-full" : ""}`}
    >
      <div
        ref={stageRef}
        className={`relative flex w-full flex-col overflow-hidden px-6 py-16 sm:px-10 sm:py-0 lg:px-16 ${
          railDriven ? "min-h-0 md:h-full md:min-h-0" : "md:min-h-screen md:h-screen"
        }`}
      >
        <div className="relative z-10 mx-auto w-full max-w-[1500px] shrink-0 text-center pt-2 sm:pt-[clamp(1rem,3vh,2.5rem)]">
          <p className="text-sm uppercase tracking-[0.35em] text-gold">The Four Verticals</p>
          <h2 className="mx-auto mt-5 max-w-[14ch] font-serif text-[clamp(2.25rem,5.2vw,4rem)] font-light leading-[1.12] tracking-[-0.01em] text-cream">
            Four verticals.{" "}
            <em className="font-bold not-italic text-gold sm:italic">One journey.</em>
          </h2>
        </div>

        {/* Mobile — static 2×2 grid, face up, no pack animation */}
        <div
          className="relative z-[1] mx-auto mt-8 grid w-full max-w-[440px] grid-cols-2 gap-3 md:hidden"
          aria-label="The four verticals"
        >
          {VERTICALS.map((v, i) => (
            <div key={v.name} className="aspect-[5/8] min-h-[260px] w-full">
              <VerticalCardFace v={v} priority={i === 0} />
            </div>
          ))}
        </div>

        {/* Desktop — pack flip stage */}
        <div
          className="relative z-[1] mx-auto mt-6 hidden min-h-0 w-full max-w-[720px] flex-1 md:pointer-events-none md:mt-0 md:block md:max-w-none"
          aria-label="The four verticals"
        >
          {VERTICALS.map((v, i) => (
            <div
              key={v.name}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="vertical-flip-card absolute top-1/2 left-1/2 aspect-auto h-[min(56vh,520px)] w-[min(19vw,268px)] [perspective:1000px] md:pointer-events-auto"
              style={{ zIndex: i + 1 }}
            >
              <div
                ref={(el) => {
                  tiltRefs.current[i] = el;
                }}
                className="h-full w-full"
              >
                <div
                  className="vertical-card-float absolute top-1/2 left-1/2 h-full w-full"
                  style={{ animationDelay: `${i * 0.2}s` }}
                >
                  <div className="relative h-full w-full [transform-style:preserve-3d]">
                    <div
                      data-card-front
                      className="playing-card playing-card-back absolute inset-0 [backface-visibility:hidden]"
                    >
                      <div className="playing-card-frame">
                        <div className="playing-card-back-pattern absolute inset-0" aria-hidden />
                        <div className="relative flex h-full items-center justify-center p-[12%]">
                          <Image
                            src={v.cat}
                            alt=""
                            width={220}
                            height={220}
                            className="h-auto max-h-[58%] w-[72%] object-contain opacity-90"
                            draggable={false}
                          />
                        </div>
                        <span className="pointer-events-none absolute inset-x-0 bottom-[9%] text-center font-sans text-[0.75rem] font-medium uppercase tracking-[0.35em] text-gold/70">
                          Adversado
                        </span>
                      </div>
                    </div>

                    <div
                      data-card-back
                      className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]"
                    >
                      <VerticalCardFace v={v} priority={i === 0} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="relative z-10 mx-auto mt-8 w-full max-w-[1500px] shrink-0 pb-6 text-center sm:mt-4 sm:pb-[clamp(1rem,2.5vh,2rem)]">
          <Link
            ref={ctaRef}
            href="/services"
            prefetch={false}
            className="group inline-flex min-h-11 items-center gap-3 text-sm uppercase tracking-[0.2em] text-gold"
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

function Invitation() {
  const ref = useDepthReveal<HTMLElement>();
  const movesRef = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
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
    <section
      ref={ref}
      className="relative min-h-screen overflow-hidden"
    >
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1500px] items-center px-6 py-20 sm:px-10 sm:py-24 lg:px-16">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16 xl:gap-20">
          <div
            className="max-w-3xl"
            style={{
              textShadow:
                "0 1px 2px rgba(8,14,28,0.55), 0 6px 28px rgba(8,14,28,0.45)",
            }}
          >
            <p className="mb-6 text-sm uppercase tracking-[0.35em] text-gold">The Invitation</p>

            <BoxReveal>
              <h2 className="font-serif text-[clamp(2.25rem,5.5vw,4.5rem)] font-light leading-[1.12] tracking-[-0.01em] text-cream">
                We’re not for everyone.{" "}
                <em className="font-bold not-italic text-gold sm:italic">That’s deliberate.</em>
              </h2>
            </BoxReveal>

            <p className="mt-8 max-w-[36ch] font-sans text-[clamp(1.1rem,1.9vw,1.4rem)] font-light leading-[1.75] text-cream/80">
              We work with <Magnify className="font-bold italic text-gold">ambitious</Magnify>{" "}
              brands ready to make{" "}
              <span className="rounded-[0.3em] bg-gold/18 px-[0.22em] py-[0.04em] font-bold text-gold [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
                bold moves.
              </span>
            </p>

            <p
              ref={movesRef}
              className="mt-10 flex flex-wrap items-baseline gap-x-5 gap-y-2 font-sans text-[clamp(1.2rem,2.8vw,2rem)] font-black uppercase leading-tight tracking-tight text-gold sm:gap-x-8"
            >
              {MOVES.map((move) => (
                <span key={move} data-move className="inline-block">
                  {move}
                </span>
              ))}
            </p>

            <p className="mt-10 max-w-[34ch] font-sans text-[clamp(1.1rem,1.9vw,1.4rem)] font-light leading-[1.75] text-cream/75">
              If you’re looking for{" "}
              <span className="font-semibold text-cream">a partner,</span>{" "}
              <span className="text-cream/45">not another agency,</span> we’d love to meet.
            </p>
          </div>

          <div className="relative z-20 flex w-full justify-start lg:justify-end">
            <InvitationContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomeSections() {
  const verticalsCardDriverRef = useRef<((progress: number) => void) | null>(null);

  return (
    <>
      {/* One camera move, one space. The scene is fixed behind the whole run
          of sections and the scrollbar is its dolly track; nothing above it
          paints a ground of its own, so there is no seam anywhere to read as
          the end of one page and the start of the next. */}
      {/* Two fixed layers under the copy: black ground, then the parallax
          constellations over it (sky + stars only). */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 bg-black" />
      <CinematicScene />
      {/* Clipped sideways: the tilted vertical cards swing their corners a few
          px past the viewport at the extremes of the effect, which is enough
          to put a horizontal scrollbar on the whole page. */}
      <div className="relative z-10 overflow-x-hidden">
        <BeliefSection />
        {/* Welcome → Verticals: vertical scroll drives a horizontal slide. */}
        <WelcomeVerticalsRail
          cardDriverRef={verticalsCardDriverRef}
          welcome={<Introduction />}
          verticals={
            <Verticals railDriven cardDriverRef={verticalsCardDriverRef} />
          }
        />
        <SlideBreaker />
        <SixDs />
        <Invitation />
      </div>
    </>
  );
}
