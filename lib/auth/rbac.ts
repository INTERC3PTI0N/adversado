import "server-only";

import { redirect } from "next/navigation";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/supabase/types";
import { atLeast, isStaff } from "./roles";

/**
 * Session guards, server-side only.
 *
 * The pure role predicates live in `./roles` so client components can share
 * them; this module adds the parts that need cookies and the database.
 *
 * Nothing here is a substitute for RLS. If a policy is missing, a guard here
 * will not save you.
 */

export * from "./roles";

export type Session = { userId: string; profile: Profile };

/** Current profile, or null when signed out or deactivated. */
export async function getSession(): Promise<Session | null> {
  // No project linked yet: treat as signed out rather than throwing, so the
  // admin can render a setup screen instead of a stack trace.
  if (!isSupabaseConfigured()) return null;

  const supabase = await getSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // A deactivated account keeps a valid JWT until it expires; treat it as
  // signed out rather than trusting the token alone.
  if (!profile || !profile.is_active) return null;

  return { userId: user.id, profile: profile as Profile };
}

/**
 * Guard for the admin area. Redirects on the server, so the protected HTML is
 * never sent to an unauthorised visitor.
 */
export async function requireStaff(minimum: UserRole = "editor"): Promise<Session> {
  if (!isSupabaseConfigured()) redirect("/admin/setup");

  const session = await getSession();

  if (!session) redirect("/admin/login");

  const { role } = session.profile;

  // A client-role user has no business in /admin at all — send them to their
  // own portal rather than to a login screen they are already past.
  if (role === "client") redirect("/portal");

  if (!atLeast(role, minimum)) redirect("/admin?denied=1");

  return session;
}

/** Guard for the client portal. */
export async function requireClient(): Promise<Session & { clientId: string }> {
  const session = await getSession();

  if (!session) redirect("/portal/login");

  const { role, client_id } = session.profile;

  if (isStaff(role)) redirect("/admin");
  if (!client_id) redirect("/portal/no-access");

  return { ...session, clientId: client_id };
}

/** For route handlers, which should answer 401/403 rather than redirect. */
export async function requireStaffApi(
  minimum: UserRole = "editor",
): Promise<{ session: Session } | { error: Response }> {
  const session = await getSession();

  if (!session) {
    return {
      error: Response.json({ error: "Not signed in." }, { status: 401 }),
    };
  }

  if (session.profile.role === "client" || !atLeast(session.profile.role, minimum)) {
    return {
      error: Response.json(
        { error: "You do not have access to this." },
        { status: 403 },
      ),
    };
  }

  return { session };
}
