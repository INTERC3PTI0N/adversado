"use server";

import { revalidatePath, updateTag } from "next/cache";
import { getSupabase } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/rbac";
import { CMS_TAG } from "@/lib/cms/content";
import type { Json } from "@/lib/supabase/types";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * SEO settings and redirects. Admin-only — `seo_write` and `redirects_write`
 * both require `is_admin()`, so an editor's write returns zero rows rather
 * than an error, which is why the guard is repeated here.
 */

export async function saveSeoSettings(
  fields: Record<string, string>,
): Promise<ActionResult> {
  await requireStaff("admin");

  // JSON-LD is free text in the form; a typo must be a message, not a 500.
  let organisation: Json | null = null;
  if (fields.organisation_jsonld?.trim()) {
    try {
      organisation = JSON.parse(fields.organisation_jsonld) as Json;
    } catch {
      return { ok: false, error: "The organisation JSON-LD isn't valid JSON." };
    }
  }

  const supabase = await getSupabase();

  const { error } = await supabase
    .from("seo_settings")
    .update({
      site_name: fields.site_name ?? "",
      title_template: fields.title_template || "%s",
      default_title: fields.default_title || null,
      default_description: fields.default_description || null,
      robots_txt: fields.robots_txt || null,
      google_verification: fields.google_verification || null,
      bing_verification: fields.bing_verification || null,
      organisation_jsonld: organisation,
    })
    .eq("id", true);

  if (error) return { ok: false, error: error.message };

  // Public pages read these through the CMS cache tag, not just this path.
  updateTag(CMS_TAG);
  revalidatePath("/admin/seo");
  revalidatePath("/admin/settings/site");
  return { ok: true };
}

export async function saveRedirect(
  id: string | null,
  fields: { from_path: string; to_path: string; status_code: number; is_active: boolean },
): Promise<ActionResult> {
  await requireStaff("admin");

  const from = fields.from_path.trim();
  const to = fields.to_path.trim();

  if (!from.startsWith("/")) return { ok: false, error: "The old path must start with /." };
  if (!to.startsWith("/") && !/^https?:\/\//.test(to)) {
    return { ok: false, error: "The new path must start with / or be a full URL." };
  }
  if (from === to) return { ok: false, error: "That redirects to itself." };
  if (![301, 302, 307, 308].includes(fields.status_code)) {
    return { ok: false, error: "Unsupported status code." };
  }

  const supabase = await getSupabase();
  const row = { from_path: from, to_path: to, status_code: fields.status_code, is_active: fields.is_active };

  const { error } = id
    ? await supabase.from("redirects").update(row).eq("id", id)
    : await supabase.from("redirects").insert(row);

  if (error) {
    return {
      ok: false,
      error: /duplicate|unique/i.test(error.message)
        ? `There is already a redirect from ${from}.`
        : error.message,
    };
  }

  revalidatePath("/admin/seo");
  return { ok: true };
}

export async function deleteRedirect(id: string): Promise<ActionResult> {
  await requireStaff("admin");
  const supabase = await getSupabase();

  const { error } = await supabase.from("redirects").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/seo");
  return { ok: true };
}
