import Link from "next/link";
import { getSupabase } from "@/lib/supabase/server";
import { requireClient } from "@/lib/auth/rbac";
import {
  Badge, EmptyState, PageHeading, Panel, PanelHeader, Stat, label,
} from "@/components/admin/ui";
import { money, shortDate } from "@/lib/format";
import type { Invoice, PmProject } from "@/lib/supabase/types";

export const metadata = { title: "Your account — Adversado" };
export const dynamic = "force-dynamic";

/**
 * Portal overview.
 *
 * Every query below is unfiltered by client — RLS applies `auth_client_id()`
 * for us. Writing `.eq("client_id", …)` here as well would read as the thing
 * doing the scoping, which it isn't, and would rot the day someone deletes it.
 */
export default async function PortalHome() {
  await requireClient();
  const supabase = await getSupabase();

  const [projectsRes, invoicesRes, milestonesRes] = await Promise.all([
    supabase.from("pm_projects").select("*").order("due_on", { nullsFirst: false }),
    supabase.from("invoices").select("*").order("issue_date", { ascending: false }).limit(5),
    supabase
      .from("pm_milestones")
      .select("id, title, due_on, completed_at, project_id")
      .is("completed_at", null)
      .order("due_on", { nullsFirst: false })
      .limit(6),
  ]);

  const projects = (projectsRes.data ?? []) as PmProject[];
  const invoices = (invoicesRes.data ?? []) as Invoice[];
  const milestones = milestonesRes.data ?? [];

  const live = projects.filter((p) => p.status !== "complete");
  const owed = invoices
    .filter((i) => !["draft", "void", "paid"].includes(i.status))
    .reduce((a, i) => a + (i.total - i.amount_paid), 0);

  return (
    <>
      <PageHeading
        eyebrow="Your account"
        title="Where things stand"
        description="Live work, what's coming up next, and anything outstanding."
      />

      <div className="mb-8 grid gap-5 sm:grid-cols-3">
        <Stat label="Live projects" value={live.length} />
        <Stat
          label="Average progress"
          value={
            live.length
              ? `${Math.round(live.reduce((a, p) => a + p.progress, 0) / live.length)}%`
              : "—"
          }
          tone="gold"
        />
        <Stat label="Outstanding" value={money(owed)} tone={owed > 0 ? "navy" : "cream"} />
      </div>

      <div className="grid gap-7 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel>
          <PanelHeader title="Projects" />
          {projects.length === 0 ? (
            <EmptyState
              title="Nothing here yet"
              body="Work in progress will appear here as soon as it's under way."
            />
          ) : (
            <ul className="divide-y divide-charcoal/15">
              {projects.map((project) => (
                <li key={project.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <p className="font-sans text-[0.95rem] font-black text-charcoal">
                      {project.name}
                    </p>
                    <Badge tone={project.status === "complete" ? "published" : "new"}>
                      {label(project.status)}
                    </Badge>
                  </div>

                  {project.description ? (
                    <p className="mt-2 max-w-[60ch] font-sans text-[0.86rem] font-medium leading-[1.6] text-charcoal/65">
                      {project.description}
                    </p>
                  ) : null}

                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-2.5 flex-1 border-2 border-charcoal bg-cream">
                      <div className="h-full bg-gold" style={{ width: `${project.progress}%` }} />
                    </div>
                    <span className="font-sans text-[0.76rem] font-black tabular-nums text-charcoal/60">
                      {project.progress}%
                    </span>
                    <span className="font-sans text-[0.74rem] font-bold tabular-nums text-charcoal/45">
                      {project.due_on ? `due ${shortDate(project.due_on)}` : ""}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="flex flex-col gap-7">
          <Panel>
            <PanelHeader title="Coming up" hint="The next milestones on your work." />
            {milestones.length === 0 ? (
              <p className="px-5 py-6 font-sans text-[0.86rem] font-medium text-charcoal/55">
                Nothing scheduled.
              </p>
            ) : (
              <ul className="divide-y divide-charcoal/15">
                {milestones.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-4 px-5 py-3">
                    <p className="min-w-0 truncate font-sans text-[0.88rem] font-black text-charcoal">
                      {m.title}
                    </p>
                    <span className="shrink-0 font-sans text-[0.74rem] font-bold tabular-nums text-charcoal/55">
                      {m.due_on ? shortDate(m.due_on) : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel>
            <PanelHeader
              title="Recent invoices"
              action={
                <Link
                  href="/portal/invoices"
                  className="font-sans text-[0.62rem] font-black uppercase tracking-[0.18em] text-charcoal underline decoration-charcoal/30 underline-offset-4"
                >
                  All
                </Link>
              }
            />
            {invoices.length === 0 ? (
              <p className="px-5 py-6 font-sans text-[0.86rem] font-medium text-charcoal/55">
                Nothing issued yet.
              </p>
            ) : (
              <ul className="divide-y divide-charcoal/15">
                {invoices.map((invoice) => (
                  <li key={invoice.id} className="flex items-center justify-between gap-4 px-5 py-3">
                    <div>
                      <p className="font-sans text-[0.88rem] font-black text-charcoal">
                        {invoice.number}
                      </p>
                      <p className="font-sans text-[0.72rem] font-bold text-charcoal/45">
                        {shortDate(invoice.issue_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-sans text-[0.9rem] font-black tabular-nums text-charcoal">
                        {money(invoice.total, invoice.currency)}
                      </p>
                      <Badge tone={invoice.status}>{label(invoice.status)}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
