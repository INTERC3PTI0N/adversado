import { getSupabase } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/rbac";
import {
  EmptyState, PageHeading, Pagination, Panel, Table, Th,
} from "@/components/admin/ui";
import { FilterBar, enumOptions } from "@/components/admin/FilterBar";
import { AuditRow } from "@/components/admin/AuditRow";
import type { AuditEntry, Profile } from "@/lib/supabase/types";

export const metadata = { title: "Audit log — Adversado Admin" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

/** Tables carrying an audit trigger, from migration 0004. */
const ENTITIES = [
  "pages", "page_sections", "posts", "projects", "case_studies",
  "services", "leads", "invoices", "profiles", "clients",
];
const ACTIONS = ["insert", "update", "delete"];

/**
 * Audit log.
 *
 * Read-only by construction, not by convention: `audit_log` has a select
 * policy and no write policy at all, so the only thing that can add a row is
 * the SECURITY DEFINER trigger. There is no edit button here because there is
 * no code path that could make one work.
 */
export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireStaff("admin");
  const sp = await searchParams;

  // Validated against the known lists rather than cast — an unknown value is
  // dropped instead of reaching Postgres.
  const entity = ENTITIES.includes(sp.entity ?? "") ? sp.entity! : "";
  const action = ACTIONS.includes(sp.action ?? "") ? sp.action! : "";
  const q = sp.q?.trim() ?? "";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const supabase = await getSupabase();

  let query = supabase
    .from("audit_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (entity) query = query.eq("entity", entity);
  if (action) query = query.eq("action", action);
  if (q) query = query.eq("entity_id", q);

  const { data, count } = await query;
  const entries = (data ?? []) as AuditEntry[];

  // One lookup for the whole page rather than a join per row.
  const actorIds = [...new Set(entries.map((e) => e.actor_id).filter(Boolean))] as string[];
  const { data: actorRows } = actorIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", actorIds)
    : { data: [] as Pick<Profile, "id" | "full_name" | "email">[] };

  const actors = new Map(
    (actorRows ?? []).map((a) => [a.id, a.full_name ?? a.email]),
  );

  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHeading
        eyebrow="System"
        title="Audit log"
        description="Every insert, update and delete on the tables that matter, with the fields that changed. Written by a database trigger, so it records what happened rather than what the admin intended."
      />

      <FilterBar
        basePath="/admin/audit"
        searchLabel="Record ID"
        searchPlaceholder="Paste an id to trace one record"
        values={{ q, entity, action }}
        selects={[
          { key: "entity", label: "Table", options: enumOptions("All tables", ENTITIES) },
          { key: "action", label: "Action", options: enumOptions("All actions", ACTIONS) },
        ]}
      />

      <Panel className="mt-6">
        {entries.length === 0 ? (
          <EmptyState
            title={entity || action || q ? "Nothing matches" : "Nothing recorded yet"}
            body={
              entity || action || q
                ? "Try a different table or clear the filters."
                : "Changes to content, leads, invoices and accounts appear here as they happen."
            }
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>When</Th>
                  <Th>Who</Th>
                  <Th>Action</Th>
                  <Th>Record</Th>
                  <Th className="text-right">Changed</Th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <AuditRow
                    key={entry.id}
                    entry={entry}
                    actor={entry.actor_id ? actors.get(entry.actor_id) ?? null : null}
                  />
                ))}
              </tbody>
            </Table>

            <Pagination
              basePath="/admin/audit"
              page={page}
              pages={pages}
              total={total}
              noun="entry"
              plural="entries"
              params={{ q, entity, action }}
            />
          </>
        )}
      </Panel>
    </>
  );
}
