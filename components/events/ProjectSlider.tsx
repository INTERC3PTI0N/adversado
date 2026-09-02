"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ProjectImageReveal } from "./ProjectImageReveal";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "./icons";
import { EV } from "./palette";

gsap.registerPlugin(ScrollTrigger);

type Project = {
  id: number;
  isIntro?: boolean;
  headline: string;
  title: string;
  category: string;
  location: string;
  description: string;
  image: string;
};

const PROJECTS: Project[] = [
  {
    id: 0,
    isIntro: true,
    headline: "currently curating",
    title:
      "discover what is coming up next and secure your spot for our upcoming experiences.",
    category: "",
    location: "",
    description: "",
    image:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2064&auto=format&fit=crop",
  },
  {
    id: 1,
    headline: "Neon Nights",
    title: "Music Festival 2026: An immersive audio-visual symphony.",
    category: "Festivals",
    location: "Ibiza",
    description:
      "40,000 attendees. 5 interconnected stages. A multi-sensory journey blending electronic music with cutting-edge holographic light shows.",
    image:
      "https://images.unsplash.com/photo-1557787163-1635e2efb160?q=80&w=2072&auto=format&fit=crop",
  },
  {
    id: 2,
    headline: "Global Tech",
    title: "Summit X: Defining the future of artificial intelligence.",
    category: "Summits",
    location: "Tokyo",
    description:
      "5,000 industry leaders. Interactive AI showcases, deeply engaging keynote environments, and VIP networking lounges.",
    image:
      "https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: 3,
    headline: "The Midnight",
    title: "Gala: Exclusive networking in a bespoke architectural wonder.",
    category: "Galas",
    location: "New York",
    description:
      "An exclusive invite-only corporate gala. Breathtaking spatial design, curated culinary experiences, and elite entertainment.",
    image:
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop",
  },
  {
    id: 4,
    headline: "Apex Founders",
    title: "Retreat: Strategy and wellness colliding in the Swiss Alps.",
    category: "Retreats",
    location: "Zermatt",
    description:
      "An immersive 3-day executive retreat for global founders. Alpine luxury, deep-focus strategy sessions, and curated wellness.",
    image:
      "https://images.unsplash.com/photo-1491555103944-7c647fd857e6?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: 5,
    headline: "Lumina Art",
    title: "Biennale: A multi-sensory exhibition pushing creative boundaries.",
    category: "Exhibitions",
    location: "Paris",
    description:
      "Transforming historic venues into futuristic digital art landscapes. A fusion of physical architecture and digital projection mapping.",
    image:
      "https://images.unsplash.com/photo-1505909182942-e2f09aee3e89?q=80&w=2072&auto=format&fit=crop",
  },
];

export function ProjectSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(0);
  const isTransitioning = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);

  /* Entrance is scoped to this section's own elements — a bare
     '.slider-content-el' selector would reach into any other instance on the
     page, and GSAP would happily animate all of them. */
  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;

    const els = root.querySelectorAll(".slider-content-el");
    gsap.set(els, { y: 40, opacity: 0 });

    const st = ScrollTrigger.create({
      trigger: root,
      start: "top 60%",
      once: true,
      onEnter: () => {
        gsap.to(els, {
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.08,
          ease: "power3.out",
          delay: 0.5,
        });
      },
    });

    return () => st.kill();
  }, []);

  const triggerTransition = (nextIndex: number) => {
    const root = contentRef.current;
    if (!root || isTransitioning.current) return;
    isTransitioning.current = true;

    const els = root.querySelectorAll(".slider-content-el");

    gsap.to(els, {
      y: -30,
      opacity: 0,
      duration: 0.4,
      stagger: 0.04,
      ease: "power2.in",
      onComplete: () => {
        setCurrentIndex(nextIndex);
        setDisplayIndex(nextIndex);

        // Waits out the 1.2s image wipe before the new copy arrives.
        gsap.fromTo(
          root.querySelectorAll(".slider-content-el"),
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.08,
            delay: 1.0,
            ease: "power3.out",
            onComplete: () => {
              isTransitioning.current = false;
            },
          },
        );
      },
    });
  };

  const handleNext = () => triggerTransition((currentIndex + 1) % PROJECTS.length);
  const handlePrev = () =>
    triggerTransition((currentIndex - 1 + PROJECTS.length) % PROJECTS.length);

  const project = PROJECTS[displayIndex];
  const projectImages = PROJECTS.map((p) => p.image);
  const intro = Boolean(project.isIntro);

  return (
    <div
      /* Intro slide is a light spread; the rest are dark. The chrome follows. */
      {...(intro ? { "data-nav-light": true } : {})}
      className="relative z-40 flex h-screen w-full flex-col overflow-hidden"
      style={{ background: EV.navy }}
    >
      <ProjectImageReveal images={projectImages} currentIndex={currentIndex} />

      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-1000 ${
          intro ? "opacity-0" : "bg-black/40 opacity-100"
        }`}
      />
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-1000 ${
          intro ? "opacity-0" : "opacity-100"
        }`}
        style={{
          background: `linear-gradient(to top, ${EV.navy}cc, ${EV.navy}1a 40%, transparent)`,
        }}
      />

      {/* Light spread behind the intro slide */}
      <div
        className={`pointer-events-none absolute inset-0 z-[55] overflow-hidden transition-opacity duration-1000 ${
          intro ? "opacity-100" : "opacity-0"
        }`}
        style={{ background: EV.bone }}
      >
        <div className="absolute right-[-5%] top-[40%] w-[80vw] max-w-[800px] -translate-y-[50%] -rotate-2 overflow-hidden rounded-[2rem] border border-charcoal/10 bg-charcoal/[0.04] opacity-90 shadow-[0_20px_60px_rgba(0,0,0,0.06)] md:right-[2%] md:top-[45%] md:w-[48vw] md:rounded-[2.5rem] lg:right-[5%] lg:w-[42vw]">
          <div className="aspect-[4/3] w-full">
            <video
              src="https://www.pexels.com/download/video/31792078/"
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>

      <div
        ref={contentRef}
        className={`pointer-events-none relative z-[60] flex h-full flex-col justify-between px-6 pt-8 md:px-12 md:pt-12 ${
          intro ? "pb-0" : "pb-8 md:pb-12"
        }`}
      >
        <div className="h-20 md:h-24" />

        <div className="pointer-events-auto mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-center">
          {!intro && (
            <div className="overflow-hidden">
              <p
                className="slider-content-el mb-6 flex items-center gap-4 font-sans text-xs font-bold uppercase tracking-[0.3em] md:text-sm"
                style={{ color: EV.gold }}
              >
                <span className="h-[1px] w-8" style={{ background: EV.gold }} />
                Featured Events
              </p>
            </div>
          )}

          {intro ? (
            <div className="flex h-full w-full flex-col justify-between pb-0 pt-4 md:pt-8">
              <div className="mt-0 flex w-full flex-col items-start justify-between gap-12 md:-mt-12 md:flex-row md:gap-8">
                <h2
                  className="slider-content-el relative z-10 max-w-[90%] font-sans text-3xl font-light leading-[1.1] tracking-tight sm:text-4xl md:max-w-[48%] md:text-[3vw] lg:max-w-[45%] lg:text-[3.2vw] xl:text-[3.5vw]"
                  style={{ letterSpacing: "-0.03em", color: EV.navy }}
                >
                  the brand speaks to your senses
                  <br />
                  before your eyes read the text
                  <sup className="relative -top-[0.5em] text-2xl md:text-4xl">®</sup>
                </h2>
              </div>

              <button
                type="button"
                onClick={handleNext}
                aria-label="View the first event"
                className="slider-content-el pointer-events-auto group relative mt-12 w-full cursor-pointer text-left md:mt-auto"
              >
                <div
                  className="relative flex h-16 w-full items-center overflow-hidden border-t transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-x-1 group-hover:-translate-y-1.5 group-hover:shadow-[4px_6px_0px_rgba(31,53,94,0.5)] md:h-20"
                  style={{ background: EV.gold, borderColor: EV.gold }}
                >
                  <div className="pointer-events-none absolute inset-0 flex items-center whitespace-nowrap">
                    <motion.div
                      animate={{ x: ["0%", "-50%"] }}
                      transition={{ ease: "linear", duration: 15, repeat: Infinity }}
                      className="flex items-center gap-12 font-sans text-sm font-bold uppercase tracking-[0.2em] md:text-base"
                      style={{ color: EV.navy }}
                    >
                      {[...Array(10)].map((_, i) => (
                        <span key={i} className="flex items-center">
                          ENTER THE ARCHIVE <span className="mx-6 opacity-30">✦</span> VIEW
                          SELECTED WORKS <span className="mx-6 opacity-30">✦</span> INITIATE
                          SEQUENCE <span className="mx-6 opacity-30">✦</span>
                        </span>
                      ))}
                    </motion.div>
                  </div>

                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 flex justify-between px-1">
                    {[...Array(80)].map((_, i) => (
                      <div key={i} className="h-1.5 w-[1px]" style={{ background: `${EV.navy}26` }} />
                    ))}
                  </div>

                  <div
                    className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-48 md:w-64"
                    style={{
                      background: `linear-gradient(to left, ${EV.gold}, ${EV.gold}, transparent)`,
                    }}
                  />
                  <div
                    className="pointer-events-none absolute right-6 top-1/2 z-20 -translate-y-1/2"
                    style={{ color: EV.navy }}
                  >
                    <svg
                      className="h-6 w-6 transition-transform duration-300 group-hover:scale-110 md:h-8 md:w-8"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="square"
                      strokeLinejoin="miter"
                      aria-hidden
                    >
                      <path d="M6 17l5-5-5-5M13 17l5-5-5-5" />
                    </svg>
                  </div>
                </div>
              </button>
            </div>
          ) : (
            <h2
              className="slider-content-el mb-8 max-w-4xl font-sans text-4xl font-light leading-[1.05] tracking-tight text-cream sm:text-5xl md:text-6xl lg:text-[5rem]"
              style={{ letterSpacing: "-0.02em" }}
            >
              <span className="mr-3 font-medium" style={{ color: EV.gold }}>
                {project.headline}
              </span>
              {project.title}
            </h2>
          )}

          {!intro && (
            <div className="mt-8 flex flex-wrap items-center gap-8 font-sans text-sm font-light text-cream/90 md:text-base">
              <div className="slider-content-el flex items-center gap-3 rounded-full border border-cream/20 bg-cream/5 px-6 py-2 backdrop-blur-sm">
                <span className="font-medium">{project.category}</span>
                <span className="h-1 w-1 rounded-full" style={{ background: EV.gold }} />
                <span className="text-cream/80">{project.location}</span>
              </div>
              <div className="slider-content-el flex gap-3">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous event"
                  className="group relative flex h-12 w-12 items-center justify-center overflow-hidden border border-cream/20 bg-cream/5 text-cream backdrop-blur-sm transition-all duration-500 hover:border-cream/50"
                >
                  <div className="absolute inset-0 translate-y-[101%] border-t border-cream/40 bg-cream/20 backdrop-blur-md transition-transform duration-500 ease-out group-hover:translate-y-0" />
                  <ArrowLeft
                    size={18}
                    className="relative z-10 transition-transform duration-500 group-hover:-translate-x-1"
                  />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next event"
                  className="group relative flex h-12 w-12 items-center justify-center overflow-hidden border border-cream/20 bg-cream/5 text-cream backdrop-blur-sm transition-all duration-500 hover:border-cream/50"
                >
                  <div className="absolute inset-0 translate-y-[101%] border-t border-cream/40 bg-cream/20 backdrop-blur-md transition-transform duration-500 ease-out group-hover:translate-y-0" />
                  <ArrowRight
                    size={18}
                    className="relative z-10 transition-transform duration-500 group-hover:translate-x-1"
                  />
                </button>
              </div>
            </div>
          )}
        </div>

        {!intro && (
          <div className="pointer-events-auto mt-12 flex min-h-[64px] w-full flex-col items-start justify-between gap-8 border-t border-cream/10 pb-4 pt-8 md:flex-row md:items-end">
            <button
              type="button"
              className="slider-content-el group relative overflow-hidden border border-cream/20 bg-cream/5 px-8 py-4 font-sans text-xs font-bold uppercase tracking-[0.15em] text-cream backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:border-cream/50"
            >
              <div className="absolute inset-0 translate-y-[101%] border-t border-cream/40 bg-cream/20 backdrop-blur-md transition-transform duration-500 ease-out group-hover:translate-y-0" />
              <span className="relative z-10 flex items-center gap-3 transition-colors duration-500">
                EXPLORE EVENTS
                <ArrowUpRight
                  size={16}
                  className="transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1"
                />
              </span>
            </button>
            <div className="slider-content-el max-w-md text-left md:text-right">
              <p className="font-sans text-sm font-light leading-relaxed text-cream/70">
                {project.description}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
