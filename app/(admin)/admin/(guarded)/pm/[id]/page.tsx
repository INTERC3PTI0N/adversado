import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabase } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/rbac";
import { PageHeading, Panel, PanelHeader, Stat } from "@/components/admin/ui";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { TaskBoard } from "@/components/admin/TaskBoard";
import { money, shortDate } from "@/lib/format";
import type { Client, PmProject, PmTask, Profile } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireStaff("admin");
  const { id } = await params;
  const sp = await searchParams;

  const isNew = id === "new";
  const supabase = await getSupabase();

  const [projectRes, tasksRes, milestonesRes, clientsRes, staffRes] = await Promise.all([
    isNew ? { data: null } : supabase.from("pm_projects").select("*").eq("id", id).single(),
    isNew ? { data: [] } : supabase.from("pm_tasks").select("*").eq("project_id", id).order("position"),
    isNew ? { data: [] } : supabase.from("pm_milestones").select("id, title, due_on, completed_at").eq("project_id", id).order("due_on", { nullsFirst: false }),
    supabase.from("clients").select("id, name").is("deleted_at", null).order("name"),
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("role", ["super_admin", "admin", "editor"])
      .eq("is_active", true)
      .order("full_name"),
  ]);

  const project = (projectRes.data ?? null) as PmProject | null;
  if (!isNew && !project) notFound();

  const tasks = (tasksRes.data ?? []) as PmTask[];
  const milestones = milestonesRes.data ?? [];
  const clients = (clientsRes.data ?? []) as Pick<Client, "id" | "name">[];
  const staff = (staffRes.data ?? []) as Pick<Profile, "id" | "full_name" | "email">[];

  const prefill = clients.some((c) => c.id === sp.client) ? sp.client! : null;
  const done = tasks.filter((t) => t.status === "done").length;

  return (
    <>
      <PageHeading
        eyebrow={
          <Link href="/admin/pm" className="underline decoration-charcoal/30 underline-offset-4">
            Projects
          </Link>
        }
        title={project?.name ?? "New project"}
        description={
          project
            ? `${project.due_on ? `Due ${shortDate(project.due_on)}` : "No due date"}${
                project.budget ? ` · ${money(project.budget)}` : ""
              }`
            : "Create the project, then build its task board."
        }
      />

      {project ? (
        <>
          <div className="mb-7 grid gap-5 sm:grid-cols-3">
            <Stat label="Progress" value={`${project.progress}%`} tone="gold" hint="Share of tasks done" />
            <Stat label="Tasks" value={tasks.length} hint={`${done} complete`} />
            <Stat
              label="Milestones"
              value={milestones.length}
              tone="navy"
              hint={`${milestones.filter((m) => m.completed_at).length} hit`}
            />
          </div>

          <div className="mb-7">
            <Panel className="p-0">
              <PanelHeader
                title="Task board"
                hint="Drag a card between columns, or use the arrows on it."
              />
              <div className="p-5">
                <TaskBoard projectId={project.id} tasks={tasks} staff={staff} />
              </div>
            </Panel>
          </div>
        </>
      ) : null}

      <ProjectForm
        project={project}
        milestones={milestones}
        clients={clients}
        staff={staff}
        prefillClientId={prefill}
      />
    </>
  );
}
