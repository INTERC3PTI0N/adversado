import { getSupabase } from "@/lib/supabase/server";
import { requireStaffApi } from "@/lib/auth/rbac";
import { csvFilename, csvResponse, toCsv } from "@/lib/csv";
import type { FormSubmission, Json } from "@/lib/supabase/types";

/**
 * Form entry CSV export.
 *
 * Payload columns are derived from the rows actually being exported rather than
 * declared up front: different forms carry different fields, and a fixed column
 * list would silently drop whatever a newer form collects.
 */

const FIXED = ["Received", "Form", "Lead ID", "Source page", "Spam"] as const;

function payloadOf(value: Json): Record<string, Json> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, Json>)
    : {};
}

export async function GET(request: Request) {
  const guard = await requireStaffApi("admin");
  if ("error" in guard) return guard.error;

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const formKey = url.searchParams.get("form")?.trim() ?? "";
  const spam = url.searchParams.get("spam") === "1";
  const orphan = url.searchParams.get("orphan") === "1";

  const supabase = await getSupabase();

  // Validated against the table, so an arbitrary string never reaches the query.
  const { data: forms } = await supabase.from("forms").select("key");
  const validForm = (forms ?? []).some((f) => f.key === formKey) ? formKey : "";

  let query = supabase
    .from("form_submissions")
    .select("*")
    .eq("is_spam", spam)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (validForm) query = query.eq("form_key", validForm);
  if (orphan) query = query.is("lead_id", null);
  if (q) query = query.or(`payload->>email.ilike.%${q}%,payload->>name.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as FormSubmission[];

  const keys = [
    ...new Set(rows.flatMap((r) => Object.keys(payloadOf(r.payload)))),
  ].filter((k) => k !== "website"); // honeypot, never meaningful

  const csv = toCsv(
    [...FIXED, ...keys.map((k) => k.replace(/_/g, " "))],
    rows.map((row) => {
      const payload = payloadOf(row.payload);
      return [
        row.created_at,
        row.form_key,
        row.lead_id ?? "",
        row.source_page ?? "",
        row.is_spam ? "yes" : "no",
        ...keys.map((k) => payload[k] ?? ""),
      ];
    }),
  );

  return csvResponse(csv, csvFilename("form-entries", validForm));
}
