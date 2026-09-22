import "server-only";

import { headers } from "next/headers";
import { getServiceSupabase } from "@/lib/supabase/server";

/**
 * Invitation links.
 *
 * These used to be Supabase's own `action_link` — a
 * `…supabase.co/auth/v1/verify?token=…` URL pasted into the email. Three
 * things were wrong with that:
 *
 *  1. It read as a random string on someone else's domain.
 *  2. After verifying, Supabase only honours `redirect_to` if that exact URL is
 *     on the project's Redirect URL allowlist. Otherwise it silently falls back
 *     to the project's Site URL — which is `http://localhost:3000` on a new
 *     project. So invites landed on localhost regardless of what this code sent.
 *  3. Nothing on the site could set a password anyway, so even a correct link
 *     ended on a login form asking for a password nobody had been given.
 *
 * Instead the link points at our own `/auth/confirm`, carrying the
 * `hashed_token` that `generateLink` returns. That route verifies it server-side
 * with `verifyOtp`, which sets the session cookie directly — Supabase's
 * redirect, its allowlist and its Site URL are never consulted — and hands over
 * to `/auth/set-password`.
 */

export type InviteKind = "invite" | "recovery";

/**
 * Where links should point. The explicit setting wins; failing that, the domain
 * the admin is actually using when they press Invite — correct in production
 * without any configuration, and correct locally too. Vercel's production URL
 * is the last resort for calls with no request in scope.
 */
export async function linkOrigin(): Promise<string> {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const proto =
        h.get("x-forwarded-proto") ??
        (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
      return `${proto}://${host}`;
    }
  } catch {
    /* No request in scope — fall through. */
  }

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}

async function linkFor(hashedToken: string, kind: InviteKind): Promise<string> {
  const params = new URLSearchParams({ token_hash: hashedToken, type: kind });
  return `${await linkOrigin()}/auth/confirm?${params}`;
}

export type InviteResult =
  | { ok: true; userId: string; link: string }
  | { ok: false; error: string; exists?: boolean };

/** Creates the auth user and returns a first-login link on our own domain. */
export async function createInvite(
  email: string,
  metadata: Record<string, unknown> = {},
): Promise<InviteResult> {
  const { data, error } = await getServiceSupabase().auth.admin.generateLink({
    type: "invite",
    email,
    options: { data: metadata },
  });

  const hashed = data?.properties?.hashed_token;
  if (error || !hashed || !data.user?.id) {
    const message = error?.message ?? "Could not create the invite.";
    const exists = /already been registered|already exists/i.test(message);
    return { ok: false, error: message, exists };
  }

  return { ok: true, userId: data.user.id, link: await linkFor(hashed, "invite") };
}

/**
 * A fresh link for someone whose invite never got used — the case every
 * invite sent before this fix is in, since those links pointed at localhost.
 *
 * `generateLink({ type: "invite" })` refuses an address that already has an
 * account, so this issues a password-setting (`recovery`) link instead.
 *
 * Only for accounts that have never signed in. Without that limit this would
 * mint a working login link for *any* account — and when mail isn't configured
 * the link is shown on screen, so a super admin could sign in as another super
 * admin. Re-sending a pending invite is the power intended here; taking over an
 * account someone already uses is not.
 */
export async function reissueInvite(
  userId: string,
): Promise<{ ok: true; email: string; link: string } | { ok: false; error: string }> {
  const service = getServiceSupabase();

  const { data: found, error: lookupError } = await service.auth.admin.getUserById(userId);
  if (lookupError || !found?.user?.email) {
    return { ok: false, error: "That account no longer exists." };
  }

  if (found.user.last_sign_in_at) {
    return {
      ok: false,
      error:
        "They have already signed in, so there's no pending invite to resend. If they've forgotten their password, delete and re-invite them.",
    };
  }

  const { data, error } = await service.auth.admin.generateLink({
    type: "recovery",
    email: found.user.email,
  });

  const hashed = data?.properties?.hashed_token;
  if (error || !hashed) {
    return { ok: false, error: error?.message ?? "Could not create a new link." };
  }

  return { ok: true, email: found.user.email, link: await linkFor(hashed, "recovery") };
}
