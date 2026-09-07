import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabase } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/rbac";
import { PageHeading } from "@/components/admin/ui";
import { InvoiceEditor } from "@/components/admin/InvoiceEditor";
import { shortDate } from "@/lib/format";
import type { Invoice, InvoiceItem } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function InvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireStaff("admin");
  const { id } = await params;
  const sp = await searchParams;

  const isNew = id === "new";
  const supabase = await getSupabase();

  const [invoiceRes, itemsRes, paymentsRes, clientsRes] = await Promise.all([
    isNew ? { data: null } : supabase.from("invoices").select("*").eq("id", id).single(),
    isNew ? { data: [] } : supabase.from("invoice_items").select("*").eq("invoice_id", id).order("position"),
    isNew ? { data: [] } : supabase.from("payments").select("id, amount, method, reference, paid_at").eq("invoice_id", id).order("paid_at", { ascending: false }),
    supabase.from("clients").select("id, name, email").is("deleted_at", null).order("name"),
  ]);

  const invoice = (invoiceRes.data ?? null) as Invoice | null;
  if (!isNew && !invoice) notFound();

  // `?client=` from a client page pre-selects them on a new invoice.
  const clients = clientsRes.data ?? [];
  const prefill = clients.some((c) => c.id === sp.client) ? sp.client! : null;

  return (
    <>
      <PageHeading
        eyebrow={
          <Link
            href="/admin/crm/invoices"
            className="underline decoration-charcoal/30 underline-offset-4"
          >
            Invoices
          </Link>
        }
        title={invoice?.number ?? "New invoice"}
        description={
          invoice
            ? `Issued ${shortDate(invoice.issue_date)}${
                invoice.sent_at ? ` · sent ${shortDate(invoice.sent_at)}` : ""
              }`
            : "The number is assigned by the database when you create it."
        }
      />

      <InvoiceEditor
        invoice={invoice}
        prefillClientId={prefill}
        items={(itemsRes.data ?? []) as InvoiceItem[]}
        payments={paymentsRes.data ?? []}
        clients={clients}
      />
    </>
  );
}
