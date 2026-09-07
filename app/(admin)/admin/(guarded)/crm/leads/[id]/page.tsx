import { notFound } from "next/navigation";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/rbac";
import { markRead } from "../actions";
import { LeadWorkspace } from "@/components/admin/LeadWorkspace";
import {
  Badge, ButtonLink, PageHeading, Panel, PanelHeader, label,
} from "@/components/admin/ui";
import type {
  FormSubmission, Lead, LeadActivity, LeadNote, Profile,
} from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const ACTIVITY_COPY: Record<string, string> = {
  created: "Enquiry received",
  status_changed: "Status changed",
  note_added: "Note added",
  assigned: "Owner changed",
  resubmitted: "Submitted the form again",
  emailed: "Emailed",
  called: "Called",
  viewed: "Viewed",
};

/**
 * Lead detail: the pipeline control, notes, and the full activity history.
 *
 * The raw form submissions are shown alongside the lead because they are a
 * different record with a different guarantee — the lead can be edited and
 * merged, the submission is exactly what the visitor sent.
 */
export default async function LeadDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireStaff("admin");
  const supabase = await getSupabase();

  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!lead) notFound();

  const [notesRes, activityRes, staffRes, submissionsRes] = await Promise.all([
    supabase
      .from("lead_notes")
      .select("*")
      .eq("lead_id", id)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("lead_activities")
      .select("*")
      .eq("lead_id", id)
      .order("created_at", { ascending: false })
      .limit(60),
    supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .in("role", ["super_admin", "admin"])
      .eq("is_active", true),
    supabase
      .from("form_submissions")
      .select("*")
      .eq("lead_id", id)
      .order("created_at", { ascending: false }),
  ]);

  // Opening the record is what marks it read — the unread highlight is about
  // "nobody has looked at this", not "nobody has clicked a button".
  if (!lead.is_read) await markRead(id);

  const notes = (notesRes.data ?? []) as LeadNote[];
  const activity = (activityRes.data ?? []) as LeadActivity[];
  const staff = (staffRes.data ?? []) as Pick<Profile, "id" | "full_name" | "email" | "role">[];
  const submissions = (submissionsRes.data ?? []) as FormSubmission[];

  const typed = lead as Lead;

  return (
    <>
      <PageHeading
        eyebrow={
          <Link href="/admin/crm/leads" className="underline underline-offset-4">
            Leads
          </Link>
        }
        title={typed.name}
        description={[typed.company, typed.email, typed.phone]
          .filter(Boolean)
          .join(" · ")}
        action={
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={`mailto:${typed.email}`} tone="secondary">
              Email
            </ButtonLink>
            {typed.phone ? (
              <ButtonLink href={`tel:${typed.phone}`} tone="secondary">
                Call
              </ButtonLink>
            ) : null}
          </div>
        }
      />

      <div className="mb-7 flex flex-wrap gap-3">
        <Badge tone={typed.status}>{label(typed.status)}</Badge>
        <Badge tone={typed.priority}>{label(typed.priority)} priority</Badge>
        <Badge tone={typed.source === "events" ? "high" : undefined}>
          {label(typed.source)}
        </Badge>
        <Badge>Score {typed.score}</Badge>
        {typed.client_id ? <Badge tone="won">Converted to client</Badge> : null}
      </div>

      <div className="grid gap-7 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-7">
          <Panel>
            <PanelHeader title="The enquiry" />
            <dl className="grid gap-x-8 gap-y-5 p-5 sm:grid-cols-2">
              {[
                ["Budget", typed.budget],
                ["Source page", typed.source_page],
                ["Received", new Date(typed.created_at).toLocaleString("en-GB")],
                [
                  "First contacted",
                  typed.first_contacted_at
                    ? new Date(typed.first_contacted_at).toLocaleString("en-GB")
                    : "Not yet",
                ],
              ].map(([k, v]) => (
                <div key={k as string}>
                  <dt className="font-sans text-[0.58rem] font-black uppercase tracking-[0.2em] text-charcoal/45">
                    {k}
                  </dt>
                  <dd className="mt-1.5 font-sans text-[0.9rem] font-bold text-charcoal">
                    {v || "—"}
                  </dd>
                </div>
              ))}
            </dl>

            {typed.message ? (
              <div className="border-t-[3px] border-charcoal p-5">
                <p className="font-sans text-[0.58rem] font-black uppercase tracking-[0.2em] text-charcoal/45">
                  What they&apos;re looking for
                </p>
                <p className="mt-3 whitespace-pre-wrap font-sans text-[0.94rem] font-medium leading-[1.7] text-charcoal">
                  {typed.message}
                </p>
              </div>
            ) : null}
          </Panel>

          <LeadWorkspace
            leadId={typed.id}
            status={typed.status}
            priority={typed.priority}
            ownerId={typed.owner_id}
            estimatedValue={typed.estimated_value}
            hasClient={Boolean(typed.client_id)}
            staff={staff}
            notes={notes}
          />
        </div>

        <div className="flex flex-col gap-7">
          <Panel>
            <PanelHeader
              title="Activity history"
              hint="Written by the database, not the UI — it cannot drift from the record."
            />
            {activity.length === 0 ? (
              <p className="px-5 py-6 font-sans text-[0.86rem] font-medium text-charcoal/55">
                Nothing yet.
              </p>
            ) : (
              <ol className="divide-y divide-charcoal/15">
                {activity.map((entry) => {
                  const meta = entry.meta as Record<string, string> | null;
                  return (
                    <li key={entry.id} className="px-5 py-3.5">
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="font-sans text-[0.84rem] font-black text-charcoal">
                          {ACTIVITY_COPY[entry.type] ?? label(entry.type)}
                        </span>
                        <span className="shrink-0 font-sans text-[0.72rem] font-bold tabular-nums text-charcoal/50">
                          {new Date(entry.created_at).toLocaleString("en-GB", {
                            day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {entry.type === "status_changed" && meta ? (
                        <p className="mt-1 font-sans text-[0.8rem] font-medium text-charcoal/60">
                          {label(String(meta.from))} → {label(String(meta.to))}
                        </p>
                      ) : null}
                      {entry.type === "note_added" && meta?.preview ? (
                        <p className="mt-1 font-sans text-[0.8rem] font-medium text-charcoal/60">
                          “{meta.preview}”
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            )}
          </Panel>

          <Panel>
            <PanelHeader
              title="Form entries"
              hint="The raw submissions. Kept permanently, even if this lead is deleted."
            />
            {submissions.length === 0 ? (
              <p className="px-5 py-6 font-sans text-[0.86rem] font-medium text-charcoal/55">
                No stored submission — this lead was created by hand.
              </p>
            ) : (
              <ul className="divide-y divide-charcoal/15">
                {submissions.map((s) => (
                  <li key={s.id} className="px-5 py-4">
                    <div className="flex items-baseline justify-between gap-4">
                      <Badge>{s.form_key}</Badge>
                      <span className="font-sans text-[0.72rem] font-bold tabular-nums text-charcoal/50">
                        {new Date(s.created_at).toLocaleString("en-GB")}
                      </span>
                    </div>
                    <pre className="mt-3 overflow-x-auto border-2 border-charcoal/20 bg-bone/60 p-3 font-mono text-[0.72rem] leading-relaxed text-charcoal/75">
                      {JSON.stringify(s.payload, null, 2)}
                    </pre>
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
