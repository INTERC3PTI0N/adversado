import Link from "next/link";
import { getSupabase } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/rbac";
import {
  Badge, ButtonLink, EmptyState, PageHeading, Pagination, Panel, Stat, Table, Td, Th, label,
} from "@/components/admin/ui";
import { FilterBar } from "@/components/admin/FilterBar";
import { enumOptions } from "@/lib/filters";
import { daysUntil, money, shortDate } from "@/lib/format";
import type { Client, Invoice, InvoiceStatus } from "@/lib/supabase/types";

export const metadata = { title: "Invoices — Adversado Admin" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 40;
const STATUSES: InvoiceStatus[] = ["draft", "sent", "partial", "paid", "overdue", "void"];

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireStaff("admin");
  const sp = await searchParams;

  const status = (STATUSES as string[]).includes(sp.status ?? "")
    ? (sp.status as InvoiceStatus)
    : "";
  const q = sp.q?.trim() ?? "";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const supabase = await getSupabase();

  let query = supabase
    .from("invoices")
    .select("*", { count: "exact" })
    .is("deleted_at", null)
    .order("issue_date", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (status) query = query.eq("status", status);
  if (q) query = query.ilike("number", `%${q}%`);

  const [{ data, count }, summaryRes, clientsRes] = await Promise.all([
    query,
    supabase.from("invoice_summary").select("*"),
    supabase.from("clients").select("id, name").is("deleted_at", null),
  ]);

  const invoices = (data ?? []) as Invoice[];
  const summary = summaryRes.data ?? [];
  const clients = new Map(
    ((clientsRes.data ?? []) as Pick<Client, "id" | "name">[]).map((c) => [c.id, c.name]),
  );

  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const outstanding = summary
    .filter((r) => ["sent", "partial", "overdue"].includes(r.status))
    .reduce((a, r) => a + (Number(r.total_value) - Number(r.paid_value)), 0);
  const collected = summary.reduce((a, r) => a + Number(r.paid_value), 0);
  const drafts = summary.find((r) => r.status === "draft")?.invoice_count ?? 0;

  return (
    <>
      <PageHeading
        eyebrow="CRM"
        title="Invoices"
        description="Totals are computed by the database from the line items — nothing here can assert a figure the lines don't add up to."
        action={<ButtonLink href="/admin/crm/invoices/new">New invoice</ButtonLink>}
      />

      <div className="mb-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Outstanding" value={money(outstanding)} tone="gold" hint="Sent and unpaid" />
        <Stat label="Collected" value={money(collected)} tone="charcoal" />
        <Stat label="Drafts" value={Number(drafts)} hint="Not yet sent" />
        <Stat
          label="Overdue"
          value={Number(summary.find((r) => r.status === "overdue")?.invoice_count ?? 0)}
          tone="navy"
        />
      </div>

      <FilterBar
        basePath="/admin/crm/invoices"
        searchLabel="Invoice number"
        searchPlaceholder="ADV-2026-"
        values={{ q, status }}
        selects={[{ key: "status", label: "Status", options: enumOptions("All statuses", STATUSES) }]}
      />

      <Panel className="mt-6">
        {invoices.length === 0 ? (
          <EmptyState
            title={q || status ? "Nothing matches" : "No invoices yet"}
            body={
              q || status
                ? "Try a different filter."
                : "Create one from here, or from a client's page to have it pre-filled."
            }
            action={<ButtonLink href="/admin/crm/invoices/new">New invoice</ButtonLink>}
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Number</Th>
                  <Th>Client</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Total</Th>
                  <Th className="text-right">Outstanding</Th>
                  <Th className="text-right">Due</Th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => {
                  const left = invoice.total - invoice.amount_paid;
                  const days = daysUntil(invoice.due_date);
                  const late =
                    days !== null && days < 0 && left > 0 && !["paid", "void", "draft"].includes(invoice.status);

                  return (
                    <tr key={invoice.id} className={late ? "bg-[#c8322a]/[0.07]" : ""}>
                      <Td>
                        <Link
                          href={`/admin/crm/invoices/${invoice.id}`}
                          className="font-black underline decoration-charcoal/30 underline-offset-4 hover:decoration-charcoal"
                        >
                          {invoice.number}
                        </Link>
                      </Td>
                      <Td className="text-charcoal/70">
                        {invoice.client_id ? clients.get(invoice.client_id) ?? "—" : "One-off"}
                      </Td>
                      <Td>
                        <Badge tone={late ? "overdue" : invoice.status}>
                          {late ? "overdue" : label(invoice.status)}
                        </Badge>
                      </Td>
                      <Td className="text-right tabular-nums">
                        {money(invoice.total, invoice.currency)}
                      </Td>
                      <Td className="text-right font-black tabular-nums">
                        {left > 0 ? money(left, invoice.currency) : "—"}
                      </Td>
                      <Td className="text-right tabular-nums text-charcoal/60">
                        {shortDate(invoice.due_date)}
                        {late ? (
                          <span className="block text-[0.7rem] font-black text-[#c8322a]">
                            {Math.abs(days!)}d late
                          </span>
                        ) : null}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>

            <Pagination
              basePath="/admin/crm/invoices"
              page={page}
              pages={pages}
              total={total}
              noun="invoice"
              params={{ q, status }}
            />
          </>
        )}
      </Panel>
    </>
  );
}
