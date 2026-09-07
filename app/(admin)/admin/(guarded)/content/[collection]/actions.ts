"use server";

import { revalidatePath, updateTag } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase/server";
import { requireStaff, canPublish } from "@/lib/auth/rbac";
import { CMS_TAG } from "@/lib/cms/content";
import { COLLECTION_BY_ROUTE } from "@/lib/cms/collections";
import type { ContentStatus } from "@/lib/supabase/types";

/**
 * Collection actions — one set for every collection, dispatched by route.
 *
 * The route string is validated against the registry before it reaches the
 * query builder, so a forged value can't name an arbitrary table.
 */

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

function resolve(route: string) {
  const collection = COLLECTION_BY_ROUTE[route];
  if (!collection) throw new Error(`Unknown collection "${route}".`);
  return collection;
}

/**
 * Untyped handle for dynamic table access.
 *
 * supabase-js cannot infer Insert/Update across a union of table names and
 * collapses them to `never`, which makes generic CRUD impossible to type. The
 * table name is validated against the registry in `resolve()` before it gets
 * here, so it is known-good — this is the seam that buys one implementation
 * instead of seven copies of the same file.
 */
async function dynamicDb(): Promise<SupabaseClient> {
  return (await getSupabase()) as unknown as SupabaseClient;
}

export async function saveItem(
  route: string,
  id: string | null,
  values: Record<string, unknown>,
  status: ContentStatus,
  scheduledAt: string | null,
): Promise<ActionResult> {
  const { profile } = await requireStaff("editor");
  const collection = resolve(route);

  if (collection.publishable && status === "published" && !canPublish(profile.role)) {
    return {
      ok: false,
      error: "Editors cannot publish. Save as In review and an admin will release it.",
    };
  }

  if (status === "scheduled" && !scheduledAt) {
    return { ok: false, error: "Pick a date and time to schedule for." };
  }

  const title = String(values[collection.titleField] ?? "").trim();
  if (!title) return { ok: false, error: `${collection.singular} needs a title.` };

  const supabase = await dynamicDb();

  const payload: Record<string, unknown> = {
    ...values,
    status,
    scheduled_at: status === "scheduled" ? scheduledAt : null,
  };

  // `author_id` is set once, on creation — later edits by someone else
  // shouldn't reassign authorship.
  if (!id && collection.key === "posts") payload.author_id = profile.id;

  const result = id
    ? await supabase.from(collection.key).update(payload).eq("id", id).select("id").single()
    : await supabase.from(collection.key).insert(payload).select("id").single();

  if (result.error) {
    // A slug clash is the common failure and deserves a sentence, not a
    // Postgres constraint name.
    const message = result.error.code === "23505"
      ? "That slug is already in use. Pick another."
      : result.error.message;
    return { ok: false, error: message };
  }

  updateTag(CMS_TAG);
  revalidatePath(`/admin/content/${route}`);

  return { ok: true, id: result.data.id };
}

/** Soft delete for collections that carry `deleted_at`. */
export async function deleteItem(route: string, id: string): Promise<ActionResult> {
  await requireStaff("editor");
  const collection = resolve(route);
  const supabase = await dynamicDb();

  const { error } = await supabase
    .from(collection.key)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  updateTag(CMS_TAG);
  revalidatePath(`/admin/content/${route}`);
  return { ok: true };
}

/**
 * Manual reordering.
 *
 * Writes the whole visible order rather than swapping two rows: a swap leaves
 * gaps and duplicate positions once rows are added and removed over time, and
 * the list then sorts unpredictably.
 */
export async function reorder(
  route: string,
  orderedIds: string[],
): Promise<ActionResult> {
  await requireStaff("editor");
  const collection = resolve(route);

  if (!collection.sortable) {
    return { ok: false, error: `${collection.label} is not manually ordered.` };
  }

  const supabase = await dynamicDb();

  for (const [index, id] of orderedIds.entries()) {
    const { error } = await supabase
      .from(collection.key)
      .update({ position: index + 1 })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };
  }

  updateTag(CMS_TAG);
  revalidatePath(`/admin/content/${route}`);
  return { ok: true };
}
