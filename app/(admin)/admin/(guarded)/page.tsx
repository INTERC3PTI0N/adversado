import Link from "next/link";
import { getSupabase } from "@/lib/supabase/server";
import { requireStaff, isAdmin, ROLE_LABEL } from "@/lib/auth/rbac";
import {
  Alert,
  Badge,
  ButtonLink,
  EmptyState,
  PageHeading,
  Panel,
  PanelHeader,
  Stat,
  Table,
  Td,
  Th,
  label,
} from "@/components/admin/ui";
import type { Lead } from "@/lib/supabase/types";

export const metadata = { title: "Dashboard — Adversado Admin" };
export const dynamic = "force-dynamic";

const currency = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

/**
 * Admin dashboard.
 *
 * Aggregates come from the SQL views in migration 0005 rather than being
 * counted in JS — one round trip, and the numbers are computed where the data
 * is. An editor sees the content half only; the CRM half is admin-gated both
 * here and by RLS, so a missing check here still returns nothing.
 */
export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { profile } = await requireStaff("editor");
  // `requireStaff` bounces here with ?denied=1 when someone lacks the role for
  // a page. Without this the refusal is silent, and a page you may not open
  // looks exactly like a page that is broken.
  const denied = (await searchParams).denied === "1";
  const supabase = await getSupabase();
  const admin = isAdmin(profile.role);

  const [pipelineRes, recentRes, scheduledRes, invoiceRes] = await Promise.all([
    admin
      ? supabase.from("lead_pipeline_summary").select("*")
      : Promise.resolve({ data: [] as never[] }),
    admin
      ? supabase
          .from("leads")
          .select("*")
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(8)
      : Promise.resolve({ data: [] as Lead[] }),
    supabase
      .from("content_scheduled")
      .select("*")
      .order("scheduled_at", { ascending: true })
      .limit(6),
    admin
      ? supabase.from("invoice_summary").select("*")
      : Promise.resolve({ data: [] as never[] }),
  ]);

  const pipeline = pipelineRes.data ?? [];
  const recent = (recentRes.data ?? []) as Lead[];
  const scheduled = scheduledRes.data ?? [];
  const invoices = invoiceRes.data ?? [];

  const totalLeads = pipeline.reduce((a, r) => a + Number(r.lead_count), 0);
  const unread = pipeline.reduce((a, r) => a + Number(r.unread_count), 0);
  const openValue = pipeline
    .filter((r) => !["won", "lost"].includes(r.status))
    .reduce((a, r) => a + Number(r.pipeline_value), 0);
  const eventsLeads = pipeline
    .filter((r) => r.source === "events")
    .reduce((a, r) => a + Number(r.lead_count), 0);
  const outstanding = invoices
    .filter((r) => ["sent", "partial", "overdue"].includes(r.status))
    .reduce((a, r) => a + (Number(r.total_value) - Number(r.paid_value)), 0);

  return (
    <>
      {denied ? (
        <div className="mb-7">
          <Alert tone="error">
            You don&rsquo;t have access to that page. You&rsquo;re signed in as{" "}
            <strong>{ROLE_LABEL[profile.role]}</strong> — ask a super admin if
            you need it.
          </Alert>
        </div>
      ) : null}

      <PageHeading
        eyebrow="Overview"
        title={`Afternoon, ${(profile.full_name ?? profile.email).split(" ")[0]}`}
        description={
          admin
            ? "Everything currently in flight — enquiries, money and what publishes next."
            : "Your content queue and what publishes next."
        }
      />

      {admin ? (
        <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            label="Open pipeline"
            value={currency(openValue)}
            hint="Estimated value, excluding won and lost"
            tone="gold"
          />
          <Stat label="Leads" value={totalLeads} hint={`${unread} unread`} />
          <Stat
            label="Events enquiries"
            value={eventsLeads}
            hint="Tracked separately from the rest of the site"
            tone="navy"
          />
          <Stat
            label="Outstanding"
            value={currency(outstanding)}
            hint="Invoiced and not yet paid"
            tone="charcoal"
          />
        </div>
      ) : null}

      <div className="grid gap-7 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {admin ? (
          <Panel>
            <PanelHeader
              title="Recent enquiries"
              action={<ButtonLink href="/admin/crm/leads" tone="secondary">All leads</ButtonLink>}
            />
            {recent.length === 0 ? (
              <EmptyState
                title="No enquiries yet"
                body="Submissions from the contact, home and events forms land here the moment they arrive."
              />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Name</Th>
                    <Th>Source</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Received</Th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((lead) => (
                    <tr key={lead.id} className={lead.is_read ? "" : "bg-gold/10"}>
                      <Td>
                        <Link
                          href={`/admin/crm/leads/${lead.id}`}
                          className="font-black underline decoration-charcoal/30 underline-offset-4 hover:decoration-charcoal"
                        >
                          {lead.name}
                        </Link>
                        {lead.company ? (
                          <span className="block text-[0.78rem] text-charcoal/55">
                            {lead.company}
                          </span>
                        ) : null}
                      </Td>
                      <Td>
                        <Badge tone={lead.source === "events" ? "high" : undefined}>
                          {label(lead.source)}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge tone={lead.status}>{label(lead.status)}</Badge>
                      </Td>
                      <Td className="text-right tabular-nums text-charcoal/60">
                        {new Date(lead.created_at).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Panel>
        ) : null}

        <div className="flex flex-col gap-7">
          <Panel>
            <PanelHeader
              title="Scheduled to publish"
              hint="Goes live automatically at the time set"
            />
            {scheduled.length === 0 ? (
              <EmptyState
                title="Nothing scheduled"
                body="Set a publish date on any draft and it will appear here until it goes live."
              />
            ) : (
              <ul className="divide-y divide-charcoal/15">
                {scheduled.map((row) => (
                  <li key={`${row.entity}-${row.id}`} className="flex items-center justify-between gap-4 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-sans text-[0.86rem] font-black text-charcoal">
                        {row.label}
                      </p>
                      <p className="font-sans text-[0.68rem] font-bold uppercase tracking-[0.14em] text-charcoal/45">
                        {label(row.entity)}
                      </p>
                    </div>
                    <span className="shrink-0 font-sans text-[0.76rem] font-bold tabular-nums text-charcoal/60">
                      {new Date(row.scheduled_at).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel>
            <PanelHeader title="Jump to" />
            <div className="grid grid-cols-2 gap-3 p-5">
              <ButtonLink href="/admin/content/pages" tone="secondary">Pages</ButtonLink>
              <ButtonLink href="/admin/content/blog" tone="secondary">Blog</ButtonLink>
              <ButtonLink href="/admin/content/projects" tone="secondary">Portfolio</ButtonLink>
              <ButtonLink href="/admin/media" tone="secondary">Media</ButtonLink>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
