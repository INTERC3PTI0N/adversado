import Link from "next/link";
import { getSupabase } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/rbac";
import {
  Badge, EmptyState, PageHeading, Panel, PanelHeader, Stat, Table, Td, Th,
} from "@/components/admin/ui";
import { SeoSettingsForm } from "@/components/admin/SeoSettingsForm";
import { RedirectsTable } from "@/components/admin/RedirectsTable";
import type { Field } from "@/lib/cms/schemas";
import type { Json } from "@/lib/supabase/types";

export const metadata = { title: "SEO — Adversado Admin" };
export const dynamic = "force-dynamic";

/* Lengths are Google's practical truncation points, not hard limits — the
   counter turns red near them rather than blocking the save. */
const FIELDS: { title: string; hint?: string; fields: Field[] }[] = [
  {
    title: "Defaults",
    hint: "Used wherever a page hasn't set its own.",
    fields: [
      {
        key: "default_title",
        label: "Default title",
        type: "text",
        maxLength: 60,
        help: "Shown for the home page and anything without its own title.",
      },
      {
        key: "default_description",
        label: "Default description",
        type: "textarea",
        maxLength: 160,
        help: "The sentence under the link in search results.",
      },
    ],
  },
  {
    title: "Verification",
    hint: "Codes from Search Console and Bing Webmaster Tools.",
    fields: [
      { key: "google_verification", label: "Google verification", type: "text" },
      { key: "bing_verification", label: "Bing verification", type: "text" },
    ],
  },
  {
    title: "Crawling",
    fields: [
      {
        key: "robots_txt",
        label: "robots.txt",
        type: "richtext",
        help: "Leave blank to serve the default, which allows everything and points at the sitemap.",
      },
    ],
  },
];

/** Collections that carry an SEO block, for the audit below. */
const AUDITED = [
  { table: "posts", label: "Blog post", route: "blog", titleField: "title" },
  { table: "projects", label: "Project", route: "projects", titleField: "title" },
  { table: "case_studies", label: "Case study", route: "case-studies", titleField: "title" },
  { table: "services", label: "Service", route: "services", titleField: "name" },
] as const;

type AuditRow = {
  id: string;
  label: string;
  kind: string;
  route: string;
  missing: string[];
};

export default async function SeoPage() {
  await requireStaff("admin");
  const supabase = await getSupabase();

  const [settingsRes, redirectsRes, ...auditRes] = await Promise.all([
    supabase.from("seo_settings").select("*").eq("id", true).single(),
    supabase.from("redirects").select("*").order("from_path"),
    ...AUDITED.map((c) =>
      supabase
        .from(c.table)
        .select(`id, ${c.titleField}, seo_title, seo_description, noindex, status`)
        .eq("status", "published")
        .is("deleted_at", null)
        .limit(200),
    ),
  ]);

  const settings = (settingsRes.data ?? {}) as Record<string, Json>;

  /* Published pages missing a title or description are the ones actually
     costing traffic — drafts don't need chasing, so they aren't listed. */
  const audit: AuditRow[] = AUDITED.flatMap((collection, i) => {
    const rows = (auditRes[i]?.data ?? []) as unknown as Record<string, unknown>[];

    return rows
      .map((row) => {
        const missing: string[] = [];
        if (!row.seo_title) missing.push("Title");
        if (!row.seo_description) missing.push("Description");
        if (row.noindex) missing.push("Hidden from search");

        return {
          id: String(row.id),
          label: String(row[collection.titleField] ?? "Untitled"),
          kind: collection.label,
          route: collection.route,
          missing,
        };
      })
      .filter((row) => row.missing.length > 0);
  });

  const initial = Object.fromEntries(
    FIELDS.flatMap((g) => g.fields).map((f) => [
      f.key,
      typeof settings[f.key] === "string" ? (settings[f.key] as string) : "",
    ]),
  );

  const redirects = redirectsRes.data ?? [];

  return (
    <>
      <PageHeading
        eyebrow="Content"
        title="SEO"
        description="Site-wide defaults, redirects, and anything published that search engines can't read properly yet."
      />

      <div className="mb-7 grid gap-5 sm:grid-cols-3">
        <Stat
          label="Needs attention"
          value={audit.length}
          tone={audit.length > 0 ? "gold" : "cream"}
          hint="Published pages missing title or description"
        />
        <Stat label="Redirects" value={redirects.length} hint={`${redirects.filter((r) => r.is_active).length} active`} />
        <Stat
          label="Redirect hits"
          value={redirects.reduce((a, r) => a + r.hit_count, 0)}
          tone="navy"
          hint="Visits rescued from a 404"
        />
      </div>

      <div className="mb-7">
        <Panel>
          <PanelHeader
            title="Needs attention"
            hint="Only published content. Drafts are left alone until they go live."
          />
          {audit.length === 0 ? (
            <EmptyState
              title="Nothing outstanding"
              body="Every published page has a search title and a description."
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Page</Th>
                  <Th>Type</Th>
                  <Th>Missing</Th>
                </tr>
              </thead>
              <tbody>
                {audit.map((row) => (
                  <tr key={`${row.route}-${row.id}`}>
                    <Td>
                      <Link
                        href={`/admin/content/${row.route}/${row.id}`}
                        className="font-black underline decoration-charcoal/30 underline-offset-4 hover:decoration-charcoal"
                      >
                        {row.label}
                      </Link>
                    </Td>
                    <Td className="text-charcoal/60">{row.kind}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-1.5">
                        {row.missing.map((m) => (
                          <Badge key={m} tone={m === "Hidden from search" ? "urgent" : "in_review"}>
                            {m}
                          </Badge>
                        ))}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Panel>
      </div>

      <div className="mb-7">
        <RedirectsTable redirects={redirects} />
      </div>

      <SeoSettingsForm groups={FIELDS} initial={initial} />
    </>
  );
}
