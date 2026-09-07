import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabase } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/rbac";
import { COLLECTION_BY_ROUTE } from "@/lib/cms/collections";
import {
  Badge, ButtonLink, EmptyState, PageHeading, Panel, Table, Td, Th, label,
} from "@/components/admin/ui";
import { ReorderControls } from "@/components/admin/ReorderControls";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown> & { id: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ collection: string }>;
}) {
  const { collection } = await params;
  const c = COLLECTION_BY_ROUTE[collection];
  return { title: `${c?.label ?? "Content"} — Adversado Admin` };
}

/**
 * Collection list — one component for every collection.
 *
 * The registry decides the columns, the ordering and whether the rows can be
 * reordered by hand, so adding a collection needs no new page.
 */
export default async function CollectionList({
  params,
}: {
  params: Promise<{ collection: string }>;
}) {
  const { collection: route } = await params;
  const collection = COLLECTION_BY_ROUTE[route];
  if (!collection) notFound();

  await requireStaff("editor");
  const supabase = await getSupabase();

  const { data } = await supabase
    .from(collection.key)
    .select("*")
    .is("deleted_at", null)
    .order(collection.orderBy.column, { ascending: collection.orderBy.ascending });

  const rows = (data ?? []) as Row[];

  return (
    <>
      <PageHeading
        eyebrow="Content"
        title={collection.label}
        description={collection.description}
        action={
          <ButtonLink href={`/admin/content/${route}/new`}>
            New {collection.singular.toLowerCase()}
          </ButtonLink>
        }
      />

      <Panel>
        {rows.length === 0 ? (
          <EmptyState
            title={`No ${collection.label.toLowerCase()} yet`}
            body={`Create the first ${collection.singular.toLowerCase()} and it will appear on the site once published.`}
            action={
              <ButtonLink href={`/admin/content/${route}/new`}>
                New {collection.singular.toLowerCase()}
              </ButtonLink>
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                {collection.sortable ? <Th className="w-24">Order</Th> : null}
                <Th>{collection.singular}</Th>
                {collection.listColumns.map((c) => (
                  <Th key={c.key}>{c.label}</Th>
                ))}
                <Th className="text-right">Status</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id}>
                  {collection.sortable ? (
                    <Td>
                      <ReorderControls
                        route={route}
                        ids={rows.map((r) => r.id)}
                        index={i}
                      />
                    </Td>
                  ) : null}
                  <Td>
                    <Link
                      href={`/admin/content/${route}/${row.id}`}
                      className="font-black underline decoration-charcoal/30 underline-offset-4 hover:decoration-charcoal"
                    >
                      {String(row[collection.titleField] ?? "Untitled").slice(0, 90)}
                    </Link>
                    {collection.slugField && row[collection.slugField] ? (
                      <span className="block font-mono text-[0.74rem] text-charcoal/50">
                        /{String(row[collection.slugField])}
                      </span>
                    ) : null}
                  </Td>
                  {collection.listColumns.map((c) => (
                    <Td key={c.key} className="text-charcoal/70">
                      {row[c.key]
                        ? c.key.endsWith("_at")
                          ? new Date(String(row[c.key])).toLocaleDateString("en-GB", {
                              day: "2-digit", month: "short", year: "2-digit",
                            })
                          : String(row[c.key])
                        : "—"}
                    </Td>
                  ))}
                  <Td className="text-right">
                    <Badge tone={String(row.status)}>{label(String(row.status))}</Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>
    </>
  );
}
