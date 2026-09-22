"use server";

import { revalidatePath } from "next/cache";
import { getServiceSupabase, getSupabase } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/rbac";
import { buttonEmail, isMailConfigured, sendMail } from "@/lib/mail";
import { createInvite, reissueInvite } from "@/lib/auth/invites";
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
 *
 * The link itself comes from `lib/auth/invites` — on our own domain, redeemed
 * by our own page — rather than Supabase's `action_link`, which read as a
 * random string and landed on localhost. See that file for why.
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

  const invite = await createInvite(address, { full_name: fullName.trim() || undefined });

  if (!invite.ok) {
    return {
      ok: false,
      error: invite.exists
        ? "That email already has an account. If they never got in, use Resend invite on their row."
        : invite.error,
    };
  }

  // The trigger has created the profile by now; apply the chosen role and
  // position to it. Service role, so the privilege guard lets the role through.
  await getServiceSupabase()
    .from("profiles")
    .update({
      role,
      full_name: fullName.trim() || null,
      job_title: jobTitle.trim() || null,
    })
    .eq("id", invite.userId);

  const emailed = await mailStaffInvite(address, invite.link, profile.full_name ?? profile.email);

  revalidatePath("/admin/settings/users");
  return { ok: true, emailed, link: invite.link };
}

async function mailStaffInvite(to: string, link: string, invitedBy: string): Promise<boolean> {
  if (!isMailConfigured()) return false;

  const { text, html } = buttonEmail({
    heading: "You're on the team",
    body: `${invitedBy} has given you access to the Adversado admin. Set a password to get started.`,
    cta: "Set your password",
    link,
    footnote: "The link works once and expires. Ask for another if it lapses.",
  });

  const result = await sendMail({ to, subject: "Your Adversado admin access", text, html });
  return result.ok;
}

/**
 * Send a fresh link to someone who never got in.
 *
 * Every invite sent before `lib/auth/invites` existed pointed at localhost, and
 * those people already have accounts — so inviting them again is refused.
 * `reissueInvite` issues a new password-setting link, and only for accounts that
 * have never signed in; see there for why that limit matters.
 */
export async function resendInvite(userId: string): Promise<InviteResult> {
  const { profile } = await requireStaff("super_admin");

  const reissued = await reissueInvite(userId);
  if (!reissued.ok) return { ok: false, error: reissued.error };

  const { data: target } = await getServiceSupabase()
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  const invitedBy = profile.full_name ?? profile.email;
  const emailed =
    target?.role === "client"
      ? await mailPortalInvite(reissued.email, reissued.link, invitedBy)
      : await mailStaffInvite(reissued.email, reissued.link, invitedBy);

  revalidatePath("/admin/settings/users");
  return { ok: true, emailed, link: reissued.link };
}

async function mailPortalInvite(to: string, link: string, invitedBy: string): Promise<boolean> {
  if (!isMailConfigured()) return false;

  const { text, html } = buttonEmail({
    heading: "Your client portal",
    body: `${invitedBy} has set up your Adversado portal — your projects, invoices and shared files in one place. Set a password to get in.`,
    cta: "Set your password",
    link,
    footnote: "The link works once and expires. Ask for another if it lapses.",
  });

  const result = await sendMail({ to, subject: "Your Adversado client portal", text, html });
  return result.ok;
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
