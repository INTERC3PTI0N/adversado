/**
 * Which routes are working software rather than the marketing site.
 *
 * The admin and the client portal share the root layout, so anything mounted
 * there — smooth scroll, the fluid cursor, the staggered menu — reaches them
 * unless it asks. One definition, because two copies of this rule drifting
 * apart is how Lenis ended up running over the admin's tables.
 */
const APP_AREAS = ["/admin", "/portal"] as const;

export function isAppArea(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return APP_AREAS.some(
    (area) => pathname === area || pathname.startsWith(`${area}/`),
  );
}
