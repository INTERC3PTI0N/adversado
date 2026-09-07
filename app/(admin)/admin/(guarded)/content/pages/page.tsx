import Link from "next/link";
import { getSupabase } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/rbac";
import { PAGE_MAP } from "@/lib/cms/schemas";
import {
  Badge, EmptyState, PageHeading, Panel, Table, Td, Th, label,
} from "@/components/admin/ui";
import { SyncPagesButton } from "@/components/admin/SyncPagesButton";

export const metadata = { title: "Pages — Adversado Admin" };
export const dynamic = "force-dynamic";

/**
 * Page list.
 *
 * The registry in `lib/cms/schemas.ts` is the source of truth for which pages
 * and sections exist; the database holds their content. Anything declared but
 * not yet seeded shows as "Not synced" with a one-click fix, so adding a
 * section in code never leaves the admin out of step.
 */
export default async function PagesIndex() {
  await requireStaff("editor");
  const supabase = await getSupabase();

  const { data: pages } = await supabase
    .from("pages")
    .select("id, slug, title, status, updated_at")
    .order("slug");

  const { data: sections } = await supabase
    .from("page_sections")
    .select("page_id, status");

  const rows = PAGE_MAP.map((declared) => {
    const row = pages?.find((p) => p.slug === declared.slug);
    const own = row ? (sections ?? []).filter((s) => s.page_id === row.id) : [];
    return {
      ...declared,
      id: row?.id ?? null,
      status: row?.status ?? null,
      updated_at: row?.updated_at ?? null,
      sectionCount: own.length,
      declaredCount: declared.sections.length,
    };
  });

  const unsynced = rows.filter((r) => !r.id || r.sectionCount < r.declaredCount);

  return (
    <>
      <PageHeading
        eyebrow="Content"
        title="Pages & sections"
        description="Every text section on the site. Edit a page to change its copy — the site updates within moments of saving."
        action={<SyncPagesButton />}
      />

      {unsynced.length > 0 ? (
        <div className="mb-7 border-[3px] border-charcoal bg-gold px-5 py-4">
          <p className="font-sans text-[0.86rem] font-bold text-charcoal">
            {unsynced.length} page{unsynced.length === 1 ? "" : "s"} declared in code
            but not yet in the database. Press <strong>Sync pages</strong> to create
            them, seeded with the copy that is already live.
          </p>
        </div>
      ) : null}

      <Panel>
        {rows.length === 0 ? (
          <EmptyState title="No pages" body="Run Sync pages to create them." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Page</Th>
                <Th>Route</Th>
                <Th>Sections</Th>
                <Th>Status</Th>
                <Th className="text-right">Updated</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.slug}>
                  <Td>
                    {row.id ? (
                      <Link
                        href={`/admin/content/pages/${encodeURIComponent(row.slug)}`}
                        className="font-black underline decoration-charcoal/30 underline-offset-4 hover:decoration-charcoal"
                      >
                        {row.title}
                      </Link>
                    ) : (
                      <span className="font-black text-charcoal/50">{row.title}</span>
                    )}
                  </Td>
                  <Td className="font-mono text-[0.8rem] text-charcoal/60">{row.slug}</Td>
                  <Td className="tabular-nums">
                    {row.sectionCount} / {row.declaredCount}
                  </Td>
                  <Td>
                    {row.status ? (
                      <Badge tone={row.status}>{label(row.status)}</Badge>
                    ) : (
                      <Badge tone="archived">Not synced</Badge>
                    )}
                  </Td>
                  <Td className="text-right tabular-nums text-charcoal/60">
                    {row.updated_at
                      ? new Date(row.updated_at).toLocaleDateString("en-GB", {
                          day: "2-digit", month: "short", year: "2-digit",
                        })
                      : "—"}
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
