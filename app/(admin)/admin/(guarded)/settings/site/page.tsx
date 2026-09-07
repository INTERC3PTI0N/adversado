import { getSupabase } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/rbac";
import { PageHeading, Panel, PanelHeader } from "@/components/admin/ui";
import { SeoSettingsForm } from "@/components/admin/SeoSettingsForm";
import { CONTACT } from "@/lib/contact";
import type { Field } from "@/lib/cms/schemas";
import type { Json } from "@/lib/supabase/types";

export const metadata = { title: "Site settings — Adversado Admin" };
export const dynamic = "force-dynamic";

/**
 * Site identity.
 *
 * Shares the `seo_settings` singleton with the SEO screen but owns a disjoint
 * set of fields — nothing appears on both, so saving one screen can never
 * blank what was set on the other.
 */
const FIELDS: { title: string; hint?: string; fields: Field[] }[] = [
  {
    title: "Identity",
    fields: [
      {
        key: "site_name",
        label: "Site name",
        type: "text",
        help: "Used in the browser tab, in search results and in the schema markup.",
      },
      {
        key: "title_template",
        label: "Title template",
        type: "text",
        help: "%s is replaced by the page's own title. “%s — Adversado” gives “Services — Adversado”.",
      },
    ],
  },
  {
    title: "Organisation markup",
    hint: "JSON-LD that tells Google who the studio is. Shown in knowledge panels.",
    fields: [
      { key: "organisation_jsonld", label: "Organisation JSON-LD", type: "richtext" },
    ],
  },
];

export default async function SiteSettingsPage() {
  await requireStaff("admin");
  const supabase = await getSupabase();

  const { data } = await supabase.from("seo_settings").select("*").eq("id", true).single();
  const settings = (data ?? {}) as Record<string, Json>;

  const initial = Object.fromEntries(
    FIELDS.flatMap((g) => g.fields).map((f) => {
      const value = settings[f.key];
      return [
        f.key,
        // JSON-LD comes back as an object; the textarea wants it formatted.
        typeof value === "string"
          ? value
          : value
            ? JSON.stringify(value, null, 2)
            : "",
      ];
    }),
  );

  return (
    <>
      <PageHeading
        eyebrow="System"
        title="Site settings"
        description="How the site names itself. Search titles and redirects live under SEO."
      />

      <div className="mb-7">
        <Panel>
          <PanelHeader
            title="Contact details"
            hint="Set in the code, so the footer and the contact page can never drift apart."
          />
          <dl className="divide-y divide-charcoal/15">
            {[
              ["Address", CONTACT.addressLines.join(", ")],
              ["Email", CONTACT.email],
              ["Phone", CONTACT.phoneDisplay],
            ].map(([term, value]) => (
              <div key={term} className="flex flex-wrap gap-x-6 gap-y-1 px-5 py-3">
                <dt className="min-w-[6rem] font-sans text-[0.62rem] font-black uppercase tracking-[0.18em] text-charcoal/55">
                  {term}
                </dt>
                <dd className="font-sans text-[0.88rem] font-medium text-charcoal">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="border-t-[3px] border-charcoal px-5 py-4 font-sans text-[0.8rem] font-medium leading-[1.6] text-charcoal/60">
            To change these, edit <code className="font-mono text-[0.78rem]">lib/contact.ts</code>{" "}
            and redeploy. They are deliberately not editable here — a wrong phone
            number saved by accident would be live on every page at once.
          </p>
        </Panel>
      </div>

      <SeoSettingsForm groups={FIELDS} initial={initial} />
    </>
  );
}
