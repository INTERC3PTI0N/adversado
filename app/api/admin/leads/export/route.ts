import { getSupabase } from "@/lib/supabase/server";
import { requireStaffApi } from "@/lib/auth/rbac";
import { csvFilename, csvResponse, toCsv } from "@/lib/csv";
import type { Lead, LeadSource, LeadStatus } from "@/lib/supabase/types";

/**
 * Lead CSV export.
 *
 * Honours the same filters as the list, so what you download is what you were
 * looking at. Admin-gated at the route and again by RLS — an editor hitting
 * this URL directly gets a 403, and would get an empty set even if they didn't.
 */

/* These arrive from the query string, so they are validated against the enum
   rather than cast — an unknown value is dropped, not passed to Postgres. */
const STATUSES: LeadStatus[] = ["new","contacted","qualified","proposal","negotiation","won","lost"];
const SOURCES: LeadSource[]  = ["website","events","booking","referral","manual","import"];

const asStatus = (v: string): LeadStatus | null =>
  (STATUSES as string[]).includes(v) ? (v as LeadStatus) : null;
const asSource = (v: string): LeadSource | null =>
  (SOURCES as string[]).includes(v) ? (v as LeadSource) : null;

const COLUMNS: { key: keyof Lead | "utm_source"; header: string }[] = [
  { key: "created_at", header: "Received" },
  { key: "name", header: "Name" },
  { key: "email", header: "Email" },
  { key: "phone", header: "Phone" },
  { key: "company", header: "Company" },
  { key: "source", header: "Source" },
  { key: "source_page", header: "Source page" },
  { key: "status", header: "Status" },
  { key: "priority", header: "Priority" },
  { key: "score", header: "Score" },
  { key: "budget", header: "Budget" },
  { key: "estimated_value", header: "Estimated value" },
  { key: "message", header: "Message" },
  { key: "lost_reason", header: "Lost reason" },
];

export async function GET(request: Request) {
  const guard = await requireStaffApi("admin");
  if ("error" in guard) return guard.error;

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const status = asStatus(url.searchParams.get("status") ?? "");
  const source = asSource(url.searchParams.get("source") ?? "");
  const unread = url.searchParams.get("unread") === "1";

  const supabase = await getSupabase();

  let query = supabase
    .from("leads")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (status) query = query.eq("status", status);
  if (source) query = query.eq("source", source);
  if (unread) query = query.eq("is_read", false);
  if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,company.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as Lead[];

  const csv = toCsv(
    COLUMNS.map((c) => c.header),
    rows.map((lead) =>
      COLUMNS.map((c) =>
        c.key === "utm_source"
          ? (lead.utm as Record<string, string>)?.utm_source
          : lead[c.key as keyof Lead],
      ),
    ),
  );

  return csvResponse(csv, csvFilename("leads", source ?? "all"));
}
