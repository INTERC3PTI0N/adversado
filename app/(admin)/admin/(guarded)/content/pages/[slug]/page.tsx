import { notFound } from "next/navigation";
import { getSupabase } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/rbac";
import { SCHEMA_BY_KIND, defaultsFor } from "@/lib/cms/schemas";
import { SectionEditor } from "@/components/admin/SectionEditor";
import {
  Badge, ButtonLink, EmptyState, PageHeading, Panel, PanelHeader, label,
} from "@/components/admin/ui";
import type { PageSection } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

/**
 * Section editor for one page.
 *
 * Each section renders a form built from its schema. Stored `data` is merged
 * over the schema defaults, so a row saved before a field existed still shows
 * that field with its default rather than an empty box.
 */
export default async function PageEditor({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: raw } = await params;
  const slug = decodeURIComponent(raw);

  const { profile } = await requireStaff("editor");
  const supabase = await getSupabase();

  const { data: page } = await supabase
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!page) notFound();

  const { data: sections } = await supabase
    .from("page_sections")
    .select("*")
    .eq("page_id", page.id)
    .order("position");

  const rows = (sections ?? []) as PageSection[];

  return (
    <>
      <PageHeading
        eyebrow="Pages"
        title={page.title}
        description={
          slug === "_site"
            ? "Content that appears on every page."
            : `Editing the sections on ${slug}. Changes go live as soon as they are published.`
        }
        action={
          slug !== "_site" ? (
            <ButtonLink href={slug} tone="secondary">
              View page ↗
            </ButtonLink>
          ) : undefined
        }
      />

      {rows.length === 0 ? (
        <Panel>
          <EmptyState
            title="No sections yet"
            body="This page is declared in the registry but its sections have not been created. Run Sync pages from the list."
            action={<ButtonLink href="/admin/content/pages">Back to pages</ButtonLink>}
          />
        </Panel>
      ) : (
        <div className="flex flex-col gap-8">
          {rows.map((section) => {
            const schema = SCHEMA_BY_KIND[section.kind];

            // A section whose schema was removed from the registry: show it
            // rather than hiding it, so the orphan is visible and fixable.
            if (!schema) {
              return (
                <Panel key={section.id}>
                  <PanelHeader
                    title={section.label ?? section.key}
                    hint={`Unknown section type "${section.kind}" — its schema is no longer in the registry.`}
                  />
                </Panel>
              );
            }

            return (
              <Panel key={section.id}>
                <PanelHeader
                  title={schema.label}
                  hint={schema.description}
                  action={<Badge tone={section.status}>{label(section.status)}</Badge>}
                />
                <div className="p-5 sm:p-6">
                  <SectionEditor
                    sectionId={section.id}
                    schema={schema}
                    initialData={{
                      ...defaultsFor(section.kind),
                      ...(section.data as Record<string, unknown>),
                    }}
                    initialStatus={section.status}
                    initialScheduledAt={section.scheduled_at}
                    pageSlug={slug}
                    role={profile.role}
                  />
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </>
  );
}
