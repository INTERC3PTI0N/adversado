"use client";

import { useState, useEffect } from "react";
import { motion, useTransform, type MotionValue } from "motion/react";
import BorderGlow from "./BorderGlow";
import { EV } from "./palette";

function useWindowSize() {
  const [size, setSize] = useState({ width: 1200, height: 800 });
  useEffect(() => {
    function updateSize() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, []);
  return size;
}

/** Four cuts, each with its own wipe: curtain, angled slide, vertical curtain,
 *  iris. Driven off a looping playhead, independent of scroll. */
const CUTS = [
  {
    src: "https://videos.pexels.com/video-files/7269763/7269763-hd_1920_1080_25fps.mp4",
    label: "Vibrant Energy",
    veils: [EV.navy, EV.gold],
  },
  {
    src: "https://videos.pexels.com/video-files/5003647/5003647-hd_1920_1080_30fps.mp4",
    label: "Behind the Scenes",
    veils: [EV.navy, EV.cream],
  },
  {
    src: "https://videos.pexels.com/video-files/4774631/4774631-hd_1920_1080_25fps.mp4",
    label: "Unforgettable Nights",
    veils: [EV.gold, EV.navy],
  },
  {
    src: "https://videos.pexels.com/video-files/7271364/7271364-hd_1920_1080_25fps.mp4",
    label: "Shared Moments",
    veils: [EV.cream, EV.gold],
  },
] as const;

export function ShowreelCard({
  progress,
  scrollProgress,
  onHover,
  onLeave,
}: {
  progress: MotionValue<number>;
  scrollProgress: MotionValue<number>;
  onHover: () => void;
  onLeave: () => void;
}) {
  const win = useWindowSize();

  /* Pixel values rather than "100vw" strings, so the size interpolates
     smoothly instead of snapping at the unit boundary. */
  const initialWidth = Math.min(520, win.width * 0.9);
  const initialHeight = Math.min(320, win.height * 0.6);

  const width = useTransform(
    scrollProgress,
    [0, 0.3, 0.7, 0.9],
    [initialWidth, win.width, win.width, win.width * 0.9],
  );
  const height = useTransform(
    scrollProgress,
    [0, 0.3, 0.7, 0.9],
    [initialHeight, win.height, win.height, win.height * 0.9],
  );
  const borderRadius = useTransform(scrollProgress, [0, 0.3, 0.7, 0.9], [32, 0, 0, 32]);
  const rotate = useTransform(scrollProgress, [0, 0.3, 0.7], [-2, 0, 0]);

  const glowOpacity = useTransform(scrollProgress, [0, 0.15], [1, 0]);
  const ringOpacity = useTransform(scrollProgress, [0, 0.15], [1, 0]);

  // Intro logo card
  const op1 = useTransform(progress, [0, 0.05, 0.85, 0.9], [1, 0, 0, 1]);
  const scene2Clip = useTransform(
    progress,
    [0.04, 0.08],
    [
      "polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)",
      "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
    ],
  );
  const op2 = useTransform(progress, [0.03, 0.04, 0.14, 0.18], [0, 1, 1, 0]);

  // Cut 1 — horizontal curtain from centre
  const vid1Clip = useTransform(progress, [0.14, 0.18], ["inset(0% 50% 0% 50%)", "inset(0% 0% 0% 0%)"]);
  const vid1VeilA = useTransform(progress, [0.12, 0.16], ["inset(0% 50% 0% 50%)", "inset(0% 0% 0% 0%)"]);
  const vid1VeilB = useTransform(progress, [0.13, 0.17], ["inset(0% 50% 0% 50%)", "inset(0% 0% 0% 0%)"]);
  const vid1 = useTransform(progress, [0.11, 0.12, 0.35, 0.4], [0, 1, 1, 0]);
  const text1Y = useTransform(progress, [0.16, 0.2], [40, 0]);
  const text1Opacity = useTransform(progress, [0.16, 0.19], [0, 1]);

  // Cut 2 — angled slide
  const clipShapeStart = "polygon(0% 0%, 0% 0%, -20% 100%, 0% 100%)";
  const clipShapeEnd = "polygon(0% 0%, 120% 0%, 100% 100%, 0% 100%)";
  const vid2Clip = useTransform(progress, [0.35, 0.4], [clipShapeStart, clipShapeEnd]);
  const vid2VeilA = useTransform(progress, [0.33, 0.38], [clipShapeStart, clipShapeEnd]);
  const vid2VeilB = useTransform(progress, [0.34, 0.39], [clipShapeStart, clipShapeEnd]);
  const vid2 = useTransform(progress, [0.32, 0.33, 0.55, 0.6], [0, 1, 1, 0]);
  const text2Y = useTransform(progress, [0.38, 0.42], [40, 0]);
  const text2Opacity = useTransform(progress, [0.38, 0.41], [0, 1]);

  // Cut 3 — vertical curtain
  const vid3Clip = useTransform(progress, [0.55, 0.6], ["inset(50% 0% 50% 0%)", "inset(0% 0% 0% 0%)"]);
  const vid3VeilA = useTransform(progress, [0.53, 0.58], ["inset(50% 0% 50% 0%)", "inset(0% 0% 0% 0%)"]);
  const vid3VeilB = useTransform(progress, [0.54, 0.59], ["inset(50% 0% 50% 0%)", "inset(0% 0% 0% 0%)"]);
  const vid3 = useTransform(progress, [0.52, 0.53, 0.75, 0.8], [0, 1, 1, 0]);
  const text3Y = useTransform(progress, [0.58, 0.62], [40, 0]);
  const text3Opacity = useTransform(progress, [0.58, 0.61], [0, 1]);

  // Cut 4 — iris
  const vid4Clip = useTransform(progress, [0.74, 0.78], ["circle(0% at 50% 50%)", "circle(150% at 50% 50%)"]);
  const vid4VeilA = useTransform(progress, [0.72, 0.76], ["circle(0% at 50% 50%)", "circle(150% at 50% 50%)"]);
  const vid4VeilB = useTransform(progress, [0.73, 0.77], ["circle(0% at 50% 50%)", "circle(150% at 50% 50%)"]);
  const vid4 = useTransform(progress, [0.71, 0.72, 0.85, 0.9], [0, 1, 1, 0]);
  const text4Y = useTransform(progress, [0.77, 0.81], [40, 0]);
  const text4Opacity = useTransform(progress, [0.77, 0.8], [0, 1]);

  const cuts = [
    { o: vid1, clip: vid1Clip, a: vid1VeilA, b: vid1VeilB, y: text1Y, to: text1Opacity },
    { o: vid2, clip: vid2Clip, a: vid2VeilA, b: vid2VeilB, y: text2Y, to: text2Opacity },
    { o: vid3, clip: vid3Clip, a: vid3VeilA, b: vid3VeilB, y: text3Y, to: text3Opacity },
    { o: vid4, clip: vid4Clip, a: vid4VeilA, b: vid4VeilB, y: text4Y, to: text4Opacity },
  ];

  return (
    <motion.div
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{ width, height, rotate }}
      className="pointer-events-auto relative flex max-w-[100vw] origin-center items-center justify-center shadow-2xl"
    >
      <motion.div
        style={{ opacity: glowOpacity }}
        className="pointer-events-none absolute inset-0 z-0"
      >
        <BorderGlow
          glowColor="40 80 80"
          backgroundColor="transparent"
          borderRadius={32}
          glowRadius={150}
          glowIntensity={1.0}
          animated
          colors={[EV.navy, EV.gold, EV.cream]}
          className="h-full w-full"
        >
          <div className="h-full w-full" />
        </BorderGlow>
      </motion.div>

      <motion.div
        style={{ borderRadius, background: EV.ink }}
        className="relative z-10 h-full w-full overflow-hidden"
      >
        <motion.div
          style={{ opacity: ringOpacity, borderRadius }}
          className="pointer-events-none absolute inset-0 z-20 ring-[1px] ring-cream/40"
        />

        {/* Scene 1 — wordmark */}
        <motion.div
          style={{ opacity: op1, background: EV.ink }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <span
            className="font-sans text-[2.5rem] font-black uppercase tracking-widest"
            style={{ color: EV.gold }}
          >
            Adversado
          </span>
        </motion.div>

        {/* Scene 2 — the line */}
        <motion.div
          style={{ opacity: op2, clipPath: scene2Clip, background: EV.gold }}
          className="absolute inset-0 flex items-center justify-center p-8 text-center"
        >
          <span
            className="font-sans text-3xl font-black uppercase leading-tight tracking-tight"
            style={{ color: EV.charcoal }}
          >
            Where experiences
            <br />
            take centre stage
          </span>
        </motion.div>

        {/* The four cuts */}
        {CUTS.map((cut, i) => {
          const m = cuts[i];
          return (
            <motion.div key={cut.src} style={{ opacity: m.o }} className="absolute inset-0">
              <motion.div
                style={{ clipPath: m.a, background: cut.veils[0] }}
                className="absolute inset-0"
              />
              <motion.div
                style={{ clipPath: m.b, background: cut.veils[1] }}
                className="absolute inset-0"
              />
              <motion.div style={{ clipPath: m.clip }} className="absolute inset-0">
                <video
                  onCanPlay={(e) => {
                    e.currentTarget.playbackRate = 2;
                  }}
                  src={cut.src}
                  className="h-full w-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
                <div className="absolute inset-0 bg-black/30" />
              </motion.div>
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                <motion.span
                  style={{ y: m.y, opacity: m.to }}
                  className="origin-center font-sans text-4xl font-bold tracking-tight text-cream drop-shadow-md"
                >
                  {cut.label}
                </motion.span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
