"use server";

import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/rbac";
import type { LeadPriority, ProjectStatus, TaskStatus } from "@/lib/supabase/types";

export type ActionResult = { ok: true } | { ok: false; error: string };
export type CreateResult = { ok: true; id: string } | { ok: false; error: string };

/**
 * Projects, tasks and milestones.
 *
 * `progress` is never written from here. A trigger recomputes it as the share
 * of a project's tasks that are done, so the bar on the client's portal can't
 * disagree with the task list underneath it.
 */

export async function saveProject(
  id: string | null,
  fields: {
    name: string;
    client_id: string | null;
    status: ProjectStatus;
    starts_on: string | null;
    due_on: string | null;
    owner_id: string | null;
    description: string;
    budget: number | null;
    is_visible_to_client: boolean;
  },
): Promise<CreateResult> {
  await requireStaff("admin");

  if (!fields.name.trim()) return { ok: false, error: "Give the project a name." };
  if (fields.starts_on && fields.due_on && fields.due_on < fields.starts_on) {
    return { ok: false, error: "The due date is before the start date." };
  }

  const supabase = await getSupabase();
  const row = {
    name: fields.name.trim(),
    client_id: fields.client_id,
    status: fields.status,
    starts_on: fields.starts_on,
    due_on: fields.due_on,
    owner_id: fields.owner_id,
    description: fields.description.trim() || null,
    budget: fields.budget,
    is_visible_to_client: fields.is_visible_to_client,
  };

  if (id) {
    const { error } = await supabase.from("pm_projects").update(row).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/admin/pm/${id}`);
    revalidatePath("/admin/pm");
    return { ok: true, id };
  }

  const { data, error } = await supabase.from("pm_projects").insert(row).select("id").single();
  if (error || !data) return { ok: false, error: error?.message ?? "Could not create." };

  revalidatePath("/admin/pm");
  return { ok: true, id: data.id };
}

export async function archiveProject(id: string): Promise<ActionResult> {
  await requireStaff("admin");
  const supabase = await getSupabase();

  const { error } = await supabase
    .from("pm_projects")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/pm");
  return { ok: true };
}

export async function saveTask(
  id: string | null,
  projectId: string,
  fields: {
    title: string;
    description: string;
    status: TaskStatus;
    assignee_id: string | null;
    due_on: string | null;
    priority: LeadPriority;
  },
): Promise<ActionResult> {
  await requireStaff("admin");

  if (!fields.title.trim()) return { ok: false, error: "Give the task a title." };

  const supabase = await getSupabase();
  const row = {
    project_id: projectId,
    title: fields.title.trim(),
    description: fields.description.trim() || null,
    status: fields.status,
    assignee_id: fields.assignee_id,
    due_on: fields.due_on,
    priority: fields.priority,
  };

  const { error } = id
    ? await supabase.from("pm_tasks").update(row).eq("id", id)
    : await supabase.from("pm_tasks").insert(row);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/pm/${projectId}`);
  return { ok: true };
}

export async function setTaskStatus(
  id: string,
  projectId: string,
  status: TaskStatus,
): Promise<ActionResult> {
  await requireStaff("admin");
  const supabase = await getSupabase();

  // `completed_at` is stamped by the stamp_task_completion trigger, and the
  // project's progress by recalc_project_progress. Both follow from this write.
  const { error } = await supabase.from("pm_tasks").update({ status }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/pm/${projectId}`);
  revalidatePath("/admin/pm");
  return { ok: true };
}

export async function deleteTask(id: string, projectId: string): Promise<ActionResult> {
  await requireStaff("admin");
  const supabase = await getSupabase();

  const { error } = await supabase.from("pm_tasks").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/pm/${projectId}`);
  return { ok: true };
}

export async function saveMilestone(
  id: string | null,
  projectId: string,
  title: string,
  dueOn: string | null,
): Promise<ActionResult> {
  await requireStaff("admin");
  if (!title.trim()) return { ok: false, error: "Give the milestone a title." };

  const supabase = await getSupabase();
  const row = { project_id: projectId, title: title.trim(), due_on: dueOn };

  const { error } = id
    ? await supabase.from("pm_milestones").update(row).eq("id", id)
    : await supabase.from("pm_milestones").insert(row);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/pm/${projectId}`);
  return { ok: true };
}

export async function toggleMilestone(
  id: string,
  projectId: string,
  done: boolean,
): Promise<ActionResult> {
  await requireStaff("admin");
  const supabase = await getSupabase();

  const { error } = await supabase
    .from("pm_milestones")
    .update({ completed_at: done ? new Date().toISOString() : null })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/pm/${projectId}`);
  return { ok: true };
}

export async function deleteMilestone(id: string, projectId: string): Promise<ActionResult> {
  await requireStaff("admin");
  const supabase = await getSupabase();

  const { error } = await supabase.from("pm_milestones").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/pm/${projectId}`);
  return { ok: true };
}
