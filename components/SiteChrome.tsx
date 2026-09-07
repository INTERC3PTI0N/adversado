"use client";

import { usePathname } from "next/navigation";
import { CursorField } from "@/components/CursorField";
import { SiteNav } from "@/components/SiteNav";
import { SiteSplash } from "@/components/SiteSplash";
import { StickyLogo } from "@/components/StickyLogo";

/**
 * Sitewide chrome — wordmark, staggered menu, gold fluid cursor.
 *
 * Every public route gets it. `/projects` used to opt out and run its own
 * fixed nav and pointer treatment, which made the menu on the one page people
 * browse longest look nothing like the menu everywhere else; that bespoke nav
 * and cursor are gone rather than layered.
 *
 * The admin and the client portal do opt out. They are working software, not
 * the marketing site: a fluid cursor and a full-screen staggered menu over a
 * dense table is noise, and the admin has navigation of its own.
 */
const APP_AREAS = ["/admin", "/portal"];

export function SiteChrome() {
  const pathname = usePathname();

  const isApp = APP_AREAS.some(
    (area) => pathname === area || pathname.startsWith(`${area}/`),
  );

  if (isApp) return null;

  return (
    <>
      <SiteSplash />
      <CursorField />
      <StickyLogo />
      <SiteNav />
    </>
  );
}
