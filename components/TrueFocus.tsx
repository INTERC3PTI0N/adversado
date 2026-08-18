import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "motion/react";

interface TrueFocusProps {
  sentence?: string;
  separator?: string;
  manualMode?: boolean;
  blurAmount?: number;
  borderColor?: string;
  glowColor?: string;
  animationDuration?: number;
  pauseBetweenAnimations?: number;
  wordClassName?: string;
  className?: string;
  /** Staircase indent per word (row stays horizontal). */
  layout?: "row" | "diagonal";
  /** Gold first letter, cream remainder. */
  highlightFirstLetter?: boolean;
  /** Diagonal step as ems of the word size. */
  indentEm?: number;
  /** Non-highlighted letters. */
  textColor?: string;
  /** First letter when `highlightFirstLetter` is set. */
  highlightColor?: string;
}

interface FocusRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const TrueFocus: React.FC<TrueFocusProps> = ({
  sentence = "True Focus",
  separator = " ",
  manualMode = false,
  blurAmount = 5,
  borderColor = "green",
  glowColor = "rgba(0, 255, 0, 0.6)",
  animationDuration = 0.5,
  pauseBetweenAnimations = 1,
  wordClassName = "text-[3rem] font-black",
  className = "",
  layout = "row",
  highlightFirstLetter = false,
  indentEm = 1.15,
  textColor = "var(--color-cream)",
  highlightColor = "var(--color-gold)",
}) => {
  const words = sentence.split(separator);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [focusRect, setFocusRect] = useState<FocusRect>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const syncFocusRect = () => {
    const parent = containerRef.current;
    const active = wordRefs.current[currentIndex];
    if (!parent || !active) return;
    const parentRect = parent.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    setFocusRect({
      x: activeRect.left - parentRect.left,
      y: activeRect.top - parentRect.top,
      width: activeRect.width,
      height: activeRect.height,
    });
  };

  useEffect(() => {
    // Auto-cycle when not in manual-only mode and not actively hovering.
    if (manualMode || hovered) return;
    const interval = setInterval(
      () => {
        setCurrentIndex((prev) => (prev + 1) % words.length);
      },
      (animationDuration + pauseBetweenAnimations) * 1000,
    );
    return () => clearInterval(interval);
  }, [
    manualMode,
    hovered,
    animationDuration,
    pauseBetweenAnimations,
    words.length,
  ]);

  useLayoutEffect(() => {
    syncFocusRect();
  }, [currentIndex, words.length, layout, wordClassName]);

  useEffect(() => {
    const onResize = () => syncFocusRect();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [currentIndex]);

  const handleMouseEnter = (index: number) => {
    setHovered(true);
    setCurrentIndex(index);
  };

  const handleMouseLeave = () => {
    setHovered(false);
  };

  const diagonal = layout === "diagonal";

  return (
    <div
      ref={containerRef}
      className={
        diagonal
          ? `relative inline-flex flex-col items-start ${className}`.trim()
          : `relative flex flex-wrap items-center justify-center gap-4 ${className}`.trim()
      }
      style={{ outline: "none", userSelect: "none" }}
    >
      {words.map((word, index) => {
        const isActive = index === currentIndex;
        return (
          <span
            key={`${word}-${index}`}
            ref={(el) => {
              wordRefs.current[index] = el;
            }}
            className={`relative cursor-pointer ${wordClassName}`}
            style={
              {
                marginLeft: diagonal ? `${index * indentEm}em` : undefined,
                filter: isActive ? "blur(0px)" : `blur(${blurAmount}px)`,
                transition: `filter ${animationDuration}s ease`,
                outline: "none",
                userSelect: "none",
              } as React.CSSProperties
            }
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
          >
            {highlightFirstLetter && word.length > 0 ? (
              <>
                <span style={{ color: highlightColor }}>{word[0]}</span>
                <span style={{ color: textColor }}>{word.slice(1)}</span>
              </>
            ) : (
              <span style={{ color: textColor }}>{word}</span>
            )}
          </span>
        );
      })}

      <motion.div
        className="pointer-events-none absolute top-0 left-0 box-border border-0"
        animate={{
          x: focusRect.x,
          y: focusRect.y,
          width: focusRect.width,
          height: focusRect.height,
          opacity: currentIndex >= 0 ? 1 : 0,
        }}
        transition={{
          duration: animationDuration,
        }}
        style={
          {
            "--border-color": borderColor,
            "--glow-color": glowColor,
          } as React.CSSProperties
        }
      >
        <span
          className="absolute top-[-10px] left-[-10px] h-4 w-4 rounded-[3px] border-[3px] border-r-0 border-b-0"
          style={{
            borderColor: "var(--border-color)",
            filter: "drop-shadow(0 0 4px var(--border-color))",
          }}
        />
        <span
          className="absolute top-[-10px] right-[-10px] h-4 w-4 rounded-[3px] border-[3px] border-l-0 border-b-0"
          style={{
            borderColor: "var(--border-color)",
            filter: "drop-shadow(0 0 4px var(--border-color))",
          }}
        />
        <span
          className="absolute bottom-[-10px] left-[-10px] h-4 w-4 rounded-[3px] border-[3px] border-r-0 border-t-0"
          style={{
            borderColor: "var(--border-color)",
            filter: "drop-shadow(0 0 4px var(--border-color))",
          }}
        />
        <span
          className="absolute right-[-10px] bottom-[-10px] h-4 w-4 rounded-[3px] border-[3px] border-l-0 border-t-0"
          style={{
            borderColor: "var(--border-color)",
            filter: "drop-shadow(0 0 4px var(--border-color))",
          }}
        />
      </motion.div>
    </div>
  );
};

export default TrueFocus;
