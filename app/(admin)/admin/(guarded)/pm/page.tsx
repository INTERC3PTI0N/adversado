import Link from "next/link";
import { getSupabase } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/rbac";
import {
  Badge, ButtonLink, EmptyState, PageHeading, Panel, Stat, Table, Td, Th, label,
} from "@/components/admin/ui";
import { FilterBar } from "@/components/admin/FilterBar";
import { enumOptions } from "@/lib/filters";
import { daysUntil, money, shortDate } from "@/lib/format";
import type { Client, PmProject, ProjectStatus } from "@/lib/supabase/types";

export const metadata = { title: "Projects — Adversado Admin" };
export const dynamic = "force-dynamic";

const STATUSES: ProjectStatus[] = ["planning", "in_progress", "on_hold", "review", "complete"];

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireStaff("admin");
  const sp = await searchParams;

  const status = (STATUSES as string[]).includes(sp.status ?? "")
    ? (sp.status as ProjectStatus)
    : "";
  const q = sp.q?.trim() ?? "";

  const supabase = await getSupabase();

  let query = supabase
    .from("pm_projects")
    .select("*")
    .is("deleted_at", null)
    .order("due_on", { ascending: true, nullsFirst: false });

  if (status) query = query.eq("status", status);
  if (q) query = query.ilike("name", `%${q}%`);

  const [{ data }, clientsRes] = await Promise.all([
    query,
    supabase.from("clients").select("id, name").is("deleted_at", null),
  ]);

  const projects = (data ?? []) as PmProject[];
  const clients = new Map(
    ((clientsRes.data ?? []) as Pick<Client, "id" | "name">[]).map((c) => [c.id, c.name]),
  );

  const live = projects.filter((p) => p.status !== "complete");
  const overdue = live.filter((p) => {
    const days = daysUntil(p.due_on);
    return days !== null && days < 0;
  });
  const committed = live.reduce((a, p) => a + (p.budget ?? 0), 0);

  return (
    <>
      <PageHeading
        eyebrow="Delivery"
        title="Projects & tasks"
        description="Progress is derived from the task board, never typed in — the bar and the board can't disagree."
        action={<ButtonLink href="/admin/pm/new">New project</ButtonLink>}
      />

      <div className="mb-7 grid gap-5 sm:grid-cols-3">
        <Stat label="Live projects" value={live.length} />
        <Stat
          label="Past due"
          value={overdue.length}
          tone={overdue.length > 0 ? "gold" : "cream"}
        />
        <Stat label="Committed budget" value={money(committed)} tone="navy" hint="Live projects" />
      </div>

      <FilterBar
        basePath="/admin/pm"
        searchPlaceholder="Project name"
        values={{ q, status }}
        selects={[{ key: "status", label: "Status", options: enumOptions("All statuses", STATUSES) }]}
      />

      <Panel className="mt-6">
        {projects.length === 0 ? (
          <EmptyState
            title={q || status ? "Nothing matches" : "No projects yet"}
            body={
              q || status
                ? "Try a different filter."
                : "Create one here, or from a client's page to have it pre-filled."
            }
            action={<ButtonLink href="/admin/pm/new">New project</ButtonLink>}
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Project</Th>
                <Th>Status</Th>
                <Th>Progress</Th>
                <Th className="text-right">Budget</Th>
                <Th className="text-right">Due</Th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => {
                const days = daysUntil(project.due_on);
                const late = days !== null && days < 0 && project.status !== "complete";

                return (
                  <tr key={project.id} className={late ? "bg-[#c8322a]/[0.07]" : ""}>
                    <Td>
                      <Link
                        href={`/admin/pm/${project.id}`}
                        className="font-black underline decoration-charcoal/30 underline-offset-4 hover:decoration-charcoal"
                      >
                        {project.name}
                      </Link>
                      <span className="block text-[0.78rem] text-charcoal/55">
                        {project.client_id ? clients.get(project.client_id) ?? "—" : "Internal"}
                        {project.is_visible_to_client ? "" : " · hidden from portal"}
                      </span>
                    </Td>
                    <Td>
                      <Badge tone={project.status === "complete" ? "published" : "new"}>
                        {label(project.status)}
                      </Badge>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        {/* A bar, not just a number: comparing six projects down
                            a column is a glance rather than six readings. */}
                        <div className="h-2.5 w-24 shrink-0 border-2 border-charcoal bg-cream">
                          <div
                            className="h-full bg-gold"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="font-sans text-[0.76rem] font-black tabular-nums text-charcoal/60">
                          {project.progress}%
                        </span>
                      </div>
                    </Td>
                    <Td className="text-right tabular-nums">
                      {project.budget ? money(project.budget) : "—"}
                    </Td>
                    <Td className="text-right tabular-nums text-charcoal/60">
                      {shortDate(project.due_on)}
                      {late ? (
                        <span className="block text-[0.7rem] font-black text-[#c8322a]">
                          {Math.abs(days!)}d late
                        </span>
                      ) : null}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Panel>
    </>
  );
}
