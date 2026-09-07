import type { MetadataRoute } from "next";
import { getPublicSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/seo";

export const revalidate = 3600;

/** The routes that exist in the app whether or not the CMS is reachable. */
const STATIC: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/about", priority: 0.8 },
  { path: "/services", priority: 0.9 },
  { path: "/projects", priority: 0.8 },
  { path: "/events", priority: 0.8 },
  { path: "/contact", priority: 0.7 },
  { path: "/faq", priority: 0.6 },
  { path: "/blog", priority: 0.6 },
];

/**
 * Sitemap.
 *
 * Static routes always appear; published posts and projects are added when the
 * database answers. A CMS outage costs the dynamic half, not the whole file —
 * an empty sitemap tells search engines the site has nothing on it.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();

  const pages: MetadataRoute.Sitemap = STATIC.map(({ path, priority }) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority,
  }));

  if (!isSupabaseConfigured()) return pages;

  try {
    const supabase = getPublicSupabase();

    const [posts, projects] = await Promise.all([
      supabase
        .from("posts")
        .select("slug, updated_at")
        .eq("status", "published")
        .is("deleted_at", null),
      supabase
        .from("projects")
        .select("slug, updated_at")
        .eq("status", "published")
        .is("deleted_at", null),
    ]);

    return [
      ...pages,
      ...(posts.data ?? []).map((p) => ({
        url: `${base}/blog/${p.slug}`,
        lastModified: new Date(p.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
      ...(projects.data ?? []).map((p) => ({
        url: `${base}/projects/${p.slug}`,
        lastModified: new Date(p.updated_at),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
    ];
  } catch {
    return pages;
  }
}
