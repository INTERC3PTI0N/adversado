import { redirect } from "next/navigation";
import { getSupabase } from "@/lib/supabase/server";
import { requireClient } from "@/lib/auth/rbac";
import { PortalChrome } from "@/components/portal/PortalChrome";

/**
 * Guarded portal shell.
 *
 * `requireClient()` runs before anything renders, and RLS scopes every query
 * underneath it through `auth_client_id()`. Two independent boundaries: even a
 * missing check here returns another client's rows to nobody.
 *
 * `portal_enabled` is checked separately from access. A client can hold a valid
 * login while their portal is switched off — that combination shows the
 * no-access page rather than an empty dashboard that looks broken.
 */
export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { clientId } = await requireClient();
  const supabase = await getSupabase();

  const [clientRes, unreadRes] = await Promise.all([
    supabase.from("clients").select("name, portal_enabled").eq("id", clientId).single(),
    supabase
      .from("client_messages")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .is("read_at", null),
  ]);

  const client = clientRes.data;
  if (!client || !client.portal_enabled) redirect("/portal/no-access");

  return (
    <div className="flex min-h-screen flex-col">
      <PortalChrome clientName={client.name} unread={unreadRes.count ?? 0} />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-10 sm:px-8">
        {children}
      </main>
    </div>
  );
}
