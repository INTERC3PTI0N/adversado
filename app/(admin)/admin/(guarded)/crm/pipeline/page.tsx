import { getSupabase } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/rbac";
import { ButtonLink, EmptyState, PageHeading, Panel, Stat } from "@/components/admin/ui";
import { FilterBar } from "@/components/admin/FilterBar";
import { PipelineBoard } from "@/components/admin/PipelineBoard";
import type { Lead, LeadSource, Profile } from "@/lib/supabase/types";

export const metadata = { title: "Pipeline — Adversado Admin" };
export const dynamic = "force-dynamic";

const SOURCES: LeadSource[] = ["website", "events", "booking", "referral", "manual", "import"];

/** Won and lost are capped so a year of closed deals doesn't crowd out the
    columns you actually work in. The full history is on the Leads list. */
const CLOSED_LIMIT = 12;

const currency = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireStaff("admin");
  const sp = await searchParams;

  const source = (SOURCES as string[]).includes(sp.source ?? "")
    ? (sp.source as LeadSource)
    : "";
  const owner = sp.owner ?? "";

  const supabase = await getSupabase();

  const [staffRes, openRes, closedRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("role", ["super_admin", "admin"])
      .eq("is_active", true)
      .order("full_name"),
    (() => {
      let q = supabase
        .from("leads")
        .select("*")
        .is("deleted_at", null)
        .not("status", "in", "(won,lost)")
        .order("created_at", { ascending: false });
      if (source) q = q.eq("source", source);
      if (owner) q = q.eq("owner_id", owner);
      return q;
    })(),
    (() => {
      let q = supabase
        .from("leads")
        .select("*")
        .is("deleted_at", null)
        .in("status", ["won", "lost"])
        .order("updated_at", { ascending: false })
        .limit(CLOSED_LIMIT * 2);
      if (source) q = q.eq("source", source);
      if (owner) q = q.eq("owner_id", owner);
      return q;
    })(),
  ]);

  const staff = (staffRes.data ?? []) as Pick<Profile, "id" | "full_name" | "email">[];
  const validOwner = staff.some((s) => s.id === owner) ? owner : "";

  const open = (openRes.data ?? []) as Lead[];
  const closed = (closedRes.data ?? []) as Lead[];

  const leads = [
    ...open,
    ...closed.filter((l) => l.status === "won").slice(0, CLOSED_LIMIT),
    ...closed.filter((l) => l.status === "lost").slice(0, CLOSED_LIMIT),
  ];

  const openValue = open.reduce((a, l) => a + (l.estimated_value ?? 0), 0);
  const wonValue = closed
    .filter((l) => l.status === "won")
    .reduce((a, l) => a + (l.estimated_value ?? 0), 0);
  const decided = closed.length;
  const winRate = decided
    ? Math.round((closed.filter((l) => l.status === "won").length / decided) * 100)
    : 0;

  return (
    <>
      <PageHeading
        eyebrow="CRM"
        title="Pipeline"
        description="Drag a card to move it, or use the arrows. Every move is written to the lead's activity history."
        action={
          <ButtonLink href="/admin/crm/leads" tone="secondary">
            List view
          </ButtonLink>
        }
      />

      <div className="mb-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Open pipeline" value={currency(openValue)} tone="gold" hint="Excluding won and lost" />
        <Stat label="In play" value={open.length} hint="Leads not yet decided" />
        <Stat label="Won value" value={currency(wonValue)} tone="charcoal" hint="Recent closes" />
        <Stat label="Win rate" value={`${winRate}%`} tone="navy" hint={`Of ${decided} decided`} />
      </div>

      <FilterBar
        basePath="/admin/crm/pipeline"
        searchLabel=""
        values={{ source, owner: validOwner }}
        selects={[
          {
            key: "source",
            label: "Source",
            options: [
              { value: "", label: "All sources" },
              ...SOURCES.map((s) => ({ value: s, label: s.replace(/^./, (c) => c.toUpperCase()) })),
            ],
          },
          {
            key: "owner",
            label: "Owner",
            options: [
              { value: "", label: "Anyone" },
              ...staff.map((s) => ({ value: s.id, label: s.full_name ?? s.email })),
            ],
          },
        ]}
      />

      <div className="mt-6">
        {leads.length === 0 ? (
          <Panel>
            <EmptyState
              title={source || validOwner ? "Nothing matches" : "Nothing in the pipeline"}
              body={
                source || validOwner
                  ? "Try a different filter."
                  : "Enquiries land in New the moment a form is submitted."
              }
            />
          </Panel>
        ) : (
          <PipelineBoard leads={leads} />
        )}
      </div>
    </>
  );
}
