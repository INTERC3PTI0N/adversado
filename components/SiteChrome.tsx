"use client";

import { CursorField } from "@/components/CursorField";
import { SiteNav } from "@/components/SiteNav";
import { SiteSplash } from "@/components/SiteSplash";
import { StickyLogo } from "@/components/StickyLogo";

/**
 * Sitewide chrome — wordmark, staggered menu, gold fluid cursor.
 *
 * Every route gets it. `/projects` used to opt out and run its own fixed nav
 * and pointer treatment, which meant the one page people browse longest was
 * the one page whose menu looked nothing like the rest of the site. Its
 * bespoke nav and cursor are gone rather than layered, so there is exactly one
 * of everything.
 */
export function SiteChrome() {
  return (
    <>
      <SiteSplash />
      <CursorField />
      <StickyLogo />
      <SiteNav />
    </>
  );
}
