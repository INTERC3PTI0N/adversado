"use server";

import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/rbac";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Marking spam is the only write this screen has, and it is deliberate.
 *
 * Submissions are the permanent record of "we never received that enquiry", so
 * there is no delete here and no edit — RLS grants admins select and update
 * only. Spam is a flag on the row, not a reason to remove it.
 */
export async function setSubmissionSpam(
  id: string,
  isSpam: boolean,
): Promise<ActionResult> {
  await requireStaff("admin");
  const supabase = await getSupabase();

  const { error } = await supabase
    .from("form_submissions")
    .update({ is_spam: isSpam })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/crm/submissions");
  return { ok: true };
}
