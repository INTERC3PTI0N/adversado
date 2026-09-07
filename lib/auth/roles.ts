import type { UserRole } from "@/lib/supabase/types";

/**
 * Pure role helpers — no server-only imports, so client components can use them
 * too. The session-reading guards live in `rbac.ts`, which is server-only
 * because it touches cookies and the service-role client.
 *
 * These mirror the SQL functions in migration 0001. Keep the two in step: the
 * database is the boundary, this is the UI's view of it.
 */

export const RANK: Record<UserRole, number> = {
  client: 0,
  editor: 1,
  admin: 2,
  super_admin: 3,
};

export const ROLE_LABEL: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  editor: "Editor",
  client: "Client",
};

export const ROLE_DESCRIPTION: Record<UserRole, string> = {
  super_admin: "Everything, including user management and permanent deletes.",
  admin: "All content and CRM. Cannot change roles or delete users.",
  editor: "Content only. Can save and schedule, cannot publish.",
  client: "Client portal only. Sees their own projects, invoices and files.",
};

export function atLeast(role: UserRole, min: UserRole): boolean {
  return RANK[role] >= RANK[min];
}

export function isStaff(role: UserRole | null | undefined): boolean {
  return role === "super_admin" || role === "admin" || role === "editor";
}

export function isAdmin(role: UserRole | null | undefined): boolean {
  return role === "super_admin" || role === "admin";
}

export function isSuperAdmin(role: UserRole | null | undefined): boolean {
  return role === "super_admin";
}

/** Editors may write and schedule; only admins may publish. */
export function canPublish(role: UserRole | null | undefined): boolean {
  return isAdmin(role);
}
