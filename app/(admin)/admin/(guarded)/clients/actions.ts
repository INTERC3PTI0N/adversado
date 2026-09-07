"use server";

import { revalidatePath } from "next/cache";
import { getServiceSupabase, getSupabase } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/rbac";
import { isMailConfigured, sendMail } from "@/lib/mail";
import { siteUrl } from "@/lib/seo";
import type { Json } from "@/lib/supabase/types";

export type ActionResult = { ok: true } | { ok: false; error: string };
export type CreateResult = { ok: true; id: string } | { ok: false; error: string };
export type AccessResult =
  | { ok: true; emailed: boolean; link: string }
  | { ok: false; error: string };

export async function saveClient(
  id: string | null,
  fields: {
    name: string;
    company: string;
    email: string;
    phone: string;
    notes: string;
    portal_enabled: boolean;
    address: Record<string, string>;
  },
): Promise<CreateResult> {
  await requireStaff("admin");

  if (!fields.name.trim()) return { ok: false, error: "Give the client a name." };

  const supabase = await getSupabase();
  const row = {
    name: fields.name.trim(),
    company: fields.company.trim() || null,
    email: fields.email.trim() || null,
    phone: fields.phone.trim() || null,
    notes: fields.notes.trim() || null,
    portal_enabled: fields.portal_enabled,
    address: fields.address as Json,
  };

  if (id) {
    const { error } = await supabase.from("clients").update(row).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/admin/clients/${id}`);
    revalidatePath("/admin/clients");
    return { ok: true, id };
  }

  const { data, error } = await supabase.from("clients").insert(row).select("id").single();
  if (error || !data) return { ok: false, error: error?.message ?? "Could not create." };

  revalidatePath("/admin/clients");
  return { ok: true, id: data.id };
}

/** Soft delete. Invoices and projects reference clients with `set null`, so the
    money and the work survive; only the contact record is retired. */
export async function archiveClient(id: string): Promise<ActionResult> {
  await requireStaff("admin");
  const supabase = await getSupabase();

  const { error } = await supabase
    .from("clients")
    .update({ deleted_at: new Date().toISOString(), portal_enabled: false })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/clients");
  return { ok: true };
}

/**
 * Give a client a portal login.
 *
 * Creates the auth user, links the profile to this client and pins the role to
 * `client` — which is what every portal RLS policy keys off through
 * `auth_client_id()`. Without the link the account signs in and sees nothing,
 * so the two writes are done together rather than left to a second screen.
 */
export async function grantPortalAccess(
  clientId: string,
  email: string,
): Promise<AccessResult> {
  await requireStaff("admin");

  const address = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
    return { ok: false, error: "That email doesn't look right." };
  }

  const service = getServiceSupabase();

  const { data: client } = await service
    .from("clients")
    .select("name")
    .eq("id", clientId)
    .single();

  const { data, error } = await service.auth.admin.generateLink({
    type: "invite",
    email: address,
    options: { redirectTo: `${siteUrl()}/portal/login` },
  });

  if (error || !data?.properties?.action_link || !data.user?.id) {
    const message = error?.message ?? "Could not create the account.";
    return {
      ok: false,
      error: /already been registered|already exists/i.test(message)
        ? "That email already has an account. Link it from Users & roles instead."
        : message,
    };
  }

  await service
    .from("profiles")
    .update({ role: "client", client_id: clientId, is_active: true })
    .eq("id", data.user.id);

  await service.from("clients").update({ portal_enabled: true }).eq("id", clientId);

  const link = data.properties.action_link;

  let emailed = false;
  if (isMailConfigured()) {
    const result = await sendMail({
      to: address,
      subject: "Your Adversado client portal",
      text: [
        `Your portal for ${client?.name ?? "your account"} is ready.`,
        "",
        "Set a password and sign in here:",
        link,
        "",
        "You'll find your projects, invoices and shared files inside.",
      ].join("\n"),
    });
    emailed = result.ok;
  }

  revalidatePath(`/admin/clients/${clientId}`);
  return { ok: true, emailed, link };
}

export async function setPortalEnabled(
  clientId: string,
  enabled: boolean,
): Promise<ActionResult> {
  await requireStaff("admin");
  const supabase = await getSupabase();

  const { error } = await supabase
    .from("clients")
    .update({ portal_enabled: enabled })
    .eq("id", clientId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/clients/${clientId}`);
  return { ok: true };
}

export async function postClientMessage(
  clientId: string,
  body: string,
): Promise<ActionResult> {
  const { profile } = await requireStaff("admin");
  if (!body.trim()) return { ok: false, error: "Write something first." };

  const supabase = await getSupabase();
  const { error } = await supabase
    .from("client_messages")
    .insert({ client_id: clientId, author_id: profile.id, body: body.trim() });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/clients/${clientId}`);
  return { ok: true };
}

/** Share a file from the media library with the client's portal. */
export async function shareDocument(
  clientId: string,
  mediaId: string,
  title: string,
): Promise<ActionResult> {
  const { profile } = await requireStaff("admin");
  if (!mediaId) return { ok: false, error: "Pick a file first." };

  const supabase = await getSupabase();
  const { error } = await supabase.from("client_documents").insert({
    client_id: clientId,
    media_id: mediaId,
    title: title.trim() || "Untitled",
    uploaded_by: profile.id,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/clients/${clientId}`);
  return { ok: true };
}

export async function unshareDocument(id: string, clientId: string): Promise<ActionResult> {
  await requireStaff("admin");
  const supabase = await getSupabase();

  // The file stays in the media library; only the sharing link is removed.
  const { error } = await supabase.from("client_documents").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/clients/${clientId}`);
  return { ok: true };
}
