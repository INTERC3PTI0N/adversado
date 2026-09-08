"use server";

import { revalidatePath } from "next/cache";
import { getServiceSupabase, getSupabase } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/rbac";
import { isMailConfigured, sendMail } from "@/lib/mail";
import { siteUrl } from "@/lib/seo";
import type { UserRole } from "@/lib/supabase/types";

/**
 * User and role management.
 *
 * Anything that changes access is super admin only, at every layer:
 * `requireStaff("super_admin")` here, `profiles_admin_manage` in RLS, and the
 * `profiles_privilege_guard` trigger — which is the one that actually holds,
 * because RLS is row-level and `profiles_self_update` would otherwise let a
 * user rewrite their own `role`.
 *
 * `setUserDetails` is the exception: a name and a job title decide nothing, so
 * anyone may edit their own.
 *
 * Two invariants this file exists to protect, neither of which RLS can express:
 * you cannot demote or deactivate yourself, and the last active super admin
 * cannot be removed. Both are lockouts that would need the SQL editor to undo.
 */

export type ActionResult = { ok: true } | { ok: false; error: string };
export type InviteResult =
  | { ok: true; emailed: boolean; link: string }
  | { ok: false; error: string };

const ROLES: UserRole[] = ["super_admin", "admin", "editor", "client"];

/** True when `userId` is the only super admin still switched on. */
async function isLastSuperAdmin(userId: string): Promise<boolean> {
  const supabase = await getSupabase();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "super_admin")
    .eq("is_active", true);

  const admins = data ?? [];
  return admins.length <= 1 && admins.some((a) => a.id === userId);
}

/**
 * Name and job title.
 *
 * Your own row, or anyone's if you are a super admin. Neither field decides
 * anything — "Strategy Head" is what someone does, `role` is what they may
 * touch — so a spelling correction should not need a super admin, and the
 * database allows the self-edit through `profiles_self_update`.
 */
export async function setUserDetails(
  userId: string,
  fields: { full_name: string; job_title: string },
): Promise<ActionResult> {
  const { profile } = await requireStaff("editor");

  if (userId !== profile.id && profile.role !== "super_admin") {
    return { ok: false, error: "You can only change your own name and position." };
  }

  const name = fields.full_name.trim();
  const title = fields.job_title.trim();

  if (name.length > 120) return { ok: false, error: "That name is too long." };
  if (title.length > 80) return { ok: false, error: "That position is too long." };

  const supabase = await getSupabase();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: name || null, job_title: title || null })
    .eq("id", userId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/settings/users");
  revalidatePath("/admin/account");
  // The topbar renders the name on every admin screen.
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function setUserRole(
  userId: string,
  role: UserRole,
): Promise<ActionResult> {
  const { profile } = await requireStaff("super_admin");

  if (!ROLES.includes(role)) return { ok: false, error: "Unknown role." };

  if (userId === profile.id && role !== "super_admin") {
    return {
      ok: false,
      error: "You cannot demote yourself. Ask another super admin to do it.",
    };
  }

  if (role !== "super_admin" && (await isLastSuperAdmin(userId))) {
    return { ok: false, error: "That is the last super admin. Promote someone else first." };
  }

  const supabase = await getSupabase();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/settings/users");
  return { ok: true };
}

export async function setUserActive(
  userId: string,
  isActive: boolean,
): Promise<ActionResult> {
  const { profile } = await requireStaff("super_admin");

  if (userId === profile.id && !isActive) {
    return { ok: false, error: "You cannot deactivate your own account." };
  }

  if (!isActive && (await isLastSuperAdmin(userId))) {
    return { ok: false, error: "That is the last super admin. Promote someone else first." };
  }

  const supabase = await getSupabase();
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", userId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/settings/users");
  return { ok: true };
}

/** Link a client-role account to the client whose portal it may see. */
export async function setUserClient(
  userId: string,
  clientId: string | null,
): Promise<ActionResult> {
  await requireStaff("super_admin");

  const supabase = await getSupabase();
  const { error } = await supabase
    .from("profiles")
    .update({ client_id: clientId })
    .eq("id", userId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/settings/users");
  return { ok: true };
}

/**
 * Invite someone.
 *
 * `generateLink` rather than `inviteUserByEmail`: it creates the auth user and
 * hands back the link without depending on Supabase's built-in SMTP, which is
 * rate-limited and not meant for production. We then post it through Resend —
 * the same verified domain the contact form already uses — and if mail is not
 * configured, the link comes back so it can be sent by hand. An invite that
 * cannot be delivered is still better than an invite that silently vanished.
 *
 * The new user lands as an inactive editor via `handle_new_user()`; the role
 * chosen here is applied after, and activation stays a separate deliberate act.
 */
export async function inviteUser(
  email: string,
  role: UserRole,
  fullName: string,
  jobTitle = "",
): Promise<InviteResult> {
  const { profile } = await requireStaff("super_admin");

  const address = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
    return { ok: false, error: "That email doesn't look right." };
  }
  if (!ROLES.includes(role)) return { ok: false, error: "Unknown role." };

  const service = getServiceSupabase();

  const { data, error } = await service.auth.admin.generateLink({
    type: "invite",
    email: address,
    options: {
      data: { full_name: fullName.trim() || undefined },
      // `siteUrl()`, not a bare NEXT_PUBLIC_SITE_URL read: that variable is
      // unset here, so the old fallback posted `http://localhost:3000` into
      // invitations sent from production. siteUrl() falls back to Vercel's
      // deployment URL instead, which at least resolves.
      redirectTo: `${siteUrl()}/admin/login`,
    },
  });

  if (error || !data?.properties?.action_link) {
    const message = error?.message ?? "Could not create the invite.";
    return {
      ok: false,
      error: /already been registered|already exists/i.test(message)
        ? "That email already has an account. Change its role in the table instead."
        : message,
    };
  }

  const link = data.properties.action_link;

  // The trigger has created the profile by now; apply the chosen role and
  // position to it. Service role, so the privilege guard lets the role through.
  if (data.user?.id) {
    await service
      .from("profiles")
      .update({
        role,
        full_name: fullName.trim() || null,
        job_title: jobTitle.trim() || null,
      })
      .eq("id", data.user.id);
  }

  let emailed = false;
  if (isMailConfigured()) {
    const invitedBy = profile.full_name ?? profile.email;
    const result = await sendMail({
      to: address,
      subject: "You've been added to the Adversado admin",
      text: [
        `${invitedBy} has given you access to the Adversado admin.`,
        "",
        "Set your password and sign in here:",
        link,
        "",
        "The link is single-use and expires. Ask for another if it lapses.",
      ].join("\n"),
    });
    emailed = result.ok;
  }

  revalidatePath("/admin/settings/users");
  return { ok: true, emailed, link };
}

/**
 * Delete the auth user. The profile row goes with it — `profiles.id` is
 * `on delete cascade` — but their authored content does not: those columns are
 * `on delete set null`, so a deleted editor's posts stay published.
 */
export async function removeUser(userId: string): Promise<ActionResult> {
  const { profile } = await requireStaff("super_admin");

  if (userId === profile.id) {
    return { ok: false, error: "You cannot delete your own account." };
  }
  if (await isLastSuperAdmin(userId)) {
    return { ok: false, error: "That is the last super admin." };
  }

  const { error } = await getServiceSupabase().auth.admin.deleteUser(userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/settings/users");
  return { ok: true };
}
