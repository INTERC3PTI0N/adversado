"use server";

import { revalidatePath, updateTag } from "next/cache";
import { getSupabase } from "@/lib/supabase/server";
import { requireStaff, canPublish } from "@/lib/auth/rbac";
import { CMS_TAG } from "@/lib/cms/content";
import { PAGE_MAP, SCHEMA_BY_KIND } from "@/lib/cms/schemas";
import type { ContentStatus, Json } from "@/lib/supabase/types";

/**
 * Server actions for the page/section editor.
 *
 * Every action re-checks the role. The client never decides what it may do —
 * it only decides what to show. Publishing is additionally gated in Postgres
 * by `guard_publish()`, so an editor forging a request gets a 42501 from the
 * database rather than a published page.
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Creates the `pages` and `page_sections` rows the registry declares but the
 * database doesn't have yet, seeded with each schema's defaults.
 *
 * Idempotent, so it doubles as the "sync after adding a section" button.
 */
export async function ensurePages(): Promise<ActionResult> {
  const { profile } = await requireStaff("editor");
  const supabase = await getSupabase();

  try {
    for (const page of PAGE_MAP) {
      const { data: existing } = await supabase
        .from("pages")
        .select("id")
        .eq("slug", page.slug)
        .maybeSingle();

      let pageId = existing?.id;

      if (!pageId) {
        const { data: created, error } = await supabase
          .from("pages")
          .insert({
            slug: page.slug,
            title: page.title,
            is_system: true,
            status: "published" as ContentStatus,
          })
          .select("id")
          .single();

        if (error) return { ok: false, error: error.message };
        pageId = created.id;
      }

      for (const [i, section] of page.sections.entries()) {
        const schema = SCHEMA_BY_KIND[section.kind];
        if (!schema) continue;

        const { data: found } = await supabase
          .from("page_sections")
          .select("id")
          .eq("page_id", pageId)
          .eq("key", section.key)
          .maybeSingle();

        if (found) continue;

        await supabase.from("page_sections").insert({
          page_id: pageId,
          key: section.key,
          kind: section.kind,
          label: schema.label,
          position: i,
          // Seeded rows publish immediately: they hold exactly the copy that
          // is already live, so there is nothing to review.
          status: "published" as ContentStatus,
          data: schema.defaults as Record<string, Json>,
          updated_by: profile.id,
        });
      }
    }

    updateTag(CMS_TAG);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not sync pages.",
    };
  }
}

/** Saves one section's content. */
export async function saveSection(
  sectionId: string,
  data: Record<string, unknown>,
  status: ContentStatus,
  scheduledAt: string | null,
  pageSlug: string,
): Promise<ActionResult> {
  const { profile } = await requireStaff("editor");

  // Mirror the database gate so the editor gets a sentence rather than a
  // Postgres error code.
  if (status === "published" && !canPublish(profile.role)) {
    return {
      ok: false,
      error: "Editors cannot publish. Save as In review and an admin will release it.",
    };
  }

  if (status === "scheduled" && !scheduledAt) {
    return { ok: false, error: "Pick a date and time to schedule for." };
  }

  const supabase = await getSupabase();

  const { error } = await supabase
    .from("page_sections")
    .update({
      data: data as Record<string, Json>,
      status,
      scheduled_at: status === "scheduled" ? scheduledAt : null,
      updated_by: profile.id,
    })
    .eq("id", sectionId);

  if (error) return { ok: false, error: error.message };

  updateTag(CMS_TAG);
  revalidatePath(pageSlug === "_site" ? "/" : pageSlug);
  revalidatePath("/admin/content/pages");

  return { ok: true };
}

/**
 * Restores a past revision by copying it forward.
 *
 * Never rewinds in place — the restore is itself a change, so it snapshots the
 * current value on the way past and stays in the history.
 */
export async function restoreRevision(
  sectionId: string,
  revisionId: string,
  pageSlug: string,
): Promise<ActionResult> {
  const { profile } = await requireStaff("editor");
  const supabase = await getSupabase();

  const { data: revision, error: readError } = await supabase
    .from("section_revisions")
    .select("data")
    .eq("id", revisionId)
    .single();

  if (readError || !revision) {
    return { ok: false, error: "That revision could not be found." };
  }

  const { error } = await supabase
    .from("page_sections")
    .update({
      data: revision.data as Record<string, Json>,
      updated_by: profile.id,
    })
    .eq("id", sectionId);

  if (error) return { ok: false, error: error.message };

  updateTag(CMS_TAG);
  revalidatePath(pageSlug === "_site" ? "/" : pageSlug);

  return { ok: true };
}

/** Page-level SEO. */
export async function savePageSeo(
  pageId: string,
  seo: {
    seo_title: string | null;
    seo_description: string | null;
    seo_keywords: string[] | null;
    canonical_url: string | null;
    noindex: boolean;
    nofollow: boolean;
  },
  pageSlug: string,
): Promise<ActionResult> {
  await requireStaff("editor");
  const supabase = await getSupabase();

  const { error } = await supabase.from("pages").update(seo).eq("id", pageId);
  if (error) return { ok: false, error: error.message };

  updateTag(CMS_TAG);
  revalidatePath(pageSlug === "_site" ? "/" : pageSlug);

  return { ok: true };
}
