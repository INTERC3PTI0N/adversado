import type { Field } from "./schemas";

/**
 * Collection registry.
 *
 * Blog, portfolio, case studies, services, team, testimonials and FAQs are the
 * same screen with different columns: a list, an editor, status, ordering and
 * SEO. Declaring them here means one list component and one editor component
 * instead of six near-identical pairs, and a seventh collection costs an entry
 * rather than a directory.
 */

export type CollectionKey =
  | "posts"
  | "projects"
  | "case_studies"
  | "services"
  | "team_members"
  | "testimonials"
  | "faqs";

export type Collection = {
  key: CollectionKey;
  /** URL segment under /admin/content. */
  route: string;
  label: string;
  singular: string;
  description: string;
  /** Column holding the human name, used for list rows and search. */
  titleField: string;
  /** Slug column, if the collection has one. */
  slugField?: string;
  /** Column the list sorts by, and whether ascending. */
  orderBy: { column: string; ascending: boolean };
  /** Manual ordering via a `position` column. */
  sortable: boolean;
  /** Publishing workflow and scheduling apply. */
  publishable: boolean;
  /** Carries the SEO block. */
  seo: boolean;
  /** Extra columns shown in the list. */
  listColumns: { key: string; label: string }[];
  fields: Field[];
};

const t = (key: string, label: string, extra: Partial<Field> = {}): Field => ({
  key, label, type: "text", ...extra,
});
const area = (key: string, label: string, extra: Partial<Field> = {}): Field => ({
  key, label, type: "textarea", ...extra,
});

export const COLLECTIONS: Collection[] = [
  {
    key: "posts",
    route: "blog",
    label: "Blog",
    singular: "Post",
    description:
      "Articles. Each one carries its own SEO block and can be scheduled to publish.",
    titleField: "title",
    slugField: "slug",
    orderBy: { column: "created_at", ascending: false },
    sortable: false,
    publishable: true,
    seo: true,
    listColumns: [{ key: "published_at", label: "Published" }],
    fields: [
      t("title", "Title", { required: true }),
      t("slug", "Slug", { required: true, help: "The URL segment, e.g. why-brand-strategy-first" }),
      area("excerpt", "Excerpt", { help: "Shown on the index and used as the fallback meta description." }),
      { key: "body", label: "Body", type: "richtext", help: "The article itself." },
      { key: "reading_minutes", label: "Reading time (minutes)", type: "number" },
      { key: "is_featured", label: "Feature on the index", type: "boolean" },
    ],
  },
  {
    key: "projects",
    route: "projects",
    label: "Portfolio",
    singular: "Project",
    description: "The work shown on the Projects page.",
    titleField: "title",
    slugField: "slug",
    orderBy: { column: "position", ascending: true },
    sortable: true,
    publishable: true,
    seo: true,
    listColumns: [
      { key: "client_name", label: "Client" },
      { key: "category", label: "Category" },
    ],
    fields: [
      t("title", "Title", { required: true }),
      t("slug", "Slug", { required: true }),
      t("client_name", "Client"),
      t("category", "Category", { help: "Identity, Print, Packaging, Advertising, Web, Events, Social" }),
      { key: "year", label: "Year", type: "number" },
      area("summary", "Summary"),
      { key: "is_featured", label: "Featured", type: "boolean" },
    ],
  },
  {
    key: "case_studies",
    route: "case-studies",
    label: "Case studies",
    singular: "Case study",
    description: "Longer write-ups: the challenge, the approach, the result.",
    titleField: "title",
    slugField: "slug",
    orderBy: { column: "position", ascending: true },
    sortable: true,
    publishable: true,
    seo: true,
    listColumns: [{ key: "client_name", label: "Client" }],
    fields: [
      t("title", "Title", { required: true }),
      t("slug", "Slug", { required: true }),
      t("client_name", "Client"),
      area("challenge", "The challenge"),
      area("approach", "The approach"),
      area("result", "The result"),
    ],
  },
  {
    key: "services",
    route: "services",
    label: "Services",
    singular: "Service",
    description:
      "The four verticals. These feed the Services page and the cards on the home page.",
    titleField: "name",
    slugField: "slug",
    orderBy: { column: "position", ascending: true },
    sortable: true,
    publishable: true,
    seo: true,
    listColumns: [{ key: "vertical_index", label: "Index" }],
    fields: [
      t("name", "Name", { required: true }),
      t("slug", "Slug", { required: true, help: "Also the anchor the home cards link to." }),
      t("vertical_index", "Index", { help: '"01" to "04"' }),
      t("tagline", "Tagline"),
      t("quip", "Quip"),
    ],
  },
  {
    key: "team_members",
    route: "team",
    label: "Team",
    singular: "Team member",
    description: "The portrait wall on the About page.",
    titleField: "name",
    orderBy: { column: "position", ascending: true },
    sortable: true,
    publishable: false,
    seo: false,
    listColumns: [{ key: "role_title", label: "Role" }],
    fields: [
      t("name", "Name", { required: true }),
      t("role_title", "Role"),
      area("bio", "Bio"),
    ],
  },
  {
    key: "testimonials",
    route: "testimonials",
    label: "Testimonials",
    singular: "Testimonial",
    description: "Client quotes.",
    titleField: "author_name",
    orderBy: { column: "position", ascending: true },
    sortable: true,
    publishable: false,
    seo: false,
    listColumns: [{ key: "company", label: "Company" }],
    fields: [
      area("quote", "Quote", { required: true }),
      t("author_name", "Author", { required: true }),
      t("author_role", "Their role"),
      t("company", "Company"),
      { key: "rating", label: "Rating (1–5)", type: "number" },
      { key: "is_featured", label: "Featured", type: "boolean" },
    ],
  },
  {
    key: "faqs",
    route: "faqs",
    label: "FAQs",
    singular: "Question",
    description: "The accordion on the FAQ page.",
    titleField: "question",
    orderBy: { column: "position", ascending: true },
    sortable: true,
    publishable: false,
    seo: false,
    listColumns: [{ key: "category", label: "Category" }],
    fields: [
      area("question", "Question", { required: true }),
      area("answer", "Answer", { required: true }),
      t("category", "Category"),
    ],
  },
];

export const COLLECTION_BY_ROUTE: Record<string, Collection> = Object.fromEntries(
  COLLECTIONS.map((c) => [c.route, c]),
);

/** The SEO block, appended to any collection that carries it. */
export const SEO_FIELDS: Field[] = [
  { key: "seo_title", label: "SEO title", type: "text", maxLength: 60,
    help: "Aim for under 60 characters so it isn't truncated in search results." },
  { key: "seo_description", label: "Meta description", type: "textarea", maxLength: 160,
    help: "Under 160 characters. This is the sentence under the link in search results." },
  { key: "canonical_url", label: "Canonical URL", type: "text",
    help: "Only if this content also lives at another address." },
  { key: "noindex", label: "Hide from search engines", type: "boolean" },
  { key: "nofollow", label: "Don't follow links on this page", type: "boolean" },
];
