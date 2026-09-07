import Link from "next/link";
import { getSupabase } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/rbac";
import {
  Badge, ButtonLink, EmptyState, PageHeading, Panel, Stat, Table, Td, Th, label,
} from "@/components/admin/ui";
import { LeadFilters } from "@/components/admin/LeadFilters";
import type { Lead, LeadSource, LeadStatus } from "@/lib/supabase/types";

export const metadata = { title: "Leads — Adversado Admin" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 40;

/**
 * Lead list: search, filter, and CSV export.
 *
 * Filtering is done in the query rather than in JS — the table is expected to
 * grow past the point where fetching everything and filtering client-side is
 * honest. Search runs against the trigram index created in migration 0003.
 */
export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireStaff("admin");
  const sp = await searchParams;

  const q = sp.q?.trim() ?? "";
  /* From the query string, so validated against the enum rather than cast —
     an unknown value is ignored instead of reaching Postgres. */
  const STATUSES: LeadStatus[] = ["new","contacted","qualified","proposal","negotiation","won","lost"];
  const SOURCES: LeadSource[]  = ["website","events","booking","referral","manual","import"];
  const raw = { status: sp.status ?? "", source: sp.source ?? "" };
  const status = (STATUSES as string[]).includes(raw.status) ? (raw.status as LeadStatus) : null;
  const source = (SOURCES as string[]).includes(raw.source) ? (raw.source as LeadSource) : null;
  const unread = sp.unread === "1";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const supabase = await getSupabase();

  let query = supabase
    .from("leads")
    .select("*", { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (status) query = query.eq("status", status);
  if (source) query = query.eq("source", source);
  if (unread) query = query.eq("is_read", false);
  if (q) {
    query = query.or(
      `name.ilike.%${q}%,email.ilike.%${q}%,company.ilike.%${q}%`,
    );
  }

  const [{ data, count }, summaryRes] = await Promise.all([
    query,
    supabase.from("lead_pipeline_summary").select("*"),
  ]);

  const leads = (data ?? []) as Lead[];
  const summary = summaryRes.data ?? [];
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const websiteCount = summary
    .filter((r) => r.source !== "events")
    .reduce((a, r) => a + Number(r.lead_count), 0);
  const eventsCount = summary
    .filter((r) => r.source === "events")
    .reduce((a, r) => a + Number(r.lead_count), 0);
  const unreadCount = summary.reduce((a, r) => a + Number(r.unread_count), 0);

  // Carries the active filters through to the export, so what you download is
  // what you are looking at.
  const exportHref = `/api/admin/leads/export?${new URLSearchParams(
    Object.entries({ q, status: status ?? "", source: source ?? "", unread: unread ? "1" : "" }).filter(
      ([, v]) => v,
    ) as [string, string][],
  )}`;

  return (
    <>
      <PageHeading
        eyebrow="CRM"
        title="Leads"
        description="Every enquiry from the site, with Events tracked separately from the rest."
        action={
          <ButtonLink href={exportHref} tone="secondary">
            Export CSV
          </ButtonLink>
        }
      />

      <div className="mb-7 grid gap-5 sm:grid-cols-3">
        <Stat label="Website enquiries" value={websiteCount} />
        <Stat label="Events enquiries" value={eventsCount} tone="navy" />
        <Stat
          label="Unread"
          value={unreadCount}
          tone={unreadCount > 0 ? "gold" : "cream"}
        />
      </div>

      <LeadFilters q={q} status={status ?? ""} source={source ?? ""} unread={unread} />

      <Panel className="mt-6">
        {leads.length === 0 ? (
          <EmptyState
            title={q || status || source ? "Nothing matches" : "No leads yet"}
            body={
              q || status || source
                ? "Try a different search or clear the filters."
                : "Submissions from the contact, home and events forms land here the moment they arrive."
            }
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Source</Th>
                  <Th>Status</Th>
                  <Th>Priority</Th>
                  <Th className="text-right">Score</Th>
                  <Th className="text-right">Received</Th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className={lead.is_read ? "" : "bg-gold/10"}>
                    <Td>
                      <Link
                        href={`/admin/crm/leads/${lead.id}`}
                        className="font-black underline decoration-charcoal/30 underline-offset-4 hover:decoration-charcoal"
                      >
                        {lead.name}
                      </Link>
                      <span className="block text-[0.78rem] text-charcoal/55">
                        {lead.company ? `${lead.company} · ` : ""}
                        {lead.email}
                      </span>
                    </Td>
                    <Td>
                      <Badge tone={lead.source === "events" ? "high" : undefined}>
                        {label(lead.source)}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge tone={lead.status}>{label(lead.status)}</Badge>
                    </Td>
                    <Td>
                      <Badge tone={lead.priority}>{label(lead.priority)}</Badge>
                    </Td>
                    <Td className="text-right tabular-nums">{lead.score}</Td>
                    <Td className="text-right tabular-nums text-charcoal/60">
                      {new Date(lead.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "2-digit",
                      })}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {pages > 1 ? (
              <div className="flex items-center justify-between gap-4 border-t-[3px] border-charcoal px-5 py-4">
                <span className="font-sans text-[0.76rem] font-bold text-charcoal/60">
                  Page {page} of {pages} · {total} lead{total === 1 ? "" : "s"}
                </span>
                <div className="flex gap-3">
                  {page > 1 ? (
                    <ButtonLink
                      tone="secondary"
                      href={`/admin/crm/leads?${new URLSearchParams({ ...sp, page: String(page - 1) } as Record<string, string>)}`}
                    >
                      Previous
                    </ButtonLink>
                  ) : null}
                  {page < pages ? (
                    <ButtonLink
                      tone="secondary"
                      href={`/admin/crm/leads?${new URLSearchParams({ ...sp, page: String(page + 1) } as Record<string, string>)}`}
                    >
                      Next
                    </ButtonLink>
                  ) : null}
                </div>
              </div>
            ) : null}
          </>
        )}
      </Panel>
    </>
  );
}
