"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

/**
 * Interactive accordion — numbered items, a plus that rotates to an X, and an
 * underline that draws in on hover.
 *
 * Written here rather than pulled from the registry: the 21st.dev entry the
 * brief named (`jatin-yadav05/interactive-accordion`) is behind an account and
 * `shadcn add` returns 403, so this is built to the same published spec.
 *
 * Motion is deliberately restrained — height and opacity on the panel, a
 * rotation on the icon, a scaleX on the rule. Everything is skipped under
 * `prefers-reduced-motion`, and the panel is a real disclosure (button +
 * aria-expanded + aria-controls) rather than a div that happens to open.
 */

export type AccordionItem = {
  question: string;
  answer: string;
};

const EASE = [0.22, 1, 0.36, 1] as const;

function Row({
  item,
  index,
  open,
  onToggle,
  panelId,
  buttonId,
}: {
  item: AccordionItem;
  index: number;
  open: boolean;
  onToggle: () => void;
  panelId: string;
  buttonId: string;
}) {
  return (
    <li className="group border-b border-cream/15">
      <h3>
        <button
          type="button"
          id={buttonId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="relative flex w-full items-start gap-6 py-7 text-left outline-none sm:gap-10 sm:py-9"
        >
          <span
            aria-hidden
            className={`mt-[0.45em] shrink-0 font-sans text-[0.68rem] font-semibold tabular-nums tracking-[0.24em] transition-colors duration-300 ${
              open ? "text-gold" : "text-cream/35 group-hover:text-gold/70"
            }`}
          >
            {String(index + 1).padStart(2, "0")}
          </span>

          <span
            className={`min-w-0 flex-1 font-sans text-[clamp(1.05rem,2.1vw,1.6rem)] font-light leading-[1.35] tracking-[-0.02em] transition-colors duration-300 ${
              open ? "text-gold" : "text-cream group-hover:text-cream"
            }`}
          >
            {item.question}
          </span>

          {/* Plus → X. One rotation, no bounce. */}
          <span
            aria-hidden
            className="relative mt-[0.35em] block h-4 w-4 shrink-0"
            style={{
              transform: open ? "rotate(135deg)" : "rotate(0deg)",
              transition: "transform 400ms cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            <span
              className={`absolute left-0 top-1/2 h-[2px] w-4 -translate-y-1/2 transition-colors duration-300 ${
                open ? "bg-gold" : "bg-cream/60 group-hover:bg-gold"
              }`}
            />
            <span
              className={`absolute left-1/2 top-0 h-4 w-[2px] -translate-x-1/2 transition-colors duration-300 ${
                open ? "bg-gold" : "bg-cream/60 group-hover:bg-gold"
              }`}
            />
          </span>

          {/* Progressive underline — draws from the left on hover and stays
              drawn while the row is open. */}
          <span
            aria-hidden
            className={`pointer-events-none absolute inset-x-0 bottom-[-1px] h-[2px] origin-left bg-gold transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
              open ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
            }`}
          />
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="panel"
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.42, ease: EASE }}
            className="overflow-hidden"
          >
            <p className="max-w-[68ch] pb-9 pl-0 pr-0 font-sans text-[clamp(0.95rem,1.3vw,1.08rem)] font-light leading-[1.85] text-cream/70 sm:pl-[calc(0.68rem+2.5rem)]">
              {item.answer}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </li>
  );
}

export function InteractiveAccordion({
  items,
  /** Index open on first paint, or `null` for all closed. */
  defaultOpen = 0,
}: {
  items: AccordionItem[];
  defaultOpen?: number | null;
}) {
  const uid = useId();
  const [open, setOpen] = useState<number | null>(defaultOpen);

  return (
    <ul className="w-full border-t border-cream/15">
      {items.map((item, i) => (
        <Row
          key={item.question}
          item={item}
          index={i}
          open={open === i}
          onToggle={() => setOpen(open === i ? null : i)}
          buttonId={`${uid}-b${i}`}
          panelId={`${uid}-p${i}`}
        />
      ))}
    </ul>
  );
}
