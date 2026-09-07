import { getSupabase } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/rbac";
import { PageHeading } from "@/components/admin/ui";
import { UsersTable } from "@/components/admin/UsersTable";
import type { Client, Profile } from "@/lib/supabase/types";

export const metadata = { title: "Users & roles — Adversado Admin" };
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const { profile } = await requireStaff("super_admin");
  const supabase = await getSupabase();

  const [usersRes, clientsRes] = await Promise.all([
    supabase
      .from("profiles")
      // Inactive first: a pending invite is the row that needs a decision.
      .select("*")
      .order("is_active", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase.from("clients").select("id, name").is("deleted_at", null).order("name"),
  ]);

  return (
    <>
      <PageHeading
        eyebrow="System"
        title="Users & roles"
        description="Who can sign in, and what they can reach once they do. Roles are enforced in the database, so this table is the whole story."
      />

      <UsersTable
        users={(usersRes.data ?? []) as Profile[]}
        clients={(clientsRes.data ?? []) as Pick<Client, "id" | "name">[]}
        self={profile.id}
      />
    </>
  );
}
