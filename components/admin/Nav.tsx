"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { UserRole } from "@/lib/supabase/types";

/**
 * Admin navigation.
 *
 * Every entry declares the minimum role that may see it. This mirrors the RLS
 * policies rather than replacing them — hiding a link is a courtesy, the
 * database is the boundary. A demoted user who bookmarked a URL is stopped by
 * the route guard and, failing that, by Postgres.
 */

/** `soon` marks a module that is specified but not yet built. Shown greyed and
    unclickable rather than omitted, so the shape of the finished admin is
    visible and a click never lands on a 404. */
type Item = { href: string; label: string; min: UserRole; soon?: boolean };
type Group = { heading: string; items: Item[] };

const GROUPS: Group[] = [
  {
    heading: "Overview",
    items: [{ href: "/admin", label: "Dashboard", min: "editor" }],
  },
  {
    heading: "Content",
    items: [
      { href: "/admin/content/pages", label: "Pages & sections", min: "editor" },
      { href: "/admin/content/blog", label: "Blog", min: "editor" },
      { href: "/admin/content/projects", label: "Portfolio", min: "editor" },
      { href: "/admin/content/case-studies", label: "Case studies", min: "editor" },
      { href: "/admin/content/services", label: "Services", min: "editor" },
      { href: "/admin/content/team", label: "Team", min: "editor" },
      { href: "/admin/content/testimonials", label: "Testimonials", min: "editor" },
      { href: "/admin/content/faqs", label: "FAQs", min: "editor" },
      { href: "/admin/media", label: "Media library", min: "editor" },
      { href: "/admin/seo", label: "SEO", min: "admin" },
    ],
  },
  {
    heading: "CRM",
    items: [
      { href: "/admin/crm/leads", label: "Leads", min: "admin" },
      { href: "/admin/crm/pipeline", label: "Pipeline", min: "admin" },
      { href: "/admin/crm/submissions", label: "Form entries", min: "admin" },
      { soon: true, href: "/admin/crm/invoices", label: "Invoices", min: "admin" },
    ],
  },
  {
    heading: "Delivery",
    items: [
      { soon: true, href: "/admin/pm", label: "Projects & tasks", min: "admin" },
      { soon: true, href: "/admin/bookings", label: "Bookings", min: "admin" },
      { soon: true, href: "/admin/clients", label: "Clients & portal", min: "admin" },
    ],
  },
  {
    heading: "System",
    items: [
      { href: "/admin/settings/users", label: "Users & roles", min: "super_admin" },
      { href: "/admin/settings/site", label: "Site settings", min: "admin" },
      { href: "/admin/audit", label: "Audit log", min: "admin" },
    ],
  },
];

const RANK: Record<UserRole, number> = {
  client: 0,
  editor: 1,
  admin: 2,
  super_admin: 3,
};

export function AdminNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const visible = GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => RANK[role] >= RANK[i.min]),
  })).filter((g) => g.items.length > 0);

  const nav = (
    <nav className="flex flex-col gap-7">
      {visible.map((group) => (
        <div key={group.heading}>
          <p className="px-4 font-sans text-[0.56rem] font-black uppercase tracking-[0.26em] text-cream/35">
            {group.heading}
          </p>
          <ul className="mt-3 flex flex-col">
            {group.items.map((item) => {
              // Exact match for /admin, prefix for everything else — otherwise
              // the dashboard link is active on every page in the section.
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              if (item.soon) {
                return (
                  <li key={item.href}>
                    <span className="flex items-center justify-between gap-2 border-l-[3px] border-transparent px-4 py-2 font-sans text-[0.82rem] font-bold text-cream/25">
                      {item.label}
                      <span className="font-sans text-[0.5rem] font-black uppercase tracking-[0.16em] text-cream/25">
                        Soon
                      </span>
                    </span>
                  </li>
                );
              }

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`block border-l-[3px] px-4 py-2 font-sans text-[0.82rem] font-bold transition-colors duration-150 ${
                      active
                        ? "border-gold bg-cream/10 text-gold"
                        : "border-transparent text-cream/65 hover:border-cream/30 hover:text-cream"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="fixed bottom-5 right-5 z-50 border-[3px] border-charcoal bg-gold px-5 py-3 font-sans text-[0.66rem] font-black uppercase tracking-[0.2em] text-charcoal shadow-[5px_5px_0_0_#212121] lg:hidden"
      >
        {open ? "Close" : "Menu"}
      </button>

      <aside className="hidden w-[248px] shrink-0 border-r-[3px] border-charcoal bg-navy py-8 lg:block">
        {nav}
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-navy py-24 lg:hidden">{nav}</div>
      ) : null}
    </>
  );
}
