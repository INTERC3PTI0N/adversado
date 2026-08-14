"use client";

import { usePathname } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { SiteSplash } from "@/components/SiteSplash";
import { StickyLogo } from "@/components/StickyLogo";

/**
 * Sitewide chrome — wordmark, staggered menu, gold fluid cursor.
 *
 * Routes listed here own their own shell instead. `/projects` is the only one
 * so far: it is a standalone showcase with its own fixed chrome and its own
 * pointer treatment, and layering the site's gold fluid cursor and staggered
 * menu on top of that gives you two of everything.
 *
 * Gated here rather than by splitting the root layout into route groups —
 * multiple root layouts would mean duplicating `<html>`/`<body>` and would turn
 * every crossing between the two shells into a full document load.
 */
const STANDALONE = ["/projects"];

export function SiteChrome() {
  const pathname = usePathname();
  const standalone = STANDALONE.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (standalone) return null;

  return (
    <>
      <SiteSplash />
      <StickyLogo />
      <SiteNav />
    </>
  );
}
