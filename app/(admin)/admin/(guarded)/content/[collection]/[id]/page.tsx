import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabase } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/rbac";
import { COLLECTION_BY_ROUTE } from "@/lib/cms/collections";
import { ItemEditor } from "@/components/admin/ItemEditor";
import { PageHeading } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

/**
 * Editor for one collection item. `new` is a reserved id meaning "create",
 * which keeps the create and edit screens as one component rather than two
 * that drift apart.
 */
export default async function ItemPage({
  params,
}: {
  params: Promise<{ collection: string; id: string }>;
}) {
  const { collection: route, id } = await params;
  const collection = COLLECTION_BY_ROUTE[route];
  if (!collection) notFound();

  const { profile } = await requireStaff("editor");

  const creating = id === "new";
  let initial: Record<string, unknown> = { status: collection.publishable ? "draft" : "published" };

  if (!creating) {
    const supabase = await getSupabase();
    const { data } = await supabase
      .from(collection.key)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!data) notFound();
    initial = data as Record<string, unknown>;
  }

  const title = creating
    ? `New ${collection.singular.toLowerCase()}`
    : String(initial[collection.titleField] ?? collection.singular);

  return (
    <>
      <PageHeading
        eyebrow={
          <Link
            href={`/admin/content/${route}`}
            className="underline underline-offset-4"
          >
            {collection.label}
          </Link>
        }
        title={title}
      />
      <ItemEditor
        collection={collection}
        id={creating ? null : id}
        initial={initial}
        role={profile.role}
      />
    </>
  );
}
