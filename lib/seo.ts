/**
 * Where the site lives, for anything that needs an absolute URL — sitemap,
 * robots, invite links, OG tags.
 *
 * Vercel sets VERCEL_PROJECT_PRODUCTION_URL on every deployment of a project
 * with a production domain, so previews resolve to themselves rather than
 * pointing search engines at localhost.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}
