import type { MetadataRoute } from "next";
import { getPublicSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/seo";

export const revalidate = 3600;

/**
 * robots.txt.
 *
 * Editable from the SEO screen, because "stop indexing the staging copy" is a
 * thing someone needs at 6pm on a Friday without a deploy. Falls back to a
 * sensible default that allows everything and keeps the admin and the API out
 * of the index.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const fallback: MetadataRoute.Robots = {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/portal", "/api"] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };

  if (!isSupabaseConfigured()) return fallback;

  try {
    const { data } = await getPublicSupabase()
      .from("seo_settings")
      .select("robots_txt")
      .eq("id", true)
      .single();

    const custom = data?.robots_txt;
    if (!custom || typeof custom !== "string" || !custom.trim()) return fallback;

    // A hand-written file is served verbatim rather than reparsed into Next's
    // object form, which cannot express every directive people actually use.
    return {
      rules: [{ userAgent: "*", allow: "/" }],
      sitemap: `${siteUrl()}/sitemap.xml`,
      ...parse(custom),
    };
  } catch {
    return fallback;
  }
}

/** Minimal robots.txt reader — enough for the directives an editor writes. */
function parse(text: string): Partial<MetadataRoute.Robots> {
  const rules: { userAgent: string; allow: string[]; disallow: string[] }[] = [];
  let current: (typeof rules)[number] | null = null;
  let sitemap: string | undefined;

  for (const raw of text.split("\n")) {
    const line = raw.split("#")[0].trim();
    if (!line) continue;

    const [key, ...rest] = line.split(":");
    const value = rest.join(":").trim();
    if (!value) continue;

    switch (key.trim().toLowerCase()) {
      case "user-agent":
        current = { userAgent: value, allow: [], disallow: [] };
        rules.push(current);
        break;
      case "allow":
        current?.allow.push(value);
        break;
      case "disallow":
        current?.disallow.push(value);
        break;
      case "sitemap":
        sitemap = value;
        break;
    }
  }

  if (rules.length === 0) return {};

  return {
    rules: rules.map((r) => ({
      userAgent: r.userAgent,
      ...(r.allow.length ? { allow: r.allow } : {}),
      ...(r.disallow.length ? { disallow: r.disallow } : {}),
    })),
    ...(sitemap ? { sitemap } : {}),
  };
}
