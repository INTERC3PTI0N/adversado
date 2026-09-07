"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  archiveProject, deleteMilestone, saveMilestone, saveProject, toggleMilestone,
} from "@/app/(admin)/admin/(guarded)/pm/actions";
import { shortDate } from "@/lib/format";
import type { PmProject, Profile, ProjectStatus } from "@/lib/supabase/types";
import {
  Alert, Button, Field, INPUT_CLASS, Panel, PanelHeader, label,
} from "./ui";

type Milestone = {
  id: string;
  title: string;
  due_on: string | null;
  completed_at: string | null;
};

const STATUSES: ProjectStatus[] = ["planning", "in_progress", "on_hold", "review", "complete"];

export function ProjectForm({
  project,
  milestones,
  clients,
  staff,
  prefillClientId,
}: {
  project: PmProject | null;
  milestones: Milestone[];
  clients: { id: string; name: string }[];
  staff: Pick<Profile, "id" | "full_name" | "email">[];
  prefillClientId?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [milestone, setMilestone] = useState({ title: "", due: "" });

  const [form, setForm] = useState({
    name: project?.name ?? "",
    client_id: project?.client_id ?? prefillClientId ?? "",
    status: project?.status ?? ("planning" as ProjectStatus),
    starts_on: project?.starts_on ?? "",
    due_on: project?.due_on ?? "",
    owner_id: project?.owner_id ?? "",
    description: project?.description ?? "",
    budget: project?.budget?.toString() ?? "",
    is_visible_to_client: project?.is_visible_to_client ?? true,
  });

  function run(fn: () => Promise<{ ok: true } | { ok: false; error: string }>, success?: string) {
    setMessage(null);
    startTransition(async () => {
      const result = await fn();
      if (result.ok) {
        if (success) setMessage({ tone: "success", text: success });
        router.refresh();
      } else {
        setMessage({ tone: "error", text: result.error });
      }
    });
  }

  function submit() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveProject(project?.id ?? null, {
        name: form.name,
        client_id: form.client_id || null,
        status: form.status,
        starts_on: form.starts_on || null,
        due_on: form.due_on || null,
        owner_id: form.owner_id || null,
        description: form.description,
        budget: form.budget === "" ? null : Number(form.budget),
        is_visible_to_client: form.is_visible_to_client,
      });

      if (!result.ok) {
        setMessage({ tone: "error", text: result.error });
        return;
      }

      if (!project) router.replace(`/admin/pm/${result.id}`);
      else {
        setMessage({ tone: "success", text: "Saved." });
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-7">
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}

      <Panel>
        <PanelHeader title="Project" />
        <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-6">
          <Field label="Name" required>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={INPUT_CLASS}
            />
          </Field>

          <Field label="Client">
            <select
              value={form.client_id}
              onChange={(e) => setForm((f) => ({ ...f, client_id: e.target.value }))}
              className={`${INPUT_CLASS} appearance-none`}
            >
              <option value="">No client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ProjectStatus }))}
              className={`${INPUT_CLASS} appearance-none`}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Owner">
            <select
              value={form.owner_id}
              onChange={(e) => setForm((f) => ({ ...f, owner_id: e.target.value }))}
              className={`${INPUT_CLASS} appearance-none`}
            >
              <option value="">Unassigned</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name ?? s.email}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Starts">
            <input
              type="date"
              value={form.starts_on}
              onChange={(e) => setForm((f) => ({ ...f, starts_on: e.target.value }))}
              className={INPUT_CLASS}
            />
          </Field>

          <Field label="Due">
            <input
              type="date"
              value={form.due_on}
              onChange={(e) => setForm((f) => ({ ...f, due_on: e.target.value }))}
              className={INPUT_CLASS}
            />
          </Field>

          <Field label="Budget">
            <input
              type="number"
              min="0"
              value={form.budget}
              onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
              className={INPUT_CLASS}
            />
          </Field>

          <Field
            label="Show in the client portal"
            help="Off hides the project and its tasks from the client entirely."
          >
            <label className="inline-flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.is_visible_to_client}
                onChange={(e) =>
                  setForm((f) => ({ ...f, is_visible_to_client: e.target.checked }))
                }
                className="h-5 w-5 border-[3px] border-charcoal accent-gold"
              />
              <span className="font-sans text-[0.84rem] font-bold text-charcoal">Visible</span>
            </label>
          </Field>

          <div className="sm:col-span-2">
            <Field label="Description">
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className={`${INPUT_CLASS} resize-y`}
              />
            </Field>
          </div>
        </div>

        <div className="flex flex-wrap justify-between gap-3 border-t-[3px] border-charcoal p-5">
          {project ? (
            confirmArchive ? (
              <div className="flex gap-3">
                <Button
                  tone="danger"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const r = await archiveProject(project.id);
                      if (r.ok) router.push("/admin/pm");
                      else setMessage({ tone: "error", text: r.error });
                    })
                  }
                >
                  Really archive
                </Button>
                <Button tone="secondary" onClick={() => setConfirmArchive(false)}>
                  Keep
                </Button>
              </div>
            ) : (
              <Button tone="secondary" onClick={() => setConfirmArchive(true)}>
                Archive
              </Button>
            )
          ) : (
            <span />
          )}

          <Button onClick={submit} disabled={pending || !form.name.trim()}>
            {pending ? "Saving…" : project ? "Save changes" : "Create project"}
          </Button>
        </div>
      </Panel>

      {project ? (
        <Panel>
          <PanelHeader
            title="Milestones"
            hint="The dates the client cares about. Separate from tasks, which are how you get there."
          />

          <div className="grid gap-4 border-b-[3px] border-charcoal bg-bone/60 p-5 sm:grid-cols-[1fr_11rem_auto] sm:items-end">
            <Field label="Title">
              <input
                value={milestone.title}
                onChange={(e) => setMilestone((m) => ({ ...m, title: e.target.value }))}
                placeholder="Brand guidelines delivered"
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Due">
              <input
                type="date"
                value={milestone.due}
                onChange={(e) => setMilestone((m) => ({ ...m, due: e.target.value }))}
                className={INPUT_CLASS}
              />
            </Field>
            <Button
              disabled={pending || !milestone.title.trim()}
              onClick={() =>
                run(async () => {
                  const r = await saveMilestone(
                    null,
                    project.id,
                    milestone.title,
                    milestone.due || null,
                  );
                  if (r.ok) setMilestone({ title: "", due: "" });
                  return r;
                }, "Milestone added.")
              }
            >
              Add
            </Button>
          </div>

          {milestones.length === 0 ? (
            <p className="px-5 py-6 font-sans text-[0.86rem] font-medium text-charcoal/55">
              No milestones yet.
            </p>
          ) : (
            <ul className="divide-y divide-charcoal/15">
              {milestones.map((m) => (
                <li key={m.id} className="flex items-center gap-4 px-5 py-3">
                  <input
                    type="checkbox"
                    checked={Boolean(m.completed_at)}
                    disabled={pending}
                    onChange={(e) =>
                      run(() => toggleMilestone(m.id, project.id, e.target.checked))
                    }
                    aria-label={`Mark ${m.title} complete`}
                    className="h-5 w-5 shrink-0 border-[3px] border-charcoal accent-gold"
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate font-sans text-[0.88rem] font-black ${
                        m.completed_at ? "text-charcoal/40 line-through" : "text-charcoal"
                      }`}
                    >
                      {m.title}
                    </p>
                    <p className="font-sans text-[0.72rem] font-bold text-charcoal/45">
                      {m.due_on ? shortDate(m.due_on) : "No date"}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => deleteMilestone(m.id, project.id), "Removed.")}
                    className="shrink-0 border-2 border-charcoal bg-cream px-3 py-1 font-sans text-[0.6rem] font-black uppercase tracking-[0.14em] text-charcoal disabled:opacity-40"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      ) : null}
    </div>
  );
}
