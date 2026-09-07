"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLeadStatus } from "@/app/(admin)/admin/(guarded)/crm/leads/actions";
import type { Lead, LeadStatus } from "@/lib/supabase/types";
import { Alert, Badge, label } from "./ui";

const COLUMNS: { status: LeadStatus; hint: string }[] = [
  { status: "new", hint: "Nobody has picked it up" },
  { status: "contacted", hint: "Reached out, waiting" },
  { status: "qualified", hint: "Worth pursuing" },
  { status: "proposal", hint: "Numbers are out" },
  { status: "negotiation", hint: "Closing" },
  { status: "won", hint: "Signed" },
  { status: "lost", hint: "Not this time" },
];

const currency = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    notation: n >= 100000 ? "compact" : "standard",
  }).format(n);

/**
 * Pipeline board.
 *
 * Drag-and-drop uses the browser's native HTML5 API — no library, and the
 * whole implementation is the four handlers below.
 *
 * Every card also carries ← → buttons. That is not a fallback bolted on: native
 * drag events never fire on touch, and they are unreachable by keyboard, so on
 * a phone or via the keyboard the buttons are the only way to move a lead.
 * They are the real control; dragging is the shortcut.
 */
export function PipelineBoard({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<LeadStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Optimistic: the card moves on drop, and snaps back if the server refuses.
  const [moved, setMoved] = useState<Record<string, LeadStatus>>({});
  const statusOf = (lead: Lead) => moved[lead.id] ?? lead.status;

  function move(leadId: string, to: LeadStatus) {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || statusOf(lead) === to) return;

    setError(null);
    setMoved((m) => ({ ...m, [leadId]: to }));

    startTransition(async () => {
      const result = await setLeadStatus(leadId, to);
      if (!result.ok) {
        setMoved((m) => {
          const next = { ...m };
          delete next[leadId];
          return next;
        });
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const shift = (lead: Lead, direction: -1 | 1) => {
    const i = COLUMNS.findIndex((c) => c.status === statusOf(lead));
    const next = COLUMNS[i + direction];
    if (next) move(lead.id, next.status);
  };

  return (
    <div className="flex flex-col gap-5">
      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="-mx-1 overflow-x-auto px-1 pb-3">
        <div className="flex min-w-max gap-5">
          {COLUMNS.map((column) => {
            const inColumn = leads.filter((l) => statusOf(l) === column.status);
            const value = inColumn.reduce((a, l) => a + (l.estimated_value ?? 0), 0);
            const isTarget = over === column.status;

            return (
              <section
                key={column.status}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOver(column.status);
                }}
                onDragLeave={() => setOver((s) => (s === column.status ? null : s))}
                onDrop={(e) => {
                  e.preventDefault();
                  setOver(null);
                  if (dragging) move(dragging, column.status);
                  setDragging(null);
                }}
                className={`flex w-[16.5rem] shrink-0 flex-col border-[3px] transition-colors duration-150 ${
                  isTarget
                    ? "border-gold bg-gold/15"
                    : "border-charcoal bg-cream shadow-[5px_5px_0_0_#212121]"
                }`}
              >
                <header className="border-b-[3px] border-charcoal px-4 py-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <h2 className="font-sans text-[0.66rem] font-black uppercase tracking-[0.2em] text-charcoal">
                      {label(column.status)}
                    </h2>
                    <span className="font-sans text-[0.78rem] font-black tabular-nums text-charcoal/50">
                      {inColumn.length}
                    </span>
                  </div>
                  <p className="mt-1 font-sans text-[0.68rem] font-bold text-charcoal/45">
                    {value > 0 ? currency(value) : column.hint}
                  </p>
                </header>

                <div className="flex min-h-[6rem] flex-col gap-3 p-3">
                  {inColumn.length === 0 ? (
                    <p className="px-1 py-4 font-sans text-[0.74rem] font-medium text-charcoal/35">
                      Nothing here.
                    </p>
                  ) : (
                    inColumn.map((lead) => {
                      const index = COLUMNS.findIndex((c) => c.status === statusOf(lead));

                      return (
                        <article
                          key={lead.id}
                          draggable={!pending}
                          onDragStart={() => setDragging(lead.id)}
                          onDragEnd={() => {
                            setDragging(null);
                            setOver(null);
                          }}
                          className={`border-[3px] border-charcoal bg-bone p-3 ${
                            dragging === lead.id ? "opacity-40" : ""
                          } ${pending ? "" : "cursor-grab active:cursor-grabbing"}`}
                        >
                          <Link
                            href={`/admin/crm/leads/${lead.id}`}
                            className="block font-sans text-[0.86rem] font-black leading-tight text-charcoal underline decoration-charcoal/25 underline-offset-4 hover:decoration-charcoal"
                          >
                            {lead.name}
                          </Link>

                          {lead.company ? (
                            <p className="mt-1 truncate font-sans text-[0.74rem] font-medium text-charcoal/55">
                              {lead.company}
                            </p>
                          ) : null}

                          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                            {lead.source === "events" ? <Badge tone="high">Events</Badge> : null}
                            {lead.priority !== "normal" ? (
                              <Badge tone={lead.priority}>{label(lead.priority)}</Badge>
                            ) : null}
                            {lead.estimated_value ? (
                              <span className="font-sans text-[0.7rem] font-black tabular-nums text-charcoal/60">
                                {currency(lead.estimated_value)}
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-2 border-t-[3px] border-charcoal/15 pt-2.5">
                            <span className="font-sans text-[0.66rem] font-bold tabular-nums text-charcoal/40">
                              {new Date(lead.created_at).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                              })}
                            </span>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                disabled={pending || index === 0}
                                onClick={() => shift(lead, -1)}
                                aria-label={`Move ${lead.name} back`}
                                className="border-2 border-charcoal px-2 py-0.5 font-sans text-[0.66rem] font-black text-charcoal disabled:opacity-25"
                              >
                                ←
                              </button>
                              <button
                                type="button"
                                disabled={pending || index === COLUMNS.length - 1}
                                onClick={() => shift(lead, 1)}
                                aria-label={`Move ${lead.name} forward`}
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
    </div>
  );
}
