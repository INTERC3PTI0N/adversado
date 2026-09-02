"use client";

import { useEffect } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
} from "motion/react";
import { EV } from "./palette";

const WORD = "ADVERSADO".split("");

/**
 * Hero ground: the wordmark set enormous along the bottom edge, with a navy
 * plate clipped into a V that tracks the pointer. Where the plate covers the
 * word it reads gold; where it doesn't, the word is a bone ghost on bone.
 *
 * The clip is a five-point polygon whose top and bottom anchors sit a constant
 * 15vw either side of the pointer's X, so the boundary bends into a sharp V at
 * exactly the pointer's Y.
 */
export function Background() {
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const smoothX = useSpring(mouseX, { damping: 45, stiffness: 400, mass: 0.4 });
  const smoothY = useSpring(mouseY, { damping: 45, stiffness: 400, mass: 0.4 });

  const topX = useTransform(smoothX, (x) => x * 100 + 15);
  const bottomX = useTransform(smoothX, (x) => x * 100 - 15);
  const mouseXPct = useTransform(smoothX, (x) => x * 100);
  const mouseYPct = useTransform(smoothY, (y) => y * 100);

  const clipPath = useMotionTemplate`polygon(100% 0%, 100% 100%, ${bottomX}% 100%, ${mouseXPct}% ${mouseYPct}%, ${topX}% 0%)`;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth);
      mouseY.set(e.clientY / window.innerHeight);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        mouseX.set(e.touches[0].clientX / window.innerWidth);
        mouseY.set(e.touches[0].clientY / window.innerHeight);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [mouseX, mouseY]);

  const word = (color: string, delay: number) => (
    <div className="absolute bottom-[2%] left-0 flex h-full w-full flex-col justify-end">
      <div className="relative flex w-full justify-center overflow-hidden pb-4 text-center">
        {WORD.map((char, i) => (
          <motion.span
            key={i}
            initial={{ y: "100%", opacity: 0, rotate: 10 }}
            animate={{ y: "0%", opacity: 1, rotate: 0 }}
            transition={{
              duration: 2,
              delay: delay + i * 0.05,
              ease: [0.25, 1, 0.35, 1],
            }}
            className="inline-block origin-bottom-left select-none font-sans text-[17vw] font-black leading-[0.75] tracking-tighter"
            style={{ color }}
          >
            {char}
          </motion.span>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <div className="absolute inset-0 z-0" style={{ background: EV.bone }} />

      <div className="pointer-events-none absolute inset-0 z-[1]">
        {word(EV.ghost, 0.5)}
      </div>

      <motion.div
        style={{ clipPath, background: EV.navy }}
        className="pointer-events-none absolute inset-0 z-[2]"
      >
        {word(EV.gold, 0.7)}
      </motion.div>
    </>
  );
}
