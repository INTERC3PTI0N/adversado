"use client";

import { useState } from "react";
import type { AuditEntry, Json } from "@/lib/supabase/types";
import { Badge, Td, label } from "./ui";

const ACTION_TONE: Record<string, string> = {
  insert: "won",
  update: "new",
  delete: "urgent",
};

/** Columns that change on every write and say nothing about intent. */
const NOISE = new Set(["updated_at", "created_at", "search_vector"]);

type Row = Record<string, Json | undefined>;

/**
 * Which fields actually changed, old value beside new.
 *
 * The trigger stores whole `to_jsonb(row)` snapshots, so showing them raw
 * buries one edited headline in forty unchanged columns. Diffing at read time
 * costs nothing and is the only reason this screen is legible.
 */
function diff(before: Json | null, after: Json | null) {
  const a = (before ?? {}) as Row;
  const b = (after ?? {}) as Row;
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(
    (k) => !NOISE.has(k),
  );

  return keys
    .map((key) => ({ key, from: a[key], to: b[key] }))
    .filter(({ from, to }) => JSON.stringify(from) !== JSON.stringify(to));
}

function show(value: Json | undefined): string {
  if (value === undefined || value === null) return "—";
  if (typeof value === "string") return value === "" ? '""' : value;
  return JSON.stringify(value, null, 2);
}

export function AuditRow({
  entry,
  actor,
}: {
  entry: AuditEntry;
  actor: string | null;
}) {
  const [open, setOpen] = useState(false);
  const changes = diff(entry.before, entry.after);

  return (
    <>
      <tr>
        <Td className="whitespace-nowrap tabular-nums text-charcoal/60">
          {new Date(entry.created_at).toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Td>
        <Td>{actor ?? <span className="text-charcoal/35">System</span>}</Td>
        <Td>
          <Badge tone={ACTION_TONE[entry.action]}>{label(entry.action)}</Badge>
        </Td>
        <Td>
          <span className="font-black">{label(entry.entity)}</span>
          {entry.entity_id ? (
            <span className="block font-mono text-[0.68rem] text-charcoal/45">
              {entry.entity_id.slice(0, 8)}
            </span>
          ) : null}
        </Td>
        <Td className="text-right">
          {changes.length === 0 ? (
            <span className="text-charcoal/35">—</span>
          ) : (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="border-2 border-charcoal bg-cream px-3 py-1 font-sans text-[0.6rem] font-black uppercase tracking-[0.14em] text-charcoal"
            >
              {open ? "Hide" : `${changes.length} field${changes.length === 1 ? "" : "s"}`}
            </button>
          )}
        </Td>
      </tr>

      {open ? (
        <tr>
          <td colSpan={5} className="border-b border-charcoal/15 bg-bone/70 px-4 py-4">
            <dl className="flex flex-col gap-3">
              {changes.map(({ key, from, to }) => (
                <div key={key} className="grid gap-2 sm:grid-cols-[10rem_1fr_1fr]">
                  <dt className="font-sans text-[0.62rem] font-black uppercase tracking-[0.16em] text-charcoal/60">
                    {label(key)}
                  </dt>
                  <dd className="min-w-0 border-l-[3px] border-charcoal/25 pl-3">
                    <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-[0.72rem] leading-[1.5] text-charcoal/50 line-through decoration-charcoal/30">
                      {show(from)}
                    </pre>
                  </dd>
                  <dd className="min-w-0 border-l-[3px] border-gold pl-3">
                    <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-[0.72rem] leading-[1.5] text-charcoal">
                      {show(to)}
                    </pre>
                  </dd>
                </div>
              ))}
            </dl>
          </td>
        </tr>
      ) : null}
    </>
  );
}
