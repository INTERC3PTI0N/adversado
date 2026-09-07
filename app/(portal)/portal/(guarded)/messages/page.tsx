import { getSupabase } from "@/lib/supabase/server";
import { requireClient } from "@/lib/auth/rbac";
import { PageHeading } from "@/components/admin/ui";
import { MessageThread } from "@/components/portal/MessageThread";

export const metadata = { title: "Messages — Adversado" };
export const dynamic = "force-dynamic";

export default async function PortalMessages() {
  const { userId } = await requireClient();
  const supabase = await getSupabase();

  // Scoped by `client_messages_read`, not by a filter here.
  const { data } = await supabase
    .from("client_messages")
    .select("id, body, created_at, author_id, read_at")
    .order("created_at", { ascending: true })
    .limit(200);

  return (
    <>
      <PageHeading
        eyebrow="Your account"
        title="Messages"
        description="A direct line to the team. Everything here is kept with your account."
      />

      <MessageThread messages={data ?? []} selfId={userId} />
    </>
  );
}
