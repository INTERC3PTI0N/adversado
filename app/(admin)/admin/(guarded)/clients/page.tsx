import Link from "next/link";
import { getSupabase } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/rbac";
import {
  Badge, ButtonLink, EmptyState, PageHeading, Panel, Stat, Table, Td, Th,
} from "@/components/admin/ui";
import { FilterBar } from "@/components/admin/FilterBar";
import { money, shortDate } from "@/lib/format";
import type { Client } from "@/lib/supabase/types";

export const metadata = { title: "Clients — Adversado Admin" };
export const dynamic = "force-dynamic";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireStaff("admin");
  const sp = await searchParams;

  const q = sp.q?.trim() ?? "";
  const portal = sp.portal === "1";

  const supabase = await getSupabase();

  let query = supabase
    .from("clients")
    .select("*")
    .is("deleted_at", null)
    .order("name");

  if (portal) query = query.eq("portal_enabled", true);
  if (q) query = query.or(`name.ilike.%${q}%,company.ilike.%${q}%,email.ilike.%${q}%`);

  const [{ data }, invoicesRes, projectsRes] = await Promise.all([
    query,
    supabase.from("invoices").select("client_id, total, amount_paid, status").is("deleted_at", null),
    supabase.from("pm_projects").select("client_id, status").is("deleted_at", null),
  ]);

  const clients = (data ?? []) as Client[];
  const invoices = invoicesRes.data ?? [];
  const projects = projectsRes.data ?? [];

  // Rolled up in JS rather than as four correlated subqueries: the client list
  // is tens of rows, not thousands, and this is one round trip instead of N.
  const owed = new Map<string, number>();
  for (const inv of invoices) {
    if (!inv.client_id || ["draft", "void", "paid"].includes(inv.status)) continue;
    owed.set(inv.client_id, (owed.get(inv.client_id) ?? 0) + (inv.total - inv.amount_paid));
  }

  const live = new Map<string, number>();
  for (const p of projects) {
    if (!p.client_id || p.status === "complete") continue;
    live.set(p.client_id, (live.get(p.client_id) ?? 0) + 1);
  }

  const totalOwed = [...owed.values()].reduce((a, b) => a + b, 0);

  return (
    <>
      <PageHeading
        eyebrow="Delivery"
        title="Clients"
        description="Everyone you invoice, deliver to, or have switched the portal on for."
        action={
          <ButtonLink href="/admin/clients/new">New client</ButtonLink>
        }
      />

      <div className="mb-7 grid gap-5 sm:grid-cols-3">
        <Stat label="Clients" value={clients.length} />
        <Stat
          label="Portals live"
          value={clients.filter((c) => c.portal_enabled).length}
          tone="navy"
        />
        <Stat label="Outstanding" value={money(totalOwed)} tone="gold" hint="Invoiced and unpaid" />
      </div>

      <FilterBar
        basePath="/admin/clients"
        searchPlaceholder="Name, company or email"
        values={{ q, portal: portal ? "1" : "" }}
        toggles={[{ key: "portal", label: "Portal only" }]}
      />

      <Panel className="mt-6">
        {clients.length === 0 ? (
          <EmptyState
            title={q || portal ? "Nothing matches" : "No clients yet"}
            body={
              q || portal
                ? "Try a different search."
                : "Convert a won lead from its page, or add one by hand."
            }
            action={<ButtonLink href="/admin/clients/new">New client</ButtonLink>}
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Client</Th>
                <Th>Portal</Th>
                <Th className="text-right">Live projects</Th>
                <Th className="text-right">Outstanding</Th>
                <Th className="text-right">Added</Th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id}>
                  <Td>
                    <Link
                      href={`/admin/clients/${client.id}`}
                      className="font-black underline decoration-charcoal/30 underline-offset-4 hover:decoration-charcoal"
                    >
                      {client.name}
                    </Link>
                    <span className="block text-[0.78rem] text-charcoal/55">
                      {client.company ? `${client.company} · ` : ""}
                      {client.email ?? "No email"}
                    </span>
                  </Td>
                  <Td>
                    {client.portal_enabled ? (
                      <Badge tone="published">On</Badge>
                    ) : (
                      <span className="text-charcoal/35">Off</span>
                    )}
                  </Td>
                  <Td className="text-right tabular-nums">{live.get(client.id) ?? 0}</Td>
                  <Td className="text-right tabular-nums">
                    {owed.get(client.id) ? money(owed.get(client.id)) : "—"}
                  </Td>
                  <Td className="text-right tabular-nums text-charcoal/60">
                    {shortDate(client.created_at)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>
    </>
  );
}
