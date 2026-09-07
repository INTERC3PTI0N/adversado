import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabase } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/rbac";
import {
  Badge, ButtonLink, PageHeading, Panel, PanelHeader, Stat, Table, Td, Th, label,
} from "@/components/admin/ui";
import { ClientWorkspace } from "@/components/admin/ClientWorkspace";
import { money, shortDate } from "@/lib/format";
import type { Client, Invoice, PmProject } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function ClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff("admin");
  const { id } = await params;

  const isNew = id === "new";
  const supabase = await getSupabase();

  // A new client has nothing hanging off it yet, so skip four queries that
  // would all return empty.
  const [clientRes, docsRes, msgsRes, mediaRes, invoicesRes, projectsRes, loginRes] =
    await Promise.all([
      isNew ? { data: null } : supabase.from("clients").select("*").eq("id", id).single(),
      isNew ? { data: [] } : supabase.from("client_documents").select("id, title, created_at, media_id").eq("client_id", id).order("created_at", { ascending: false }),
      isNew ? { data: [] } : supabase.from("client_messages").select("id, body, created_at, author_id").eq("client_id", id).order("created_at", { ascending: false }).limit(30),
      supabase.from("media").select("id, filename").order("created_at", { ascending: false }).limit(200),
      isNew ? { data: [] } : supabase.from("invoices").select("*").eq("client_id", id).is("deleted_at", null).order("issue_date", { ascending: false }),
      isNew ? { data: [] } : supabase.from("pm_projects").select("*").eq("client_id", id).is("deleted_at", null).order("created_at", { ascending: false }),
      isNew ? { data: [] } : supabase.from("profiles").select("id").eq("client_id", id).limit(1),
    ]);

  const client = (clientRes.data ?? null) as Client | null;
  if (!isNew && !client) notFound();

  const invoices = (invoicesRes.data ?? []) as Invoice[];
  const projects = (projectsRes.data ?? []) as PmProject[];

  const owed = invoices
    .filter((i) => !["draft", "void", "paid"].includes(i.status))
    .reduce((a, i) => a + (i.total - i.amount_paid), 0);
  const billed = invoices
    .filter((i) => i.status !== "draft" && i.status !== "void")
    .reduce((a, i) => a + i.total, 0);

  return (
    <>
      <PageHeading
        eyebrow={
          <Link href="/admin/clients" className="underline decoration-charcoal/30 underline-offset-4">
            Clients
          </Link>
        }
        title={client?.name ?? "New client"}
        description={client?.company ?? undefined}
        action={
          client ? (
            <div className="flex flex-wrap gap-3">
              <ButtonLink href={`/admin/pm/new?client=${client.id}`} tone="secondary">
                New project
              </ButtonLink>
              <ButtonLink href={`/admin/crm/invoices/new?client=${client.id}`}>
                New invoice
              </ButtonLink>
            </div>
          ) : undefined
        }
      />

      {client ? (
        <div className="mb-7 grid gap-5 sm:grid-cols-3">
          <Stat label="Billed" value={money(billed)} hint="Excluding drafts and voids" />
          <Stat label="Outstanding" value={money(owed)} tone={owed > 0 ? "gold" : "cream"} />
          <Stat
            label="Live projects"
            value={projects.filter((p) => p.status !== "complete").length}
            tone="navy"
          />
        </div>
      ) : null}

      {client && (projects.length > 0 || invoices.length > 0) ? (
        <div className="mb-7 grid gap-7 xl:grid-cols-2">
          <Panel>
            <PanelHeader title="Projects" />
            {projects.length === 0 ? (
              <p className="px-5 py-6 font-sans text-[0.86rem] font-medium text-charcoal/55">
                No projects yet.
              </p>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Project</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Progress</Th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => (
                    <tr key={p.id}>
                      <Td>
                        <Link
                          href={`/admin/pm/${p.id}`}
                          className="font-black underline decoration-charcoal/30 underline-offset-4"
                        >
                          {p.name}
                        </Link>
                      </Td>
                      <Td>
                        <Badge tone={p.status === "complete" ? "published" : "new"}>
                          {label(p.status)}
                        </Badge>
                      </Td>
                      <Td className="text-right tabular-nums">{p.progress}%</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Panel>

          <Panel>
            <PanelHeader title="Invoices" />
            {invoices.length === 0 ? (
              <p className="px-5 py-6 font-sans text-[0.86rem] font-medium text-charcoal/55">
                No invoices yet.
              </p>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Number</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Total</Th>
                    <Th className="text-right">Due</Th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <Td>
                        <Link
                          href={`/admin/crm/invoices/${inv.id}`}
                          className="font-black underline decoration-charcoal/30 underline-offset-4"
                        >
                          {inv.number}
                        </Link>
                      </Td>
                      <Td>
                        <Badge tone={inv.status}>{label(inv.status)}</Badge>
                      </Td>
                      <Td className="text-right tabular-nums">{money(inv.total, inv.currency)}</Td>
                      <Td className="text-right tabular-nums text-charcoal/60">
                        {shortDate(inv.due_date)}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Panel>
        </div>
      ) : null}

      <ClientWorkspace
        client={client}
        documents={docsRes.data ?? []}
        messages={msgsRes.data ?? []}
        media={mediaRes.data ?? []}
        hasLogin={(loginRes.data ?? []).length > 0}
      />
    </>
  );
}
