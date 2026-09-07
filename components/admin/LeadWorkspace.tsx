"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addLeadNote,
  convertToClient,
  setLeadFields,
  setLeadStatus,
} from "@/app/(admin)/admin/(guarded)/crm/leads/actions";
import type {
  LeadNote,
  LeadPriority,
  LeadStatus,
  Profile,
} from "@/lib/supabase/types";
import {
  Alert, Badge, Button, Field, INPUT_CLASS, Panel, PanelHeader, label,
} from "./ui";

const PIPELINE: LeadStatus[] = [
  "new", "contacted", "qualified", "proposal", "negotiation", "won", "lost",
];

/**
 * Pipeline control, assignment and notes.
 *
 * The pipeline is a row of buttons rather than a dropdown: moving a lead along
 * is the most common action on this screen, and it should be one click with
 * the whole path visible.
 */
export function LeadWorkspace({
  leadId, status, priority, ownerId, estimatedValue, hasClient, staff, notes,
}: {
  leadId: string;
  status: LeadStatus;
  priority: LeadPriority;
  ownerId: string | null;
  estimatedValue: number | null;
  hasClient: boolean;
  staff: Pick<Profile, "id" | "full_name" | "email" | "role">[];
  notes: LeadNote[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [lostReason, setLostReason] = useState("");
  const [value, setValue] = useState(estimatedValue?.toString() ?? "");
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);

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

  return (
    <div className="flex flex-col gap-7">
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}

      <Panel>
        <PanelHeader title="Pipeline" hint="Every move is written to the activity history." />

        <div className="flex flex-wrap gap-2 p-5">
          {PIPELINE.map((s) => (
            <button
              key={s}
              type="button"
              disabled={pending || s === status}
              onClick={() => run(() => setLeadStatus(leadId, s, lostReason))}
              className={`border-[3px] border-charcoal px-4 py-2 font-sans text-[0.62rem] font-black uppercase tracking-[0.14em] transition-transform disabled:cursor-default ${
                s === status
                  ? "bg-charcoal text-gold"
                  : "bg-cream text-charcoal hover:-translate-y-0.5"
              }`}
            >
              {label(s)}
            </button>
          ))}
        </div>

        {status === "lost" ? (
          <div className="border-t-[3px] border-charcoal p-5">
            <Field label="Why was it lost?" help="Saved with the status change.">
              <input
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                onBlur={() => run(() => setLeadStatus(leadId, "lost", lostReason))}
                className={INPUT_CLASS}
              />
            </Field>
          </div>
        ) : null}

        <div className="grid gap-5 border-t-[3px] border-charcoal p-5 sm:grid-cols-3">
          <Field label="Priority">
            <select
              value={priority}
              disabled={pending}
              onChange={(e) =>
                run(() => setLeadFields(leadId, { priority: e.target.value as LeadPriority }))
              }
              className={`${INPUT_CLASS} appearance-none`}
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </Field>

          <Field label="Owner">
            <select
              value={ownerId ?? ""}
              disabled={pending}
              onChange={(e) =>
                run(() => setLeadFields(leadId, { owner_id: e.target.value || null }))
              }
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

          <Field label="Estimated value" help="Feeds the pipeline total.">
            <input
              type="number"
              min="0"
              value={value}
              disabled={pending}
              onChange={(e) => setValue(e.target.value)}
              onBlur={() =>
                run(() =>
                  setLeadFields(leadId, {
                    estimated_value: value === "" ? null : Number(value),
                  }),
                )
              }
              className={INPUT_CLASS}
            />
          </Field>
        </div>

        {!hasClient ? (
          <div className="flex flex-wrap items-center justify-between gap-4 border-t-[3px] border-charcoal p-5">
            <p className="max-w-[44ch] font-sans text-[0.84rem] font-medium text-charcoal/65">
              Won it? Create a client record so you can invoice them and switch
              on their portal.
            </p>
            <Button
              tone="dark"
              disabled={pending}
              onClick={() => run(() => convertToClient(leadId), "Client created.")}
            >
              Convert to client
            </Button>
          </div>
        ) : null}
      </Panel>

      <Panel>
        <PanelHeader title="Notes" hint="Internal. Never shown to the client." />

        <div className="border-b-[3px] border-charcoal p-5">
          <Field label="Add a note">
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={`${INPUT_CLASS} resize-y`}
            />
          </Field>
          <div className="mt-4 flex justify-end">
            <Button
              disabled={pending || !note.trim()}
              onClick={() =>
                run(async () => {
                  const r = await addLeadNote(leadId, note);
                  if (r.ok) setNote("");
                  return r;
                })
              }
            >
              {pending ? "Saving…" : "Add note"}
            </Button>
          </div>
        </div>

        {notes.length === 0 ? (
          <p className="px-5 py-6 font-sans text-[0.86rem] font-medium text-charcoal/55">
            No notes yet.
          </p>
        ) : (
          <ul className="divide-y divide-charcoal/15">
            {notes.map((n) => (
              <li key={n.id} className="px-5 py-4">
                <div className="mb-2 flex items-center gap-3">
                  {n.is_pinned ? <Badge tone="high">Pinned</Badge> : null}
                  <span className="font-sans text-[0.72rem] font-bold tabular-nums text-charcoal/50">
                    {new Date(n.created_at).toLocaleString("en-GB")}
                  </span>
                </div>
                <p className="whitespace-pre-wrap font-sans text-[0.9rem] font-medium leading-[1.65] text-charcoal">
                  {n.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
