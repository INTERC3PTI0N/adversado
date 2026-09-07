"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setSubmissionSpam } from "@/app/(admin)/admin/(guarded)/crm/submissions/actions";
import type { FormSubmission, Json } from "@/lib/supabase/types";
import { Badge, Td, label } from "./ui";

/** Internal plumbing that isn't part of what the visitor typed. */
const HIDDEN = new Set(["website", "source"]);

function entries(payload: Json): [string, string][] {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return [];

  return Object.entries(payload as Record<string, Json>)
    .filter(([k, v]) => !HIDDEN.has(k) && v !== null && v !== "")
    .map(([k, v]) => [k, typeof v === "string" ? v : JSON.stringify(v)]);
}

/**
 * One form entry, expandable to the raw payload.
 *
 * The payload is rendered from whatever keys it happens to carry rather than a
 * fixed field list. Forms change; this record is meant to stay readable for
 * entries captured by a version of the form that no longer exists.
 */
export function SubmissionRow({
  submission,
  formName,
}: {
  submission: FormSubmission;
  formName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const fields = entries(submission.payload);
  const summary = fields.find(([k]) => k === "email")?.[1]
    ?? fields[0]?.[1]
    ?? "—";
  const name = fields.find(([k]) => k === "name")?.[1];

  return (
    <>
      <tr className={submission.is_spam ? "opacity-45" : ""}>
        <Td className="whitespace-nowrap tabular-nums text-charcoal/60">
          {new Date(submission.created_at).toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Td>

        <Td>
          <span className="font-black">{name ?? summary}</span>
          {name ? (
            <span className="block text-[0.78rem] text-charcoal/55">{summary}</span>
          ) : null}
        </Td>

        <Td>
          <Badge tone={submission.form_key === "events_brief" ? "high" : undefined}>
            {formName}
          </Badge>
        </Td>

        <Td>
          {submission.lead_id ? (
            <Link
              href={`/admin/crm/leads/${submission.lead_id}`}
              className="font-black underline decoration-charcoal/30 underline-offset-4 hover:decoration-charcoal"
            >
              Open lead
            </Link>
          ) : (
            <span className="text-charcoal/35">No lead</span>
          )}
        </Td>

        <Td className="text-right">
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="border-2 border-charcoal bg-cream px-3 py-1 font-sans text-[0.6rem] font-black uppercase tracking-[0.14em] text-charcoal"
            >
              {open ? "Hide" : "View"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await setSubmissionSpam(submission.id, !submission.is_spam);
                  router.refresh();
                })
              }
              className="border-2 border-charcoal bg-cream px-3 py-1 font-sans text-[0.6rem] font-black uppercase tracking-[0.14em] text-charcoal disabled:opacity-40"
            >
              {submission.is_spam ? "Not spam" : "Spam"}
            </button>
          </div>
        </Td>
      </tr>

      {open ? (
        <tr>
          <td colSpan={5} className="border-b border-charcoal/15 bg-bone/70 px-4 py-4">
            <dl className="flex flex-col gap-3">
              {fields.map(([key, value]) => (
                <div key={key} className="grid gap-1 sm:grid-cols-[9rem_1fr]">
                  <dt className="font-sans text-[0.62rem] font-black uppercase tracking-[0.16em] text-charcoal/60">
                    {label(key)}
                  </dt>
                  <dd className="whitespace-pre-wrap font-sans text-[0.86rem] font-medium leading-[1.6] text-charcoal">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t-[3px] border-charcoal/20 pt-3 font-sans text-[0.72rem] font-bold text-charcoal/50">
              {submission.source_page ? <span>Page: {submission.source_page}</span> : null}
              {submission.ip ? <span>IP: {submission.ip}</span> : null}
              {submission.user_agent ? (
                <span className="max-w-full truncate">Agent: {submission.user_agent}</span>
              ) : null}
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
