"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring, type MotionValue } from "motion/react";
import { EV } from "./palette";

/* The five moves of the job, in order. Stock imagery throughout — each frame
   is a placeholder for the studio's own coverage of that stage. */
const METRICS = [
  {
    value: "01",
    prefix: "[1]",
    left: "DEFINE",
    right: "We start with what the event actually has to achieve.",
    image:
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop",
  },
  {
    value: "02",
    prefix: "[2]",
    left: "DESIGN",
    right: "Then the room and the guest journey are drawn around it.",
    image:
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2071&auto=format&fit=crop",
  },
  {
    value: "03",
    prefix: "[3]",
    left: "BUILD",
    right: "It goes into our own workshop, not out to a supplier.",
    image:
      "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=2070&auto=format&fit=crop",
  },
  {
    value: "04",
    prefix: "[4]",
    left: "RUN",
    right: "We run the show on the day, floor to backstage.",
    image:
      "https://images.unsplash.com/photo-1531058020387-3be344556be6?q=80&w=2070&auto=format&fit=crop",
  },
  {
    value: "05",
    prefix: "[5]",
    left: "AMPLIFY",
    right: "Then we film it, place it and get it seen.",
    image:
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=2069&auto=format&fit=crop",
  },
];

const N = METRICS.length;

/* Each row owns its own hooks. The prototype called `useTransform` inside a
   `.map()` in the parent, which happens to work while the array length is
   fixed but is a rules-of-hooks violation and fails the lint gate on build. */

function useProximity(scrollYProgress: MotionValue<number>, index: number) {
  const center = index / (N - 1);
  const spread = 1 / (N - 1);
  return useTransform(scrollYProgress, (v) => (v - center) / spread);
}

function MetricLine({
  scrollYProgress,
  index,
  prefix,
  label,
}: {
  scrollYProgress: MotionValue<number>;
  index: number;
  prefix: string;
  label: string;
}) {
  const offset = useProximity(scrollYProgress, index);
  const opacity = useTransform(offset, (o) => Math.max(0.2, 1 - Math.abs(o) * 1.5));

  return (
    <motion.div
      style={{ opacity, color: EV.navy }}
      className="flex items-center gap-3 text-xs font-bold md:text-sm lg:text-base"
    >
      <span className="opacity-40">{prefix}</span>
      <span className="tracking-wider">{label}</span>
    </motion.div>
  );
}

function MetricInsight({
  scrollYProgress,
  index,
  text,
}: {
  scrollYProgress: MotionValue<number>;
  index: number;
  text: string;
}) {
  const offset = useProximity(scrollYProgress, index);
  const opacity = useTransform(offset, (o) => Math.max(0.2, 1 - Math.abs(o) * 1.5));

  return (
    <motion.div
      style={{ opacity, color: EV.navy }}
      className="text-xs font-medium leading-snug md:text-sm lg:text-base"
    >
      {text}
    </motion.div>
  );
}

function MetricImage({
  scrollYProgress,
  index,
  src,
}: {
  scrollYProgress: MotionValue<number>;
  index: number;
  src: string;
}) {
  const offset = useProximity(scrollYProgress, index);
  const opacity = useTransform(offset, (o) => {
    const abs = Math.abs(o);
    return abs >= 1 ? 0 : 1 - abs;
  });
  const scale = useTransform(offset, (o) => (o < 0 ? 1 + Math.abs(o) * 0.25 : 1 + o * 0.05));

  return (
    <motion.img
      src={src}
      alt=""
      className="absolute inset-0 h-full w-full object-cover"
      style={{ opacity, scale, transformOrigin: "center center" }}
    />
  );
}

/**
 * 04 — Process. Five steps on a sticky stage. The numbers translate a viewport per item;
 * the image frame snaps between +8° and −8° on a spring while the numbers
 * inside counter-rotate, so they stay on the page's axis while the frame tilts.
 */
export function ProcessSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const yTranslate = useTransform(scrollYProgress, [0, 1], ["0vh", `-${(N - 1) * 100}vh`]);

  const rawContainerRotate = useTransform(scrollYProgress, (v): number => {
    const activeIndex = Math.round(v * (N - 1));
    return activeIndex % 2 === 0 ? 8 : -8;
  });
  const containerRotate = useSpring(rawContainerRotate, {
    stiffness: 300,
    damping: 15,
    mass: 1,
  });

  const rawInnerRotate = useTransform(scrollYProgress, (v): number => {
    const activeIndex = Math.round(v * (N - 1));
    return activeIndex % 2 === 0 ? -8 : 8;
  });
  const innerRotate = useSpring(rawInnerRotate, { stiffness: 300, damping: 15, mass: 1 });

  return (
    <div
      ref={containerRef}
      data-nav-light
      className="relative"
      style={{ height: `${N * 100}vh`, background: EV.bone }}
    >
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-12 z-30 -translate-x-1/2">
          <span
            className="font-sans text-lg font-bold tracking-wide md:text-xl"
            style={{ color: EV.navy }}
          >
            From vision to buzz.
          </span>
        </div>

        {/* Cream numbers behind the frame, on the page axis */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-[100vh] w-[100vw] -translate-x-1/2 -translate-y-1/2">
          <motion.div style={{ y: yTranslate }} className="flex h-full w-full flex-col">
            {METRICS.map((m) => (
              <div
                key={m.value}
                className="flex h-full w-full flex-shrink-0 items-center justify-center"
              >
                <span className="select-none text-center font-sans text-[clamp(3rem,10vw,9rem)] font-[900] leading-none tracking-[-0.05em] text-cream">
                  {m.value}
                </span>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="pointer-events-none absolute left-6 top-1/2 z-30 flex -translate-y-1/2 flex-col font-sans uppercase tracking-wide md:left-12 lg:left-24">
          <div
            className="mb-6 flex items-center text-xs font-bold md:mb-8 md:text-sm lg:text-base"
            style={{ color: EV.navy }}
          >
            <div className="mr-3 h-2.5 w-2.5 shrink-0" style={{ background: EV.navy }} />
            04 — PROCESS
          </div>
          <div className="flex flex-col gap-4 md:gap-5">
            {METRICS.map((m, i) => (
              <MetricLine
                key={m.value}
                scrollYProgress={scrollYProgress}
                index={i}
                prefix={m.prefix}
                label={m.left}
              />
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute right-6 top-1/2 z-30 flex max-w-[260px] -translate-y-1/2 flex-col items-end font-sans tracking-wide md:right-12 md:max-w-[320px] lg:right-24 lg:max-w-[380px]">
          <div
            className="mb-6 flex items-center self-end text-xs font-bold uppercase md:mb-8 md:text-sm lg:text-base"
            style={{ color: EV.navy }}
          >
            <div className="mr-3 h-2.5 w-2.5 shrink-0" style={{ background: EV.navy }} />
            HOW IT RUNS
          </div>
          <div className="flex flex-col items-end gap-4 text-right md:gap-5">
            {METRICS.map((m, i) => (
              <MetricInsight
                key={m.value}
                scrollYProgress={scrollYProgress}
                index={i}
                text={m.right}
              />
            ))}
          </div>
        </div>

        <motion.div
          style={{ rotate: containerRotate }}
          className="relative z-20 aspect-[4/3] w-[45vw] max-w-[600px] p-2 md:aspect-[1.5] md:p-3"
        >
          <div
            className="absolute left-0 top-0 h-4 w-4 border-l-[1.5px] border-t-[1.5px] md:h-6 md:w-6"
            style={{ borderColor: EV.navy }}
          />
          <div
            className="absolute right-0 top-0 h-4 w-4 border-r-[1.5px] border-t-[1.5px] md:h-6 md:w-6"
            style={{ borderColor: EV.navy }}
          />
          <div
            className="absolute bottom-0 left-0 h-4 w-4 border-b-[1.5px] border-l-[1.5px] md:h-6 md:w-6"
            style={{ borderColor: EV.navy }}
          />
          <div
            className="absolute bottom-0 right-0 h-4 w-4 border-b-[1.5px] border-r-[1.5px] md:h-6 md:w-6"
            style={{ borderColor: EV.navy }}
          />

          <div
            className="relative h-full w-full overflow-hidden"
            style={{ background: EV.bone }}
          >
            {METRICS.map((m, i) => (
              <MetricImage
                key={m.value}
                scrollYProgress={scrollYProgress}
                index={i}
                src={m.image}
              />
            ))}

            {/* Gold numbers inside the frame, counter-rotated back to axis */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[100vh] w-[100vw] -translate-x-1/2 -translate-y-1/2">
              <motion.div style={{ rotate: innerRotate }} className="absolute inset-0 h-full w-full origin-center">
                <motion.div style={{ y: yTranslate }} className="flex h-full w-full flex-col">
                  {METRICS.map((m) => (
                    <div
                      key={m.value}
                      className="flex h-full w-full flex-shrink-0 items-center justify-center"
                    >
                      <span
                        className="select-none text-center font-sans text-[clamp(3rem,10vw,9rem)] font-[900] leading-none tracking-[-0.05em]"
                        style={{ color: EV.gold }}
                      >
                        {m.value}
                      </span>
                    </div>
                  ))}
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
