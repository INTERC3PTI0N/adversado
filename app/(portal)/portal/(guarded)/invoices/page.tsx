import { getSupabase } from "@/lib/supabase/server";
import { requireClient } from "@/lib/auth/rbac";
import {
  Badge, EmptyState, PageHeading, Panel, PanelHeader, Stat, Table, Td, Th, label,
} from "@/components/admin/ui";
import { daysUntil, money, shortDate } from "@/lib/format";
import type { Invoice, InvoiceItem } from "@/lib/supabase/types";

export const metadata = { title: "Invoices — Adversado" };
export const dynamic = "force-dynamic";

/**
 * Client invoices.
 *
 * Drafts never appear — `invoices_client_read` requires `status <> 'draft'`, so
 * a half-written invoice is invisible here whatever this page asks for.
 */
export default async function PortalInvoices() {
  await requireClient();
  const supabase = await getSupabase();

  const { data } = await supabase
    .from("invoices")
    .select("*")
    .order("issue_date", { ascending: false });

  const invoices = (data ?? []) as Invoice[];

  const { data: itemRows } = invoices.length
    ? await supabase
        .from("invoice_items")
        .select("*")
        .in("invoice_id", invoices.map((i) => i.id))
        .order("position")
    : { data: [] as InvoiceItem[] };

  const items = new Map<string, InvoiceItem[]>();
  for (const item of (itemRows ?? []) as InvoiceItem[]) {
    const list = items.get(item.invoice_id) ?? [];
    list.push(item);
    items.set(item.invoice_id, list);
  }

  const owed = invoices
    .filter((i) => !["void", "paid"].includes(i.status))
    .reduce((a, i) => a + (i.total - i.amount_paid), 0);
  const paid = invoices.reduce((a, i) => a + i.amount_paid, 0);

  return (
    <>
      <PageHeading
        eyebrow="Your account"
        title="Invoices"
        description="Everything issued to you, with what each one covers."
      />

      <div className="mb-8 grid gap-5 sm:grid-cols-2">
        <Stat label="Outstanding" value={money(owed)} tone={owed > 0 ? "gold" : "cream"} />
        <Stat label="Paid to date" value={money(paid)} tone="charcoal" />
      </div>

      {invoices.length === 0 ? (
        <Panel>
          <EmptyState
            title="No invoices yet"
            body="Anything issued to you will appear here, with a full breakdown."
          />
        </Panel>
      ) : (
        <div className="flex flex-col gap-7">
          {invoices.map((invoice) => {
            const days = daysUntil(invoice.due_date);
            const left = invoice.total - invoice.amount_paid;
            const late = days !== null && days < 0 && left > 0 && invoice.status !== "void";

            return (
              <Panel key={invoice.id}>
                <PanelHeader
                  title={invoice.number}
                  hint={`Issued ${shortDate(invoice.issue_date)}${
                    invoice.due_date ? ` · due ${shortDate(invoice.due_date)}` : ""
                  }`}
                  action={
                    <Badge tone={late ? "overdue" : invoice.status}>
                      {late ? "overdue" : label(invoice.status)}
                    </Badge>
                  }
                />

                <Table>
                  <thead>
                    <tr>
                      <Th>Description</Th>
                      <Th className="text-right">Qty</Th>
                      <Th className="text-right">Unit</Th>
                      <Th className="text-right">Amount</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {(items.get(invoice.id) ?? []).map((item) => (
                      <tr key={item.id}>
                        <Td>{item.description}</Td>
                        <Td className="text-right tabular-nums">{item.quantity}</Td>
                        <Td className="text-right tabular-nums">
                          {money(item.unit_price, invoice.currency)}
                        </Td>
                        <Td className="text-right font-black tabular-nums">
                          {money(item.amount, invoice.currency)}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>

                <dl className="border-t-[3px] border-charcoal p-5">
                  {[
                    ["Subtotal", money(invoice.subtotal, invoice.currency)],
                    ...(invoice.discount > 0
                      ? [["Discount", `−${money(invoice.discount, invoice.currency)}`]]
                      : []),
                    ...(invoice.tax_rate > 0
                      ? [[`Tax ${invoice.tax_rate}%`, money(invoice.tax_amount, invoice.currency)]]
                      : []),
                    ...(invoice.amount_paid > 0
                      ? [["Paid", `−${money(invoice.amount_paid, invoice.currency)}`]]
                      : []),
                  ].map(([term, value]) => (
                    <div key={term} className="flex justify-between gap-4 py-1">
                      <dt className="font-sans text-[0.82rem] font-bold text-charcoal/60">{term}</dt>
                      <dd className="font-sans text-[0.88rem] font-bold tabular-nums text-charcoal">
                        {value}
                      </dd>
                    </div>
                  ))}

                  <div className="mt-2 flex justify-between gap-4 border-t-[3px] border-charcoal pt-3">
                    <dt className="font-sans text-[0.72rem] font-black uppercase tracking-[0.2em] text-charcoal">
                      {left > 0 ? "Due" : "Total"}
                    </dt>
                    <dd className="font-sans text-[1.15rem] font-black tabular-nums text-charcoal">
                      {money(left > 0 ? left : invoice.total, invoice.currency)}
                    </dd>
                  </div>
                </dl>

                {invoice.terms ? (
                  <p className="border-t-[3px] border-charcoal px-5 py-4 font-sans text-[0.82rem] font-medium leading-[1.6] text-charcoal/60">
                    {invoice.terms}
                  </p>
                ) : null}
              </Panel>
            );
          })}
        </div>
      )}
    </>
  );
}
