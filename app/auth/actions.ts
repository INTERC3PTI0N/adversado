"use server";

import { redirect } from "next/navigation";
import { getSupabase } from "@/lib/supabase/server";

/**
 * First-login actions: redeem an invite, then set a password.
 *
 * Both run as the visitor's own session. The invite is redeemed with
 * `verifyOtp`, which writes the session cookie itself — so where the person
 * ends up never depends on Supabase's Site URL or redirect allowlist.
 */

const KINDS = ["invite", "recovery"] as const;
type Kind = (typeof KINDS)[number];

/**
 * Redeem the token. A form POST rather than a GET on purpose: mail scanners
 * (Outlook Safe Links, corporate gateways) open every link in an email to vet
 * it, and a GET that verified would spend the one-time token before the person
 * ever clicked. Scanners don't submit forms.
 */
export async function redeemInvite(formData: FormData): Promise<void> {
  const tokenHash = String(formData.get("token_hash") ?? "");
  const type = String(formData.get("type") ?? "");

  if (!tokenHash || !(KINDS as readonly string[]).includes(type)) {
    redirect("/auth/set-password?error=invalid");
  }

  const supabase = await getSupabase();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as Kind,
  });

  redirect(error ? "/auth/set-password?error=expired" : "/auth/set-password");
}

export type PasswordResult =
  | { ok: true; next: string | null }
  | { ok: false; error: string };

export async function setPassword(
  password: string,
  confirm: string,
): Promise<PasswordResult> {
  // bcrypt, which Supabase hashes with, ignores everything past 72 bytes.
  if (password.length < 8) return { ok: false, error: "Use at least 8 characters." };
  if (password.length > 72) return { ok: false, error: "Keep it under 72 characters." };
  if (password !== confirm) return { ok: false, error: "The two passwords don't match." };

  const supabase = await getSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "This link has expired. Ask for a new invite." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: error.message };

  // Where to go next. A staff account that hasn't been switched on yet has
  // nowhere to go, and the page says so rather than bouncing them into a
  // login loop.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active, client_id")
    .eq("id", user.id)
    .single();

  if (!profile?.is_active) return { ok: true, next: null };
  if (profile.role === "client") return { ok: true, next: profile.client_id ? "/portal" : null };
  return { ok: true, next: "/admin" };
}
