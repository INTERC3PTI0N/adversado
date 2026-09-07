import "server-only";

import { getServiceSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Json, LeadSource } from "@/lib/supabase/types";

/**
 * Lead intake.
 *
 * Order matters and is deliberate:
 *
 *   1. Write `form_submissions` — the permanent raw record.
 *   2. Upsert `leads` — the working record.
 *   3. Notify / email.
 *
 * Step 1 is never conditional on 2 or 3. If lead creation fails, or Resend is
 * down, the submission is still on disk and recoverable. The failure mode this
 * avoids is the only unacceptable one for a contact form: an enquiry that
 * arrived and left no trace.
 *
 * Runs on the service-role key because an anonymous visitor cannot be allowed
 * to read or update `leads` — only the server may turn a submission into one.
 */

export type IntakePayload = {
  formKey: string;
  source: LeadSource;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  message?: string | null;
  budget?: string | null;
  sourcePage?: string | null;
  utm?: Record<string, string>;
  raw: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
};

export type IntakeResult = {
  submissionId: string | null;
  leadId: string | null;
  /** True when the submission was stored, whatever happened afterwards. */
  recorded: boolean;
};

/** Window within which a repeat email is treated as the same enquiry. */
const DEDUPE_DAYS = 30;

export async function recordIntake(input: IntakePayload): Promise<IntakeResult> {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // No backend configured: the caller still emails, so the enquiry is not
    // lost — it just isn't in the CRM.
    return { submissionId: null, leadId: null, recorded: false };
  }

  const supabase = getServiceSupabase();
  let submissionId: string | null = null;
  let leadId: string | null = null;

  // ── 1. The permanent record ────────────────────────────────────────────
  try {
    const { data: form } = await supabase
      .from("forms")
      .select("id")
      .eq("key", input.formKey)
      .maybeSingle();

    const { data: submission } = await supabase
      .from("form_submissions")
      .insert({
        form_id: form?.id ?? null,
        form_key: input.formKey,
        payload: input.raw as Json,
        source_page: input.sourcePage ?? null,
        utm: (input.utm ?? {}) as Json,
        ip: input.ip ?? null,
        user_agent: input.userAgent ?? null,
      })
      .select("id")
      .single();

    submissionId = submission?.id ?? null;
  } catch (err) {
    console.error("Could not store form submission:", err);
    return { submissionId: null, leadId: null, recorded: false };
  }

  // ── 2. The working record ──────────────────────────────────────────────
  try {
    const since = new Date(Date.now() - DEDUPE_DAYS * 86_400_000).toISOString();

    // Same person, same source, recently: append to the existing lead rather
    // than creating a duplicate the team has to merge by hand. Different
    // source is a different conversation, so events and website enquiries from
    // one address stay separate.
    const { data: existing } = await supabase
      .from("leads")
      .select("id, message")
      .eq("email", input.email.toLowerCase())
      .eq("source", input.source)
      .is("deleted_at", null)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      leadId = existing.id;

      const appended = [existing.message, input.message]
        .filter(Boolean)
        .join("\n\n— later submission —\n\n");

      await supabase
        .from("leads")
        .update({
          message: appended || existing.message,
          phone: input.phone || undefined,
          company: input.company || undefined,
          budget: input.budget || undefined,
          is_read: false,
        })
        .eq("id", existing.id);

      await supabase.from("lead_activities").insert({
        lead_id: existing.id,
        type: "resubmitted",
        meta: { form: input.formKey, submission_id: submissionId } as Json,
      });
    } else {
      const { data: lead } = await supabase
        .from("leads")
        .insert({
          name: input.name,
          email: input.email.toLowerCase(),
          phone: input.phone ?? null,
          company: input.company ?? null,
          message: input.message ?? null,
          budget: input.budget ?? null,
          source: input.source,
          source_page: input.sourcePage ?? null,
          utm: (input.utm ?? {}) as Json,
        })
        .select("id")
        .single();

      leadId = lead?.id ?? null;
    }

    if (submissionId && leadId) {
      await supabase
        .from("form_submissions")
        .update({ lead_id: leadId })
        .eq("id", submissionId);
    }
  } catch (err) {
    // The submission is stored; the lead is not. Recoverable by hand, and
    // loudly logged so it is noticed.
    console.error("Stored submission but could not create lead:", err);
  }

  return { submissionId, leadId, recorded: Boolean(submissionId) };
}

/** Pulls utm_* pairs out of a referring URL. */
export function parseUtm(url: string | null | undefined): Record<string, string> {
  if (!url) return {};
  try {
    const params = new URL(url).searchParams;
    const out: Record<string, string> = {};
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
      const v = params.get(key);
      if (v) out[key] = v;
    }
    return out;
  } catch {
    return {};
  }
}
