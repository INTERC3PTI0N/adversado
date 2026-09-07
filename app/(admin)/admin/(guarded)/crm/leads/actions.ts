"use server";

import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/rbac";
import type { Json, LeadPriority, LeadStatus } from "@/lib/supabase/types";

/**
 * Lead actions. Admin-only, re-checked here and enforced again by RLS —
 * `leads` has no policy that admits an editor, so a forged request returns
 * nothing rather than succeeding quietly.
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function setLeadStatus(
  leadId: string,
  status: LeadStatus,
  lostReason?: string,
): Promise<ActionResult> {
  await requireStaff("admin");
  const supabase = await getSupabase();

  const { error } = await supabase
    .from("leads")
    .update({
      status,
      lost_reason: status === "lost" ? (lostReason ?? null) : null,
      // First move off `new` is the moment someone actually picked it up.
      first_contacted_at:
        status !== "new" ? new Date().toISOString() : null,
    })
    .eq("id", leadId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/crm/leads");
  revalidatePath(`/admin/crm/leads/${leadId}`);
  revalidatePath("/admin/crm/pipeline");
  return { ok: true };
}

export async function setLeadFields(
  leadId: string,
  fields: {
    priority?: LeadPriority;
    owner_id?: string | null;
    estimated_value?: number | null;
    is_read?: boolean;
  },
): Promise<ActionResult> {
  await requireStaff("admin");
  const supabase = await getSupabase();

  const { error } = await supabase.from("leads").update(fields).eq("id", leadId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/crm/leads");
  revalidatePath(`/admin/crm/leads/${leadId}`);
  return { ok: true };
}

export async function addLeadNote(
  leadId: string,
  body: string,
): Promise<ActionResult> {
  const { profile } = await requireStaff("admin");
  if (!body.trim()) return { ok: false, error: "Write something first." };

  const supabase = await getSupabase();

  const { error } = await supabase
    .from("lead_notes")
    .insert({ lead_id: leadId, author_id: profile.id, body: body.trim() });

  if (error) return { ok: false, error: error.message };

  // The note itself is the record; the activity entry is what puts it on the
  // timeline alongside status changes.
  await supabase.from("lead_activities").insert({
    lead_id: leadId,
    actor_id: profile.id,
    type: "note_added",
    meta: { preview: body.trim().slice(0, 120) } as Json,
  });

  revalidatePath(`/admin/crm/leads/${leadId}`);
  return { ok: true };
}

/** Soft delete — the form submission behind it is untouched and permanent. */
export async function deleteLead(leadId: string): Promise<ActionResult> {
  await requireStaff("admin");
  const supabase = await getSupabase();

  const { error } = await supabase
    .from("leads")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", leadId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/crm/leads");
  return { ok: true };
}

export async function markRead(leadId: string): Promise<void> {
  await requireStaff("admin");
  const supabase = await getSupabase();
  await supabase.from("leads").update({ is_read: true }).eq("id", leadId);
}

/** Converts a won lead into a client record, for invoicing and the portal. */
export async function convertToClient(leadId: string): Promise<ActionResult> {
  await requireStaff("admin");
  const supabase = await getSupabase();

  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();

  if (!lead) return { ok: false, error: "Lead not found." };
  if (lead.client_id) return { ok: false, error: "Already linked to a client." };

  const { data: client, error } = await supabase
    .from("clients")
    .insert({
      name: lead.company || lead.name,
      company: lead.company,
      email: lead.email,
      phone: lead.phone,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  await supabase
    .from("leads")
    .update({ client_id: client.id, status: "won" })
    .eq("id", leadId);

  revalidatePath(`/admin/crm/leads/${leadId}`);
  revalidatePath("/admin/clients");
  return { ok: true };
}
