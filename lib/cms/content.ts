import "server-only";

import { unstable_cache } from "next/cache";
import { getPublicSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import { defaultsFor } from "./schemas";
import type {
  Faq,
  Post,
  Project,
  Service,
  TeamMember,
  Testimonial,
} from "@/lib/supabase/types";

/**
 * Public content reads.
 *
 * Two rules hold everywhere in this file:
 *
 *  1. **Never throw.** A backend outage, a missing env var or an empty table
 *     degrades to the hardcoded defaults rather than a 500. The site predates
 *     the CMS and must keep working without it.
 *  2. **Anonymous client only.** Using the session client here would let an
 *     editor's draft leak into a cached public render.
 */

export const CMS_TAG = "cms";

type Dict = Record<string, unknown>;

/**
 * Section content for one page, keyed by section key, merged over the schema
 * defaults so a partially-filled row still renders completely.
 */
export const getPageSections = unstable_cache(
  async (slug: string): Promise<Record<string, Dict>> => {
    if (!isSupabaseConfigured()) return {};

    try {
      const supabase = getPublicSupabase();

      const { data: page } = await supabase
        .from("pages")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (!page) return {};

      const { data: sections } = await supabase
        .from("page_sections")
        .select("key, kind, data, status")
        .eq("page_id", page.id)
        .eq("status", "published")
        .order("position");

      if (!sections?.length) return {};

      const out: Record<string, Dict> = {};
      for (const s of sections) {
        out[s.key] = { ...defaultsFor(s.kind), ...(s.data as Dict) };
      }
      return out;
    } catch {
      // Degrade to defaults. A CMS problem must not take the page down.
      return {};
    }
  },
  ["cms-sections"],
  { tags: [CMS_TAG], revalidate: 300 },
);

/**
 * One section's content, already merged with defaults.
 *
 * Components call this with their own hardcoded copy as `fallback`, so the
 * default lives next to the markup it belongs to rather than only in the
 * registry.
 */
export async function getSection<T extends Dict>(
  slug: string,
  key: string,
  fallback: T,
): Promise<T> {
  const sections = await getPageSections(slug);
  return { ...fallback, ...(sections[key] ?? {}) } as T;
}

/* ── Collections ─────────────────────────────────────────────────────────── */

async function collection<T>(
  table: "posts" | "projects" | "services" | "team_members" | "testimonials" | "faqs",
  order: { column: string; ascending: boolean },
  limit?: number,
): Promise<T[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = getPublicSupabase();
    let q = supabase
      .from(table)
      .select("*")
      .eq("status", "published")
      .is("deleted_at", null)
      .order(order.column, { ascending: order.ascending });

    if (limit) q = q.limit(limit);

    const { data } = await q;
    return (data ?? []) as T[];
  } catch {
    return [];
  }
}

export const getPosts = unstable_cache(
  (limit?: number) =>
    collection<Post>("posts", { column: "published_at", ascending: false }, limit),
  ["cms-posts"],
  { tags: [CMS_TAG], revalidate: 300 },
);

export const getProjects = unstable_cache(
  () => collection<Project>("projects", { column: "position", ascending: true }),
  ["cms-projects"],
  { tags: [CMS_TAG], revalidate: 300 },
);

export const getServices = unstable_cache(
  () => collection<Service>("services", { column: "position", ascending: true }),
  ["cms-services"],
  { tags: [CMS_TAG], revalidate: 300 },
);

export const getTeam = unstable_cache(
  () => collection<TeamMember>("team_members", { column: "position", ascending: true }),
  ["cms-team"],
  { tags: [CMS_TAG], revalidate: 300 },
);

export const getTestimonials = unstable_cache(
  () => collection<Testimonial>("testimonials", { column: "position", ascending: true }),
  ["cms-testimonials"],
  { tags: [CMS_TAG], revalidate: 300 },
);

export const getFaqs = unstable_cache(
  () => collection<Faq>("faqs", { column: "position", ascending: true }),
  ["cms-faqs"],
  { tags: [CMS_TAG], revalidate: 300 },
);

/** Single post by slug, for the article route. */
export async function getPost(slug: string): Promise<Post | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = getPublicSupabase();
    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .is("deleted_at", null)
      .maybeSingle();

    return (data as Post) ?? null;
  } catch {
    return null;
  }
}

/** Public URL for a media row's storage path. */
export function mediaUrl(bucket: string, path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return path;
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}
