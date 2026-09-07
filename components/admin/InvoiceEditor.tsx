"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deletePayment, recordPayment, saveInvoice, sendInvoice,
  setInvoiceStatus, voidInvoice,
} from "@/app/(admin)/admin/(guarded)/crm/invoices/actions";
import { money, shortDate } from "@/lib/format";
import type { Invoice, InvoiceItem, InvoiceStatus } from "@/lib/supabase/types";
import {
  Alert, Badge, Button, Field, INPUT_CLASS, Panel, PanelHeader, Table, Td, Th, label,
} from "./ui";

type Payment = {
  id: string;
  amount: number;
  method: string | null;
  reference: string | null;
  paid_at: string;
};

type Line = { description: string; quantity: number; unit_price: number };

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Invoice editor.
 *
 * The running totals below the lines are a preview computed in the browser;
 * the authoritative figures come back from `recalc_invoice()` after the save.
 * They are shown because typing a line and not seeing the total move is worse
 * than a number that is briefly a render behind.
 */
export function InvoiceEditor({
  invoice,
  items,
  payments,
  clients,
  prefillClientId,
}: {
  invoice: Invoice | null;
  items: InvoiceItem[];
  payments: Payment[];
  clients: { id: string; name: string; email: string | null }[];
  /** Pre-selects the client on a new invoice, from `?client=` on a client page. */
  prefillClientId?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  const [header, setHeader] = useState({
    client_id: invoice?.client_id ?? prefillClientId ?? "",
    issue_date: invoice?.issue_date ?? today(),
    due_date: invoice?.due_date ?? "",
    tax_rate: invoice?.tax_rate ?? 0,
    discount: invoice?.discount ?? 0,
    notes: invoice?.notes ?? "",
    terms: invoice?.terms ?? "Payment due within 15 days.",
  });

  const [lines, setLines] = useState<Line[]>(
    items.length
      ? items.map((i) => ({
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unit_price,
        }))
      : [{ description: "", quantity: 1, unit_price: 0 }],
  );

  const [payment, setPayment] = useState({ amount: "", method: "", reference: "" });
  const [confirmVoid, setConfirmVoid] = useState(false);

  const locked = invoice?.status === "paid" || invoice?.status === "void";

  const subtotal = lines.reduce((a, l) => a + l.quantity * l.unit_price, 0);
  const taxable = subtotal - header.discount;
  const tax = Math.round(taxable * (header.tax_rate / 100) * 100) / 100;
  const total = taxable + tax;
  const paid = payments.reduce((a, p) => a + p.amount, 0);

  function run(fn: () => Promise<{ ok: true } | { ok: false; error: string }>, success?: string) {
    setMessage(null);
    startTransition(async () => {
      const result = await fn();
      if (result.ok) {
        if (success) setMessage({ tone: "success", text: success });
        router.refresh();
      } else {
        setMessage({ tone: "error", text: result.error });
      }
    });
  }

  function submit() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveInvoice(invoice?.id ?? null, {
        ...header,
        client_id: header.client_id || null,
        due_date: header.due_date || null,
      }, lines);

      if (!result.ok) {
        setMessage({ tone: "error", text: result.error });
        return;
      }

      if (!invoice) router.replace(`/admin/crm/invoices/${result.id}`);
      else {
        setMessage({ tone: "success", text: "Saved." });
        router.refresh();
      }
    });
  }

  const setLine = (i: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  return (
    <div className="flex flex-col gap-7">
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}

      {locked ? (
        <Alert>
          This invoice is {label(invoice!.status)} and can no longer be edited.
          {invoice!.status === "paid"
            ? " Remove the payment below if you need to change it."
            : ""}
        </Alert>
      ) : null}

      <Panel>
        <PanelHeader
          title="Details"
          action={invoice ? <Badge tone={invoice.status}>{label(invoice.status)}</Badge> : undefined}
        />
        <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-6">
          <Field label="Client" help="Leave blank for a one-off invoice.">
            <select
              value={header.client_id}
              disabled={locked}
              onChange={(e) => setHeader((h) => ({ ...h, client_id: e.target.value }))}
              className={`${INPUT_CLASS} appearance-none`}
            >
              <option value="">No client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.email ? "" : " (no email)"}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Issue date">
            <input
              type="date"
              value={header.issue_date}
              disabled={locked}
              onChange={(e) => setHeader((h) => ({ ...h, issue_date: e.target.value }))}
              className={INPUT_CLASS}
            />
          </Field>

          <Field label="Due date">
            <input
              type="date"
              value={header.due_date}
              disabled={locked}
              onChange={(e) => setHeader((h) => ({ ...h, due_date: e.target.value }))}
              className={INPUT_CLASS}
            />
          </Field>

          <Field label="Tax rate %" help="GST or whatever applies. 0 for none.">
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={header.tax_rate}
              disabled={locked}
              onChange={(e) => setHeader((h) => ({ ...h, tax_rate: Number(e.target.value) || 0 }))}
              className={INPUT_CLASS}
            />
          </Field>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Lines" />
        <div className="flex flex-col gap-4 p-5">
          {lines.map((line, i) => (
            <div
              key={i}
              className="grid gap-3 border-[3px] border-charcoal/25 bg-bone/60 p-4 sm:grid-cols-[1fr_5rem_8rem_7rem_auto] sm:items-end"
            >
              <Field label="Description">
                <input
                  value={line.description}
                  disabled={locked}
                  onChange={(e) => setLine(i, { description: e.target.value })}
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label="Qty">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.quantity}
                  disabled={locked}
                  onChange={(e) => setLine(i, { quantity: Number(e.target.value) || 0 })}
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label="Unit price">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.unit_price}
                  disabled={locked}
                  onChange={(e) => setLine(i, { unit_price: Number(e.target.value) || 0 })}
                  className={INPUT_CLASS}
                />
              </Field>
              <div className="pb-2.5 text-right font-sans text-[0.9rem] font-black tabular-nums text-charcoal">
                {money(line.quantity * line.unit_price)}
              </div>
              <button
                type="button"
                disabled={locked || lines.length === 1}
                onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}
                aria-label="Remove line"
                className="mb-2 border-2 border-charcoal bg-[#c8322a] px-2.5 py-1 font-sans text-[0.66rem] font-black text-cream disabled:opacity-30"
              >
                ✕
              </button>
            </div>
          ))}

          <div>
            <Button
              tone="secondary"
              disabled={locked}
              onClick={() =>
                setLines((ls) => [...ls, { description: "", quantity: 1, unit_price: 0 }])
              }
            >
              Add line
            </Button>
          </div>
        </div>

        <dl className="border-t-[3px] border-charcoal p-5">
          {[
            ["Subtotal", money(subtotal)],
            ...(header.discount > 0 ? [["Discount", `−${money(header.discount)}`]] : []),
            ...(header.tax_rate > 0 ? [[`Tax ${header.tax_rate}%`, money(tax)]] : []),
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
              Total
            </dt>
            <dd className="font-sans text-[1.15rem] font-black tabular-nums text-charcoal">
              {money(total)}
            </dd>
          </div>
          {paid > 0 ? (
            <div className="flex justify-between gap-4 pt-2">
              <dt className="font-sans text-[0.72rem] font-black uppercase tracking-[0.2em] text-charcoal/60">
                Outstanding
              </dt>
              <dd className="font-sans text-[0.95rem] font-black tabular-nums text-charcoal">
                {money(total - paid)}
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="grid gap-6 border-t-[3px] border-charcoal p-5 sm:grid-cols-2">
          <Field label="Discount" help="A flat amount, taken off before tax.">
            <input
              type="number"
              min="0"
              step="0.01"
              value={header.discount}
              disabled={locked}
              onChange={(e) => setHeader((h) => ({ ...h, discount: Number(e.target.value) || 0 }))}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Terms" help="Shown on the invoice and in the email.">
            <input
              value={header.terms}
              disabled={locked}
              onChange={(e) => setHeader((h) => ({ ...h, terms: e.target.value }))}
              className={INPUT_CLASS}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes" help="Internal. Not sent to the client.">
              <textarea
                rows={3}
                value={header.notes}
                disabled={locked}
                onChange={(e) => setHeader((h) => ({ ...h, notes: e.target.value }))}
                className={`${INPUT_CLASS} resize-y`}
              />
            </Field>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t-[3px] border-charcoal p-5">
          <div className="flex flex-wrap gap-3">
            {invoice && invoice.status !== "void" ? (
              confirmVoid ? (
                <>
                  <Button
                    tone="danger"
                    disabled={pending}
                    onClick={() => {
                      setConfirmVoid(false);
                      run(() => voidInvoice(invoice.id), "Invoice voided.");
                    }}
                  >
                    Really void
                  </Button>
                  <Button tone="secondary" onClick={() => setConfirmVoid(false)}>
                    Keep
                  </Button>
                </>
              ) : (
                <Button tone="secondary" onClick={() => setConfirmVoid(true)}>
                  Void
                </Button>
              )
            ) : null}

            {invoice && invoice.status === "draft" ? (
              <Button
                tone="dark"
                disabled={pending}
                onClick={() => run(() => sendInvoice(invoice.id), "Invoice emailed and marked sent.")}
              >
                Email to client
              </Button>
            ) : null}

            {invoice && invoice.status === "sent" ? (
              <Button
                tone="secondary"
                disabled={pending}
                onClick={() =>
                  run(() => setInvoiceStatus(invoice.id, "overdue" as InvoiceStatus), "Marked overdue.")
                }
              >
                Mark overdue
              </Button>
            ) : null}
          </div>

          <Button onClick={submit} disabled={pending || locked}>
            {pending ? "Saving…" : invoice ? "Save changes" : "Create invoice"}
          </Button>
        </div>
      </Panel>

      {invoice ? (
        <Panel>
          <PanelHeader
            title="Payments"
            hint="Recording one recalculates the invoice and flips it to partial or paid."
          />

          <div className="grid gap-4 border-b-[3px] border-charcoal bg-bone/60 p-5 sm:grid-cols-[8rem_1fr_1fr_auto] sm:items-end">
            <Field label="Amount">
              <input
                type="number"
                min="0"
                step="0.01"
                value={payment.amount}
                onChange={(e) => setPayment((p) => ({ ...p, amount: e.target.value }))}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Method">
              <input
                value={payment.method}
                onChange={(e) => setPayment((p) => ({ ...p, method: e.target.value }))}
                placeholder="Bank transfer"
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Reference">
              <input
                value={payment.reference}
                onChange={(e) => setPayment((p) => ({ ...p, reference: e.target.value }))}
                className={INPUT_CLASS}
              />
            </Field>
            <Button
              disabled={pending || !(Number(payment.amount) > 0)}
              onClick={() =>
                run(async () => {
                  const r = await recordPayment(
                    invoice.id,
                    Number(payment.amount),
                    payment.method,
                    payment.reference,
                  );
                  if (r.ok) setPayment({ amount: "", method: "", reference: "" });
                  return r;
                }, "Payment recorded.")
              }
            >
              Record
            </Button>
          </div>

          {payments.length === 0 ? (
            <p className="px-5 py-6 font-sans text-[0.86rem] font-medium text-charcoal/55">
              Nothing paid yet.
            </p>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Method</Th>
                  <Th>Reference</Th>
                  <Th className="text-right">Amount</Th>
                  <Th className="text-right" />
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <Td className="tabular-nums text-charcoal/60">{shortDate(p.paid_at)}</Td>
                    <Td>{p.method ?? "—"}</Td>
                    <Td className="font-mono text-[0.78rem]">{p.reference ?? "—"}</Td>
                    <Td className="text-right font-black tabular-nums">
                      {money(p.amount, invoice.currency)}
                    </Td>
                    <Td className="text-right">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => run(() => deletePayment(p.id, invoice.id), "Payment removed.")}
                        className="border-2 border-charcoal bg-cream px-3 py-1 font-sans text-[0.6rem] font-black uppercase tracking-[0.14em] text-charcoal disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Panel>
      ) : null}
    </div>
  );
}
