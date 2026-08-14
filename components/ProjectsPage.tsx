"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  RingSpiralGallery,
  type GalleryItem,
  type GalleryMode,
} from "@/components/RingSpiralGallery";
import { ProjectsPreloader } from "@/components/ProjectsPreloader";

/**
 * Projects — k95.it's works page, rebuilt on brand.
 *
 * The reference is a full-viewport scene with no scrolling document: fixed glass
 * chrome, a Rings/Spiral segmented switch, filter pills carrying counts, a
 * cursor-following label, and a footer whose only graphic move is the wordmark
 * at full width. Its palette is two colours — one saturated field, one
 * off-white — so this uses the book's navy as the field and its off-white as
 * the ink, with gold kept for state.
 *
 * The one architectural departure: k95 drives its 3D with a scroll it has
 * swallowed, which costs it a scrollbar and any hope of a sane reading order.
 * Here the coil lives in a tall section with a sticky stage, so scroll still
 * behaves like scroll (and Lenis, the nav and the footer all keep working)
 * while the gallery gets its travel.
 */

const PROJECTS: GalleryItem[] = [
  { src: "/mockups/1.png", client: "Velvet Threads", title: "Monogram & wax seal", category: "Identity" },
  { src: "/mockups/2.png", client: "Velvet Threads", title: "Invitation suite", category: "Print" },
  { src: "/mockups/3.png", client: "Velvet Threads", title: "Retail collateral", category: "Identity" },
  { src: "/mockups/4.png", client: "Velvet Threads", title: "Keepsake packaging", category: "Packaging" },
  { src: "/mockups/5.png", client: "Velvet Threads", title: "Client journal", category: "Packaging" },
  { src: "/mockups/6.png", client: "AgeWell", title: "Aura — transit shelter", category: "Advertising" },
  { src: "/mockups/7.png", client: "AgeWell", title: "Aura — digital screen", category: "Advertising" },
  { src: "/mockups/8.png", client: "AgeWell", title: "Aura — pack in context", category: "Packaging" },
  { src: "/mockups/9.png", client: "AgeWell", title: "Tandem — facade billboard", category: "Advertising" },
  { src: "/mockups/10.png", client: "AISA", title: "Course brochure", category: "Print" },
  { src: "/mockups/11.png", client: "AISA", title: "Website", category: "Web" },
  { src: "/mockups/12.png", client: "AISA", title: "Identity & stationery", category: "Identity" },
  { src: "/mockups/13.png", client: "AISA", title: "Responsive build", category: "Web" },
  { src: "/mockups/14.png", client: "AISA", title: "Prospectus", category: "Print" },
  { src: "/mockups/15.png", client: "Dynamic Constructions", title: "Pickleball Classic", category: "Events" },
  { src: "/mockups/16.png", client: "Dr. Susan Koruthu", title: "Practice website", category: "Web" },
  { src: "/mockups/17.png", client: "Dcube Salon", title: "Poster series", category: "Advertising" },
  { src: "/mockups/18.png", client: "Dcube Salon", title: "Social system", category: "Social" },
];

const CATEGORIES = ["All", "Identity", "Advertising", "Web", "Packaging", "Print", "Events", "Social"] as const;

const NAVY = "#1f355e";

/* ── Glass chrome ───────────────────────────────────────────────────────── */

/** k95's reusable segmented switch: a pill that slides under the active half. */
function ModeSwitch({
  mode,
  onChange,
}: {
  mode: GalleryMode;
  onChange: (m: GalleryMode) => void;
}) {
  return (
    <div className="relative flex rounded-full border border-cream/20 bg-cream/10 p-[5px] backdrop-blur-[12px]">
      <span
        aria-hidden
        className="absolute inset-y-[5px] left-[5px] rounded-full bg-cream transition-transform duration-[420ms]"
        style={{
          width: "calc(50% - 7px)",
          transform: mode === "spiral" ? "translateX(calc(100% + 4px))" : "translateX(0)",
          transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />
      {(["ring", "spiral"] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          aria-pressed={mode === m}
          className="relative z-10 min-w-[86px] rounded-full px-4 py-[7px] font-sans text-[0.68rem] font-semibold uppercase tracking-[0.18em] transition-colors duration-300"
          style={{ color: mode === m ? NAVY : "rgba(249,247,242,0.75)" }}
        >
          {m === "ring" ? "Ring" : "Spiral"}
        </button>
      ))}
    </div>
  );
}

/** Filter pill with a dot and a superscript count. */
function FilterPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="group flex items-center gap-2 rounded-full border px-3.5 py-[6px] font-sans text-[0.66rem] font-semibold uppercase tracking-[0.16em] backdrop-blur-[10px] transition-colors duration-300"
      style={{
        borderColor: active ? "#e6b325" : "rgba(249,247,242,0.2)",
        backgroundColor: active ? "rgba(230,179,37,0.14)" : "rgba(249,247,242,0.06)",
        color: active ? "#e6b325" : "rgba(249,247,242,0.7)",
      }}
    >
      <span
        aria-hidden
        className="h-[5px] w-[5px] rounded-full transition-colors duration-300"
        style={{ backgroundColor: active ? "#e6b325" : "rgba(249,247,242,0.35)" }}
      />
      {label}
      <sup className="font-normal opacity-60">{count}</sup>
    </button>
  );
}

/**
 * k95's pointer treatment: a small difference-blend dot that swells over
 * anything interactive, trailed by a glass label while a card is hovered.
 *
 * The native cursor is hidden while this is mounted — that's what `data-
 * projects-cursor` on the document element switches on — so the swap is gated
 * on actually having a hover-capable pointer, and undone on unmount.
 */
function ProjectsCursor({ item }: { item: GalleryItem | null }) {
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const aim = useRef({ x: -100, y: -100 });
  const cur = useRef({ x: -100, y: -100 });
  const [enabled, setEnabled] = useState(false);
  const [over, setOver] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    setEnabled(true);
    document.documentElement.dataset.projectsCursor = "true";

    let raf = 0;
    const tick = () => {
      cur.current.x += (aim.current.x - cur.current.x) * 0.16;
      cur.current.y += (aim.current.y - cur.current.y) * 0.16;
      const t = `translate3d(${cur.current.x}px, ${cur.current.y}px, 0)`;
      if (dotRef.current) dotRef.current.style.transform = `${t} translate(-50%, -50%)`;
      if (labelRef.current) labelRef.current.style.transform = `${t} translate(20px, 20px)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onMove = (e: PointerEvent) => {
      aim.current.x = e.clientX;
      aim.current.y = e.clientY;
      const el = e.target as Element | null;
      setOver(Boolean(el?.closest?.("a, button, [data-hover]")));
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      delete document.documentElement.dataset.projectsCursor;
    };
  }, []);

  if (!enabled) return null;

  const big = over || Boolean(item);

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[62] rounded-full transition-[width,height,background-color,border-color] duration-300"
        style={{
          width: big ? 44 : 15,
          height: big ? 44 : 15,
          backgroundColor: big ? "transparent" : "#f9f7f2",
          border: big ? "1px solid #f9f7f2" : "1px solid transparent",
          mixBlendMode: "difference",
        }}
      />
      <div
        ref={labelRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[61] rounded-full border border-cream/20 bg-cream/10 px-4 py-2 backdrop-blur-[14px] transition-opacity duration-300"
        style={{ opacity: item ? 1 : 0 }}
      >
        <p className="whitespace-nowrap font-sans text-[0.7rem] font-semibold text-cream">
          {item?.title ?? ""}
        </p>
        <p className="whitespace-nowrap font-sans text-[0.6rem] uppercase tracking-[0.16em] text-cream/60">
          {item?.client ?? ""}
        </p>
      </div>
    </>
  );
}

/** This page's own nav, since it opts out of the sitewide chrome. */
function ProjectsNav() {
  const links = [
    { href: "/", label: "Home" },
    { href: "/services", label: "Services" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <nav className="pointer-events-none fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-6 sm:px-10 lg:px-14 lg:py-8">
      <Link
        href="/"
        aria-label="Adversado — home"
        className="pointer-events-auto block w-32 sm:w-40"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="Adversado" className="w-full" />
      </Link>

      <div className="pointer-events-auto flex items-center gap-6 sm:gap-9 lg:gap-12">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="font-sans text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-cream/65 transition-colors duration-300 hover:text-gold"
          >
            {l.label}
          </Link>
        ))}
        <span
          aria-current="page"
          className="flex items-center gap-2 font-sans text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-cream"
        >
          <span aria-hidden className="h-[6px] w-[6px] rounded-full bg-gold" />
          Projects
        </span>
      </div>
    </nav>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export function ProjectsPage() {
  const [booted, setBooted] = useState(false);
  const [loaderGone, setLoaderGone] = useState(false);
  const [mode, setMode] = useState<GalleryMode>("spiral");
  const [filter, setFilter] = useState<(typeof CATEGORIES)[number]>("All");
  const [hovered, setHovered] = useState<GalleryItem | null>(null);
  const [active, setActive] = useState(0);

  const sectionRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);

  const counts = useMemo(() => {
    const map: Record<string, number> = { All: PROJECTS.length };
    for (const p of PROJECTS) map[p.category] = (map[p.category] ?? 0) + 1;
    return map;
  }, []);

  const items = useMemo(
    () => (filter === "All" ? PROJECTS : PROJECTS.filter((p) => p.category === filter)),
    [filter],
  );

  const clientCount = useMemo(
    () => new Set(PROJECTS.map((p) => p.client)).size,
    [],
  );

  /* Scroll progress through the gallery's own section. Written to a ref so the
     coil can read it every frame without re-rendering this tree. */
  useEffect(() => {
    let raf = 0;
    const read = () => {
      const el = sectionRef.current;
      if (el) {
        const r = el.getBoundingClientRect();
        const travel = r.height - window.innerHeight;
        progressRef.current =
          travel > 0 ? Math.min(1, Math.max(0, -r.top / travel)) : 0;
      }
      raf = requestAnimationFrame(read);
    };
    raf = requestAnimationFrame(read);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onActiveChange = useCallback((i: number) => setActive(i), []);
  const onHover = useCallback((i: GalleryItem | null) => setHovered(i), []);

  const activeItem = items[Math.min(active, items.length - 1)];

  return (
    <div className="relative min-h-screen" style={{ backgroundColor: NAVY }}>
      {!loaderGone && (
        <ProjectsPreloader
          onReveal={() => setBooted(true)}
          onDone={() => setLoaderGone(true)}
        />
      )}

      <ProjectsCursor item={hovered} />
      <ProjectsNav />

      {/* Edge fades — the reference uses these to keep the coil from colliding
          with the chrome at the top and bottom of the frame. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-30 h-[18vh]"
        style={{ background: `linear-gradient(180deg, ${NAVY} 0%, transparent 100%)` }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 h-[20vh]"
        style={{ background: `linear-gradient(0deg, ${NAVY} 0%, transparent 100%)` }}
      />

      {/* ── Fixed chrome ─────────────────────────────────────────────────── */}
      <div
        className="pointer-events-none fixed left-0 top-0 z-40 px-6 pt-24 sm:px-10 lg:px-14 lg:pt-28"
        style={{ opacity: booted ? 1 : 0, transition: "opacity 700ms ease" }}
      >
        <h1 className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-cream">
          Selected Works
        </h1>
        <p className="mt-1 font-sans text-[0.66rem] uppercase tracking-[0.18em] text-cream/50">
          {clientCount} clients · {PROJECTS.length} pieces
        </p>
      </div>

      {/* Bottom chrome: filters left, arrangement centre, readout right —
          the reference's layout, and it keeps the middle of the frame clear
          for the coil itself. */}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex flex-col gap-4 px-6 pb-6 sm:px-10 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-end lg:gap-10 lg:px-14 lg:pb-8"
        style={{ opacity: booted ? 1 : 0, transition: "opacity 700ms ease 200ms" }}
      >
        {/* Filters take whatever width is left and wrap upward, so a long list
            can never push the arrangement switch or the readout off-axis. */}
        <div className="pointer-events-auto order-2 flex flex-wrap gap-2 lg:order-none">
          {CATEGORIES.map((c) => (
            <FilterPill
              key={c}
              label={c}
              count={counts[c] ?? 0}
              active={filter === c}
              onClick={() => setFilter(c)}
            />
          ))}
        </div>

        {/* Live readout of whichever card currently owns the front of the
            coil — the persistent counterpart to the cursor label. */}
        <div className="order-3 min-w-0 lg:order-none lg:text-right">
          <p className="truncate font-sans text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-cream">
            {activeItem?.client ?? ""}
          </p>
          <p className="truncate font-sans text-[0.62rem] uppercase tracking-[0.16em] text-gold/80">
            {activeItem?.title ?? ""}
          </p>
        </div>

        <div className="pointer-events-auto order-1 flex flex-col items-center gap-2 lg:order-none lg:items-end">
          <ModeSwitch mode={mode} onChange={setMode} />
          <p className="font-sans text-[0.6rem] uppercase tracking-[0.18em] text-cream/40">
            Scroll or drag to spin
          </p>
        </div>
      </div>

      {/* ── The coil ─────────────────────────────────────────────────────── */}
      <div ref={sectionRef} className="relative h-[460vh]">
        <div className="sticky top-0 z-10 h-screen overflow-hidden">
          <RingSpiralGallery
            items={items}
            mode={mode}
            progressRef={progressRef}
            onActiveChange={onActiveChange}
            onHover={onHover}
          />
        </div>
      </div>

      {/* ── Footer. The wordmark at full width is the only graphic move. ─── */}
      <footer className="relative z-20 px-6 pb-10 pt-16 sm:px-10 lg:px-14">
        <div className="mx-auto max-w-[1600px]">
          <div className="grid gap-8 border-t border-cream/15 pt-10 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <p className="font-serif text-[clamp(1.1rem,2vw,1.5rem)] font-light italic text-cream">
                The work carries our clients&apos; names.
              </p>
              <p className="mt-2 max-w-[42ch] font-serif text-[clamp(1.1rem,2vw,1.5rem)] font-light italic text-gold">
                The thinking behind it carries ours.
              </p>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-3 font-sans text-[0.66rem] font-semibold uppercase tracking-[0.2em] sm:justify-end">
              <Link href="/services" className="text-cream/55 transition-colors hover:text-gold">
                Services
              </Link>
              <Link href="/about" className="text-cream/55 transition-colors hover:text-gold">
                About
              </Link>
              <Link href="/contact#audit" className="text-gold transition-colors hover:text-cream">
                Start with an audit
              </Link>
            </div>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt="Adversado"
            className="mt-12 w-full opacity-90"
          />

          <div className="mt-8 flex flex-wrap items-baseline justify-between gap-4 font-sans text-[0.62rem] uppercase tracking-[0.2em] text-cream/40">
            <span>Brand &amp; digital studio · Kochi, India</span>
            <span>© {new Date().getFullYear()} Adversado</span>
          </div>
        </div>
      </footer>

      {/* Crawlable index of the same set. The coil is transforms and rAF, which
          is exactly the kind of thing a crawler sees nothing in. */}
      <ul className="sr-only">
        {PROJECTS.map((p) => (
          <li key={p.src}>
            {p.client} — {p.title} ({p.category})
          </li>
        ))}
      </ul>
    </div>
  );
}
