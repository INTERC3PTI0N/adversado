"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteTask, saveTask, setTaskStatus,
} from "@/app/(admin)/admin/(guarded)/pm/actions";
import { daysUntil, shortDate } from "@/lib/format";
import type { LeadPriority, PmTask, Profile, TaskStatus } from "@/lib/supabase/types";
import { Alert, Badge, Button, Field, INPUT_CLASS, label } from "./ui";

const COLUMNS: TaskStatus[] = ["todo", "in_progress", "blocked", "review", "done"];

const blank = {
  title: "",
  description: "",
  status: "todo" as TaskStatus,
  assignee_id: "",
  due_on: "",
  priority: "normal" as LeadPriority,
};

/**
 * Task board.
 *
 * Native HTML5 drag-and-drop, same as the lead pipeline — no library. The
 * arrow buttons on every card are the accessible path: drag events never fire
 * on touch and are unreachable by keyboard, so on a phone they are the only
 * way to move a task.
 *
 * Moving a card writes the status and nothing else. The project's progress bar
 * is recomputed by a database trigger from the share of tasks that are done,
 * so it can never disagree with what is on this board.
 */
export function TaskBoard({
  projectId,
  tasks,
  staff,
}: {
  projectId: string;
  tasks: PmTask[];
  staff: Pick<Profile, "id" | "full_name" | "email">[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<TaskStatus | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [moved, setMoved] = useState<Record<string, TaskStatus>>({});
  const [editing, setEditing] = useState<PmTask | "new" | null>(null);
  const [form, setForm] = useState(blank);

  const statusOf = (task: PmTask) => moved[task.id] ?? task.status;
  const nameOf = (id: string | null) => {
    if (!id) return null;
    const person = staff.find((s) => s.id === id);
    return person ? (person.full_name ?? person.email) : null;
  };

  function move(taskId: string, to: TaskStatus) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || statusOf(task) === to) return;

    setMessage(null);
    setMoved((m) => ({ ...m, [taskId]: to }));

    startTransition(async () => {
      const result = await setTaskStatus(taskId, projectId, to);
      if (!result.ok) {
        setMoved((m) => {
          const next = { ...m };
          delete next[taskId];
          return next;
        });
        setMessage(result.error);
        return;
      }
      router.refresh();
    });
  }

  function openEditor(task: PmTask | "new") {
    setEditing(task);
    setForm(
      task === "new"
        ? blank
        : {
            title: task.title,
            description: task.description ?? "",
            status: task.status,
            assignee_id: task.assignee_id ?? "",
            due_on: task.due_on ?? "",
            priority: task.priority,
          },
    );
  }

  function submit() {
    if (!editing) return;
    setMessage(null);

    startTransition(async () => {
      const result = await saveTask(
        editing === "new" ? null : editing.id,
        projectId,
        {
          ...form,
          assignee_id: form.assignee_id || null,
          due_on: form.due_on || null,
        },
      );

      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setEditing(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {message ? <Alert tone="error">{message}</Alert> : null}

      <div className="flex justify-end">
        <Button onClick={() => openEditor("new")}>Add task</Button>
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-3">
        <div className="flex min-w-max gap-5">
          {COLUMNS.map((column) => {
            const inColumn = tasks.filter((t) => statusOf(t) === column);
            const isTarget = over === column;

            return (
              <section
                key={column}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOver(column);
                }}
                onDragLeave={() => setOver((s) => (s === column ? null : s))}
                onDrop={(e) => {
                  e.preventDefault();
                  setOver(null);
                  if (dragging) move(dragging, column);
                  setDragging(null);
                }}
                className={`flex w-[16.5rem] shrink-0 flex-col border-[3px] transition-colors duration-150 ${
                  isTarget
                    ? "border-gold bg-gold/15"
                    : "border-charcoal bg-cream shadow-[5px_5px_0_0_#212121]"
                }`}
              >
                <header className="flex items-baseline justify-between gap-2 border-b-[3px] border-charcoal px-4 py-3">
                  <h3 className="font-sans text-[0.66rem] font-black uppercase tracking-[0.2em] text-charcoal">
                    {label(column)}
                  </h3>
                  <span className="font-sans text-[0.78rem] font-black tabular-nums text-charcoal/50">
                    {inColumn.length}
                  </span>
                </header>

                <div className="flex min-h-[6rem] flex-col gap-3 p-3">
                  {inColumn.length === 0 ? (
                    <p className="px-1 py-4 font-sans text-[0.74rem] font-medium text-charcoal/35">
                      Nothing here.
                    </p>
                  ) : (
                    inColumn.map((task) => {
                      const index = COLUMNS.indexOf(statusOf(task));
                      const days = daysUntil(task.due_on);
                      const late = days !== null && days < 0 && statusOf(task) !== "done";

                      return (
                        <article
                          key={task.id}
                          draggable={!pending}
                          onDragStart={() => setDragging(task.id)}
                          onDragEnd={() => {
                            setDragging(null);
                            setOver(null);
                          }}
                          className={`border-[3px] border-charcoal bg-bone p-3 ${
                            dragging === task.id ? "opacity-40" : ""
                          } ${pending ? "" : "cursor-grab active:cursor-grabbing"}`}
                        >
                          <button
                            type="button"
                            onClick={() => openEditor(task)}
                            className="block w-full text-left font-sans text-[0.86rem] font-black leading-tight text-charcoal underline decoration-charcoal/25 underline-offset-4 hover:decoration-charcoal"
                          >
                            {task.title}
                          </button>

                          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                            {task.priority !== "normal" ? (
                              <Badge tone={task.priority}>{label(task.priority)}</Badge>
                            ) : null}
                            {nameOf(task.assignee_id) ? (
                              <span className="font-sans text-[0.7rem] font-bold text-charcoal/55">
                                {nameOf(task.assignee_id)}
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-2 border-t-[3px] border-charcoal/15 pt-2.5">
                            <span
                              className={`font-sans text-[0.66rem] font-bold tabular-nums ${
                                late ? "text-[#c8322a]" : "text-charcoal/40"
                              }`}
                            >
                              {task.due_on ? shortDate(task.due_on) : "No date"}
                              {late ? ` · ${Math.abs(days!)}d late` : ""}
                            </span>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                disabled={pending || index === 0}
                                onClick={() => move(task.id, COLUMNS[index - 1])}
                                aria-label={`Move ${task.title} back`}
                                className="border-2 border-charcoal px-2 py-0.5 font-sans text-[0.66rem] font-black text-charcoal disabled:opacity-25"
                              >
                                ←
                              </button>
                              <button
                                type="button"
                                disabled={pending || index === COLUMNS.length - 1}
                                onClick={() => move(task.id, COLUMNS[index + 1])}
                                aria-label={`Move ${task.title} forward`}
                                className="border-2 border-charcoal px-2 py-0.5 font-sans text-[0.66rem] font-black text-charcoal disabled:opacity-25"
                              >
                                →
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-charcoal/70 p-5 sm:p-10">
          <div className="w-full max-w-[36rem] border-[4px] border-charcoal bg-cream shadow-[12px_12px_0_0_#212121]">
            <div className="border-b-[3px] border-charcoal px-5 py-4">
              <h2 className="font-sans text-[0.72rem] font-black uppercase tracking-[0.24em] text-charcoal">
                {editing === "new" ? "New task" : "Edit task"}
              </h2>
            </div>

            <div className="flex flex-col gap-5 p-5">
              <Field label="Title" required>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className={INPUT_CLASS}
                />
              </Field>

              <Field label="Description">
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className={`${INPUT_CLASS} resize-y`}
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Status">
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TaskStatus }))}
                    className={`${INPUT_CLASS} appearance-none`}
                  >
                    {COLUMNS.map((s) => (
                      <option key={s} value={s}>
                        {label(s)}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Priority">
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, priority: e.target.value as LeadPriority }))
                    }
                    className={`${INPUT_CLASS} appearance-none`}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </Field>

                <Field label="Assignee">
                  <select
                    value={form.assignee_id}
                    onChange={(e) => setForm((f) => ({ ...f, assignee_id: e.target.value }))}
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

                <Field label="Due">
                  <input
                    type="date"
                    value={form.due_on}
                    onChange={(e) => setForm((f) => ({ ...f, due_on: e.target.value }))}
                    className={INPUT_CLASS}
                  />
                </Field>
              </div>
            </div>

            <div className="flex flex-wrap justify-between gap-3 border-t-[3px] border-charcoal p-5">
              {editing !== "new" ? (
                <Button
                  tone="danger"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const r = await deleteTask(editing.id, projectId);
                      if (r.ok) {
                        setEditing(null);
                        router.refresh();
                      } else setMessage(r.error);
                    })
                  }
                >
                  Delete
                </Button>
              ) : (
                <span />
              )}

              <div className="flex gap-3">
                <Button tone="secondary" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button onClick={submit} disabled={pending || !form.title.trim()}>
                  {pending ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
