import { getSupabase } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/rbac";
import {
  ButtonLink, EmptyState, PageHeading, Pagination, Panel, Stat, Table, Th,
} from "@/components/admin/ui";
import { FilterBar } from "@/components/admin/FilterBar";
import { SubmissionRow } from "@/components/admin/SubmissionRow";
import type { FormSubmission } from "@/lib/supabase/types";

export const metadata = { title: "Form entries — Adversado Admin" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 40;

/**
 * Every form entry, ever.
 *
 * Separate from Leads on purpose. A lead can be merged, reassigned or deleted;
 * this table is the untouched record of what was actually submitted, which is
 * the only thing that settles "we never received that enquiry". Events entries
 * carry their own form key, so they filter apart from the rest of the site
 * without needing a second table.
 */
export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireStaff("admin");
  const sp = await searchParams;

  const supabase = await getSupabase();

  // Form keys come from the table rather than a constant, so a form added in
  // the admin appears in this filter without a code change.
  const { data: formRows } = await supabase
    .from("forms")
    .select("key, name")
    .order("name");

  const forms = formRows ?? [];
  const formNames = new Map(forms.map((f) => [f.key, f.name]));

  const formKey = forms.some((f) => f.key === sp.form) ? sp.form! : "";
  const q = sp.q?.trim() ?? "";
  const spam = sp.spam === "1";
  const orphan = sp.orphan === "1";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  let query = supabase
    .from("form_submissions")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (formKey) query = query.eq("form_key", formKey);
  // Spam is hidden unless asked for — it is kept, not shown by default.
  query = query.eq("is_spam", spam);
  if (orphan) query = query.is("lead_id", null);
  if (q) {
    // Matches the two fields every form carries, inside the jsonb payload.
    query = query.or(`payload->>email.ilike.%${q}%,payload->>name.ilike.%${q}%`);
  }

  const [{ data, count }, totalRes, eventsRes] = await Promise.all([
    query,
    supabase.from("form_submissions").select("id", { count: "exact", head: true }),
    supabase
      .from("form_submissions")
      .select("id", { count: "exact", head: true })
      .eq("form_key", "events_brief"),
  ]);

  const submissions = (data ?? []) as FormSubmission[];
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const allTime = totalRes.count ?? 0;
  const eventsTotal = eventsRes.count ?? 0;

  const exportHref = `/api/admin/submissions/export?${new URLSearchParams(
    Object.entries({ q, form: formKey, spam: spam ? "1" : "", orphan: orphan ? "1" : "" })
      .filter(([, v]) => v) as [string, string][],
  )}`;

  return (
    <>
      <PageHeading
        eyebrow="CRM"
        title="Form entries"
        description="The permanent record of every submission. Nothing here can be edited or deleted — leads are built from these, not the other way round."
        action={
          <ButtonLink href={exportHref} tone="secondary">
            Export CSV
          </ButtonLink>
        }
      />

      <div className="mb-7 grid gap-5 sm:grid-cols-3">
        <Stat label="All entries" value={allTime} hint="Since the site went live" />
        <Stat label="Events briefs" value={eventsTotal} tone="navy" />
        <Stat
          label="Website forms"
          value={allTime - eventsTotal}
          hint="Contact, home and audit"
        />
      </div>

      <FilterBar
        basePath="/admin/crm/submissions"
        searchLabel="Search"
        searchPlaceholder="Name or email"
        values={{ q, form: formKey, spam: spam ? "1" : "", orphan: orphan ? "1" : "" }}
        selects={[
          {
            key: "form",
            label: "Form",
            options: [
              { value: "", label: "All forms" },
              ...forms.map((f) => ({ value: f.key, label: f.name })),
            ],
          },
        ]}
        toggles={[
          { key: "orphan", label: "No lead" },
          { key: "spam", label: "Spam only" },
        ]}
      />

      <Panel className="mt-6">
        {submissions.length === 0 ? (
          <EmptyState
            title={q || formKey || orphan ? "Nothing matches" : spam ? "No spam" : "No entries yet"}
            body={
              q || formKey || orphan
                ? "Try a different search or clear the filters."
                : "Every submission from the contact, home, events and audit forms lands here the moment it arrives."
            }
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>When</Th>
                  <Th>From</Th>
                  <Th>Form</Th>
                  <Th>Lead</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <SubmissionRow
                    key={submission.id}
                    submission={submission}
                    formName={formNames.get(submission.form_key) ?? submission.form_key}
                  />
                ))}
              </tbody>
            </Table>

            <Pagination
              basePath="/admin/crm/submissions"
              page={page}
              pages={pages}
              total={total}
              noun="entry"
              plural="entries"
              params={{ q, form: formKey, spam: spam ? "1" : "", orphan: orphan ? "1" : "" }}
            />
          </>
        )}
      </Panel>
    </>
  );
}
