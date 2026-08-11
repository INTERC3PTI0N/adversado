"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

export type ExpandOnHoverItem = {
  title: string;
  description: string;
};

export type ExpandOnHoverListProps = {
  items: ExpandOnHoverItem[];
  className?: string;
};

/**
 * Numbered list that expands a row on hover/focus to reveal its description.
 * Inactive rows dim. No images — frosted glass panel for legibility over active grounds.
 */
export function ExpandOnHoverList({
  items,
  className = "",
}: ExpandOnHoverListProps) {
  const [active, setActive] = useState<number | null>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const duration = reduced ? 0 : 0.42;

  return (
    <ul
      className={`overflow-hidden bg-[#120f17]/45 py-3 backdrop-blur-2xl backdrop-saturate-150 sm:py-5 ${className}`.trim()}
      onMouseLeave={() => setActive(null)}
    >
      {items.map((item, i) => {
        const open = active === i;
        const dimmed = active !== null && !open;
        const n = String(i + 1).padStart(2, "0");

        return (
          <li key={item.title}>
            <button
              type="button"
              className="group flex w-full cursor-pointer flex-col px-6 py-6 text-left outline-none transition-[opacity,filter] duration-300 focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-[#120f17] sm:px-9 sm:py-8"
              style={{
                opacity: dimmed ? 0.35 : 1,
                filter: dimmed ? "blur(0.6px)" : "none",
              }}
              aria-expanded={open}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(open ? null : i)}
            >
              <span className="flex w-full items-center gap-5 sm:gap-7">
                <span
                  className="shrink-0 font-sans text-[clamp(1.35rem,2.4vw,1.85rem)] font-light tabular-nums tracking-tight text-cream/35 transition-colors duration-300 group-hover:text-gold/70"
                  aria-hidden
                >
                  {n}
                </span>
                <span className="min-w-0 flex-1 font-sans text-[clamp(1.05rem,2vw,1.35rem)] font-bold uppercase tracking-[0.08em] text-cream">
                  {item.title}
                </span>
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center bg-cream/8 text-cream/70 transition-[background-color,color,transform] duration-300 group-hover:bg-gold/15 group-hover:text-gold"
                  aria-hidden
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    className={`transition-transform duration-300 ${open ? "rotate-90" : ""}`}
                  >
                    <path
                      d="M5 2.5 9.5 7 5 11.5"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="square"
                      strokeLinejoin="miter"
                    />
                  </svg>
                </span>
              </span>

              <AnimatePresence initial={false}>
                {open ? (
                  <motion.span
                    key="body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{
                      height: {
                        duration,
                        ease: [0.22, 1, 0.36, 1],
                      },
                      opacity: {
                        duration: duration * 0.75,
                        ease: "easeOut",
                      },
                    }}
                    className="block overflow-hidden"
                  >
                    <span className="mt-5 block max-w-2xl pl-[calc(clamp(1.35rem,2.4vw,1.85rem)+1.25rem)] font-sans text-[clamp(1rem,1.55vw,1.15rem)] font-light leading-[1.75] text-cream/70 sm:mt-6 sm:pl-[calc(clamp(1.35rem,2.4vw,1.85rem)+1.75rem)]">
                      {item.description}
                    </span>
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default ExpandOnHoverList;
