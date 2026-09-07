"use server";

import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/rbac";
import { sendMail } from "@/lib/mail";
import { money, shortDate } from "@/lib/format";
import { siteUrl } from "@/lib/seo";
import type { InvoiceStatus } from "@/lib/supabase/types";

export type ActionResult = { ok: true } | { ok: false; error: string };
export type CreateResult = { ok: true; id: string } | { ok: false; error: string };

/**
 * Invoicing.
 *
 * No total is ever written from here. `recalc_invoice()` recomputes subtotal,
 * tax, total and amount paid from the line items and payments on every change,
 * so the arithmetic lives next to the data and a forged request cannot assert
 * that a ₹4,00,000 invoice is paid.
 */

export type LineItem = {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
};

export async function saveInvoice(
  id: string | null,
  header: {
    client_id: string | null;
    issue_date: string;
    due_date: string | null;
    tax_rate: number;
    discount: number;
    notes: string;
    terms: string;
  },
  items: LineItem[],
): Promise<CreateResult> {
  const { profile } = await requireStaff("admin");

  if (items.length === 0) return { ok: false, error: "Add at least one line item." };
  if (items.some((i) => !i.description.trim())) {
    return { ok: false, error: "Every line needs a description." };
  }
  if (header.tax_rate < 0 || header.tax_rate > 100) {
    return { ok: false, error: "Tax rate must be between 0 and 100." };
  }

  const supabase = await getSupabase();

  const row = {
    client_id: header.client_id || null,
    issue_date: header.issue_date,
    due_date: header.due_date || null,
    tax_rate: header.tax_rate,
    discount: header.discount,
    notes: header.notes.trim() || null,
    terms: header.terms.trim() || null,
  };

  let invoiceId = id;

  if (invoiceId) {
    const { error } = await supabase.from("invoices").update(row).eq("id", invoiceId);
    if (error) return { ok: false, error: error.message };
  } else {
    // `number` is left out on purpose — the next_invoice_number trigger fills
    // it from a sequence, so two admins creating at once cannot collide.
    const { data, error } = await supabase
      .from("invoices")
      .insert({ ...row, created_by: profile.id })
      .select("id")
      .single();

    if (error || !data) return { ok: false, error: error?.message ?? "Could not create." };
    invoiceId = data.id;
  }

  /* Replace the line items wholesale. Diffing them would be more code for an
     edit that happens on a handful of rows at a time, and the totals are
     recomputed by trigger either way. */
  await supabase.from("invoice_items").delete().eq("invoice_id", invoiceId);

  const { error: itemError } = await supabase.from("invoice_items").insert(
    items.map((item, position) => ({
      invoice_id: invoiceId!,
      description: item.description.trim(),
      quantity: item.quantity,
      unit_price: item.unit_price,
      position,
    })),
  );

  if (itemError) return { ok: false, error: itemError.message };

  revalidatePath("/admin/crm/invoices");
  revalidatePath(`/admin/crm/invoices/${invoiceId}`);
  return { ok: true, id: invoiceId! };
}

export async function setInvoiceStatus(
  id: string,
  status: InvoiceStatus,
): Promise<ActionResult> {
  await requireStaff("admin");
  const supabase = await getSupabase();

  const { error } = await supabase.from("invoices").update({ status }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/crm/invoices");
  revalidatePath(`/admin/crm/invoices/${id}`);
  return { ok: true };
}

export async function recordPayment(
  invoiceId: string,
  amount: number,
  method: string,
  reference: string,
): Promise<ActionResult> {
  const { profile } = await requireStaff("admin");

  if (!(amount > 0)) return { ok: false, error: "Enter an amount above zero." };

  const supabase = await getSupabase();

  const { error } = await supabase.from("payments").insert({
    invoice_id: invoiceId,
    amount,
    method: method.trim() || null,
    reference: reference.trim() || null,
    created_by: profile.id,
  });

  if (error) return { ok: false, error: error.message };

  // The payments trigger recalculates the invoice and flips it to partial or
  // paid; nothing here needs to set the status.
  revalidatePath("/admin/crm/invoices");
  revalidatePath(`/admin/crm/invoices/${invoiceId}`);
  return { ok: true };
}

export async function deletePayment(
  paymentId: string,
  invoiceId: string,
): Promise<ActionResult> {
  await requireStaff("admin");
  const supabase = await getSupabase();

  const { error } = await supabase.from("payments").delete().eq("id", paymentId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/crm/invoices/${invoiceId}`);
  return { ok: true };
}

/** Soft delete — an invoice number that has been sent must stay accounted for. */
export async function voidInvoice(id: string): Promise<ActionResult> {
  await requireStaff("admin");
  const supabase = await getSupabase();

  const { error } = await supabase
    .from("invoices")
    .update({ status: "void" })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/crm/invoices");
  revalidatePath(`/admin/crm/invoices/${id}`);
  return { ok: true };
}

/**
 * Email the invoice to the client and mark it sent.
 *
 * The status changes only if the mail actually went — an invoice marked sent
 * that never arrived is the one failure mode that costs real money.
 */
export async function sendInvoice(id: string): Promise<ActionResult> {
  await requireStaff("admin");
  const supabase = await getSupabase();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, clients(name, email)")
    .eq("id", id)
    .single();

  if (!invoice) return { ok: false, error: "Invoice not found." };

  const client = invoice.clients as unknown as { name: string; email: string | null } | null;
  if (!client?.email) {
    return { ok: false, error: "That client has no email address. Add one first." };
  }

  const { data: items } = await supabase
    .from("invoice_items")
    .select("description, quantity, unit_price, amount")
    .eq("invoice_id", id)
    .order("position");

  const lines = (items ?? []).map(
    (i) => `  ${i.description} — ${i.quantity} × ${money(i.unit_price, invoice.currency)} = ${money(i.amount, invoice.currency)}`,
  );

  const result = await sendMail({
    to: client.email,
    subject: `Invoice ${invoice.number} from Adversado`,
    text: [
      `Hello ${client.name},`,
      "",
      `Invoice ${invoice.number}, issued ${shortDate(invoice.issue_date)}${
        invoice.due_date ? `, due ${shortDate(invoice.due_date)}` : ""
      }.`,
      "",
      ...lines,
      "",
      `Subtotal: ${money(invoice.subtotal, invoice.currency)}`,
      invoice.discount > 0 ? `Discount: −${money(invoice.discount, invoice.currency)}` : "",
      invoice.tax_rate > 0
        ? `Tax (${invoice.tax_rate}%): ${money(invoice.tax_amount, invoice.currency)}`
        : "",
      `Total: ${money(invoice.total, invoice.currency)}`,
      "",
      invoice.terms ?? "",
      "",
      `You can also view it in your portal: ${siteUrl()}/portal/invoices`,
    ]
      .filter((l) => l !== "")
      .join("\n"),
  });

  if (!result.ok) return { ok: false, error: result.error };

  await supabase
    .from("invoices")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "draft");

  revalidatePath("/admin/crm/invoices");
  revalidatePath(`/admin/crm/invoices/${id}`);
  return { ok: true };
}
