/**
 * The three arrows the Events page needs.
 *
 * The prototype pulled these from `lucide-react`. Three 24px paths do not earn
 * a dependency, and the site ships no icon library today — so they are drawn
 * here, with lucide's own stroke conventions so they sit right next to the
 * rest of the UI.
 */

type Props = { className?: string; size?: number };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export function ArrowRight({ className, size = 24 }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

export function ArrowLeft({ className, size = 24 }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

export function ArrowUpRight({ className, size = 24 }: Props) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M7 17 17 7M7 7h10v10" />
    </svg>
  );
}
