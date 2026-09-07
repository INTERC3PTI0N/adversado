import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Admin UI kit.
 *
 * The public site's neobrutalist idiom, applied to dense working screens: hard
 * 3px charcoal borders, flat offset shadows with no blur, no rounded corners,
 * and only the book's five colours. Tables get hard rules rather than zebra
 * striping — stripes read as decoration at this density, rules read as
 * structure.
 */

/* ── Surfaces ────────────────────────────────────────────────────────────── */

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`border-[3px] border-charcoal bg-cream shadow-[6px_6px_0_0_#212121] ${className}`}
    >
      {children}
    </div>
  );
}

export function PanelHeader({
  title,
  action,
  hint,
}: {
  title: string;
  action?: ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b-[3px] border-charcoal px-5 py-4">
      <div>
        <h2 className="font-sans text-[0.72rem] font-black uppercase tracking-[0.24em] text-charcoal">
          {title}
        </h2>
        {hint ? (
          <p className="mt-1 font-sans text-[0.78rem] font-medium text-charcoal/60">
            {hint}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function PageHeading({
  eyebrow,
  title,
  action,
  description,
}: {
  /** ReactNode so a breadcrumb link can sit here, not just a word. */
  eyebrow?: ReactNode;
  title: string;
  action?: ReactNode;
  description?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
      <div>
        {eyebrow ? (
          <p className="font-sans text-[0.62rem] font-black uppercase tracking-[0.28em] text-charcoal/45">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 font-sans text-[clamp(1.6rem,3vw,2.4rem)] font-black uppercase leading-[1.05] tracking-[-0.02em] text-charcoal">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-[60ch] font-sans text-[0.92rem] font-medium leading-[1.6] text-charcoal/65">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

/* ── Actions ─────────────────────────────────────────────────────────────── */

const BTN_BASE =
  "inline-flex items-center justify-center gap-3 border-[3px] border-charcoal px-5 py-2.5 font-sans text-[0.68rem] font-black uppercase tracking-[0.2em] transition-[transform,box-shadow] duration-150 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none";

const BTN_TONE = {
  primary: "bg-gold text-charcoal shadow-[4px_4px_0_0_#212121]",
  secondary: "bg-cream text-charcoal shadow-[4px_4px_0_0_#212121]",
  dark: "bg-charcoal text-gold shadow-[4px_4px_0_0_#e6b325]",
  danger: "bg-[#c8322a] text-cream shadow-[4px_4px_0_0_#212121]",
} as const;

const BTN_LIFT =
  "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_0_#212121] disabled:hover:translate-x-0 disabled:hover:translate-y-0";

export type ButtonTone = keyof typeof BTN_TONE;

export function Button({
  children,
  tone = "primary",
  type = "button",
  disabled,
  onClick,
  className = "",
  name,
  value,
}: {
  children: ReactNode;
  tone?: ButtonTone;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  name?: string;
  value?: string;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      name={name}
      value={value}
      className={`${BTN_BASE} ${BTN_TONE[tone]} ${BTN_LIFT} ${className}`}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  children,
  tone = "primary",
  className = "",
}: {
  href: string;
  children: ReactNode;
  tone?: ButtonTone;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`${BTN_BASE} ${BTN_TONE[tone]} ${BTN_LIFT} ${className}`}
    >
      {children}
    </Link>
  );
}

/* ── Status ──────────────────────────────────────────────────────────────── */

const STATUS_TONE: Record<string, string> = {
  published: "bg-charcoal text-gold",
  draft: "bg-cream text-charcoal",
  in_review: "bg-gold text-charcoal",
  scheduled: "bg-navy text-cream",
  archived: "bg-charcoal/15 text-charcoal/70",

  new: "bg-gold text-charcoal",
  contacted: "bg-cream text-charcoal",
  qualified: "bg-navy text-cream",
  proposal: "bg-navy text-cream",
  negotiation: "bg-navy text-cream",
  won: "bg-charcoal text-gold",
  lost: "bg-charcoal/15 text-charcoal/70",

  paid: "bg-charcoal text-gold",
  sent: "bg-navy text-cream",
  partial: "bg-gold text-charcoal",
  overdue: "bg-[#c8322a] text-cream",
  void: "bg-charcoal/15 text-charcoal/70",

  urgent: "bg-[#c8322a] text-cream",
  high: "bg-gold text-charcoal",
  normal: "bg-cream text-charcoal",
  low: "bg-charcoal/10 text-charcoal/60",
};

export function Badge({
  children,
  tone,
  className = "",
}: {
  children: ReactNode;
  tone?: string;
  className?: string;
}) {
  const style = (tone && STATUS_TONE[tone]) || "bg-cream text-charcoal";
  return (
    <span
      className={`inline-block whitespace-nowrap border-2 border-charcoal px-2 py-0.5 font-sans text-[0.58rem] font-black uppercase tracking-[0.16em] ${style} ${className}`}
    >
      {children}
    </span>
  );
}

/** Human label for an enum value — `in_review` reads badly in a badge. */
export function label(value: string): string {
  return value.replace(/_/g, " ");
}

/* ── Data display ────────────────────────────────────────────────────────── */

export function Stat({
  label: statLabel,
  value,
  hint,
  tone = "cream",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "cream" | "gold" | "navy" | "charcoal";
}) {
  const tones = {
    cream: "bg-cream text-charcoal",
    gold: "bg-gold text-charcoal",
    navy: "bg-navy text-cream",
    charcoal: "bg-charcoal text-gold",
  } as const;

  return (
    <div
      className={`border-[3px] border-charcoal p-5 shadow-[5px_5px_0_0_#212121] ${tones[tone]}`}
    >
      <p className="font-sans text-[0.6rem] font-black uppercase tracking-[0.24em] opacity-70">
        {statLabel}
      </p>
      <p className="mt-3 font-sans text-[clamp(1.6rem,3.4vw,2.4rem)] font-black leading-none tracking-[-0.03em] tabular-nums">
        {value}
      </p>
      {hint ? (
        <p className="mt-2 font-sans text-[0.72rem] font-medium opacity-65">{hint}</p>
      ) : null}
    </div>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">{children}</table>
    </div>
  );
}

export function Th({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <th
      className={`border-b-[3px] border-charcoal px-4 py-3 font-sans text-[0.58rem] font-black uppercase tracking-[0.2em] text-charcoal/70 ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <td
      className={`border-b border-charcoal/15 px-4 py-3 font-sans text-[0.86rem] font-medium text-charcoal ${className}`}
    >
      {children}
    </td>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="border-[3px] border-dashed border-charcoal/40 px-6 py-16 text-center">
      <p className="font-sans text-[1.05rem] font-black uppercase tracking-[-0.01em] text-charcoal">
        {title}
      </p>
      <p className="mx-auto mt-3 max-w-[46ch] font-sans text-[0.9rem] font-medium leading-[1.6] text-charcoal/60">
        {body}
      </p>
      {action ? <div className="mt-7 flex justify-center">{action}</div> : null}
    </div>
  );
}

/* ── Forms ───────────────────────────────────────────────────────────────── */

export const INPUT_CLASS =
  "w-full border-[3px] border-charcoal bg-cream px-4 py-2.5 font-sans text-[0.9rem] font-medium text-charcoal outline-none transition-[box-shadow,transform] duration-150 focus:-translate-x-0.5 focus:-translate-y-0.5 focus:shadow-[5px_5px_0_0_#212121] focus-visible:outline-none";

export function Field({
  label: fieldLabel,
  help,
  children,
  required,
}: {
  label: string;
  help?: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="font-sans text-[0.62rem] font-black uppercase tracking-[0.2em] text-charcoal">
        {fieldLabel}
        {required ? <span className="ml-1 text-[#c8322a]">*</span> : null}
      </span>
      <div className="mt-2">{children}</div>
      {help ? (
        <span className="mt-2 block font-sans text-[0.76rem] font-medium leading-[1.5] text-charcoal/55">
          {help}
        </span>
      ) : null}
    </label>
  );
}

export function Alert({
  tone = "info",
  children,
}: {
  tone?: "info" | "error" | "success";
  children: ReactNode;
}) {
  const tones = {
    info: "bg-cream text-charcoal",
    error: "bg-[#c8322a] text-cream",
    success: "bg-charcoal text-gold",
  } as const;

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`border-[3px] border-charcoal px-4 py-3 font-sans text-[0.86rem] font-bold leading-relaxed ${tones[tone]}`}
    >
      {children}
    </div>
  );
}

/* ── Pagination ──────────────────────────────────────────────────────────── */

/**
 * Page controls for a list screen.
 *
 * Takes the current search params so the active filters survive the jump —
 * paging out of a filtered view and landing in an unfiltered one is the bug
 * this exists to avoid.
 */
export function Pagination({
  basePath,
  page,
  pages,
  total,
  noun = "row",
  plural,
  params = {},
}: {
  basePath: string;
  page: number;
  pages: number;
  total: number;
  noun?: string;
  /** Only needed when adding "s" is wrong — "entry" / "entries". */
  plural?: string;
  params?: Record<string, string | undefined>;
}) {
  if (pages <= 1) return null;

  const href = (n: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    sp.set("page", String(n));
    return `${basePath}?${sp}`;
  };

  return (
    <div className="flex items-center justify-between gap-4 border-t-[3px] border-charcoal px-5 py-4">
      <span className="font-sans text-[0.76rem] font-bold text-charcoal/60">
        Page {page} of {pages} · {total}{" "}
        {total === 1 ? noun : plural ?? `${noun}s`}
      </span>
      <div className="flex gap-3">
        {page > 1 ? (
          <ButtonLink tone="secondary" href={href(page - 1)}>
            Previous
          </ButtonLink>
        ) : null}
        {page < pages ? (
          <ButtonLink tone="secondary" href={href(page + 1)}>
            Next
          </ButtonLink>
        ) : null}
      </div>
    </div>
  );
}
