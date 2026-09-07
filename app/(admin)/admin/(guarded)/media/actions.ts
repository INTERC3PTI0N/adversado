"use server";

import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/rbac";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateMedia(
  id: string,
  fields: { alt_text?: string; caption?: string; folder_id?: string | null },
): Promise<ActionResult> {
  await requireStaff("editor");
  const supabase = await getSupabase();

  const { error } = await supabase.from("media").update(fields).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/media");
  return { ok: true };
}

/**
 * Delete a file for good.
 *
 * Admin-only, matching the storage policy — `media staff delete` requires
 * `is_admin()`, so an editor calling this would remove the row and leave the
 * object stranded. Refusing here keeps the two in step.
 *
 * The row goes first. A row with no object shows a broken thumbnail, which is
 * visible and fixable; an object with no row is invisible and unreclaimable.
 */
export async function deleteMedia(id: string): Promise<ActionResult> {
  await requireStaff("admin");
  const supabase = await getSupabase();

  const { data: media } = await supabase
    .from("media")
    .select("bucket, storage_path")
    .eq("id", id)
    .single();

  if (!media) return { ok: false, error: "That file is already gone." };

  const { error } = await supabase.from("media").delete().eq("id", id);
  if (error) {
    return {
      ok: false,
      error: /foreign key|violates/i.test(error.message)
        ? "That file is still used by a page or a post. Swap it out there first."
        : error.message,
    };
  }

  await supabase.storage.from(media.bucket).remove([media.storage_path]);

  revalidatePath("/admin/media");
  return { ok: true };
}

export async function createFolder(name: string): Promise<ActionResult> {
  await requireStaff("editor");

  const clean = name.trim();
  if (!clean) return { ok: false, error: "Give the folder a name." };

  const supabase = await getSupabase();

  // `path` is the folder tree's addressable key; flat for now, so it is just
  // the slug. Nesting would extend it to `parent/child` without a schema change.
  const path = clean
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const { error } = await supabase
    .from("media_folders")
    .insert({ name: clean, path, parent_id: null });

  if (error) {
    return {
      ok: false,
      error: /duplicate|unique/i.test(error.message)
        ? "There is already a folder with that name."
        : error.message,
    };
  }

  revalidatePath("/admin/media");
  return { ok: true };
}

export async function deleteFolder(id: string): Promise<ActionResult> {
  await requireStaff("admin");
  const supabase = await getSupabase();

  // Files outlive their folder — `media.folder_id` is `on delete set null`,
  // so removing a folder never removes what is in it.
  const { error } = await supabase.from("media_folders").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/media");
  return { ok: true };
}
