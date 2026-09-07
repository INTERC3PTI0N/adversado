/**
 * Section schema registry.
 *
 * The contract between the admin editor and the page components. Each entry
 * declares the fields a section owns; the editor renders a form from it, and
 * the renderer reads typed values out of `page_sections.data`.
 *
 * Adding a field is a one-line change here plus a default in the component —
 * no migration, because the data lives in jsonb.
 *
 * `defaults` matter as much as the fields: they are the copy currently
 * hardcoded in each component. If a section has no row, or its row is
 * unpublished, the site renders these. That is what stops a deleted row from
 * blanking a page.
 */

export type FieldType =
  | "text"
  | "textarea"
  | "richtext"
  | "image"
  | "link"
  | "boolean"
  | "number"
  | "select"
  | "list";

export type Field = {
  key: string;
  label: string;
  type: FieldType;
  help?: string;
  required?: boolean;
  maxLength?: number;
  options?: { value: string; label: string }[];
  /** For `list`: the shape of one item. */
  itemFields?: Field[];
};

export type SectionSchema = {
  kind: string;
  label: string;
  description: string;
  fields: Field[];
  defaults: Record<string, unknown>;
};

const text = (key: string, label: string, extra: Partial<Field> = {}): Field => ({
  key,
  label,
  type: "text",
  ...extra,
});
const area = (key: string, label: string, extra: Partial<Field> = {}): Field => ({
  key,
  label,
  type: "textarea",
  ...extra,
});

/* ── Home ────────────────────────────────────────────────────────────────── */

const homeHero: SectionSchema = {
  kind: "home.hero",
  label: "Hero",
  description: "The opening headline and the typed question beneath it.",
  fields: [
    text("headline", "Headline", { required: true, maxLength: 80 }),
    text("subheading", "Typed word", {
      required: true,
      maxLength: 24,
      help: "Types out one character at a time. Short works best.",
    }),
    text("scrollHint", "Scroll cue", { maxLength: 40 }),
  ],
  defaults: {
    headline: "So do most brands.",
    subheading: "Why?",
    scrollHint: "Keep scrolling",
  },
};

const homeBelief: SectionSchema = {
  kind: "home.belief",
  label: "Belief",
  description: "The line the hero flies into.",
  fields: [area("closingLine", "Closing line", { required: true, maxLength: 220 })],
  defaults: {
    closingLine:
      "Same rigour on a logo as on a launch. If that sounds expensive, wait until you price inconsistency.",
  },
};

const homeVerticals: SectionSchema = {
  kind: "home.verticals",
  label: "Four verticals",
  description: "The pack of cards. Each card links to its services section.",
  fields: [
    text("eyebrow", "Eyebrow"),
    text("headline", "Headline"),
    text("headlineAccent", "Headline accent", {
      help: "Set in gold italic after the headline.",
    }),
    text("ctaLabel", "CTA label"),
    text("ctaHref", "CTA link"),
  ],
  defaults: {
    eyebrow: "The Verticals",
    headline: "Four verticals.",
    headlineAccent: "One journey.",
    ctaLabel: "Explore the full journey",
    ctaHref: "/services",
  },
};

const homeSixDs: SectionSchema = {
  kind: "home.six_ds",
  label: "The Six Ds",
  description: "The process list. Hovering one step dims the rest.",
  fields: [
    text("eyebrow", "Eyebrow"),
    text("headline", "Headline"),
    {
      key: "steps",
      label: "Steps",
      type: "list",
      itemFields: [text("d", "Name"), area("line", "Line")],
    },
  ],
  defaults: {
    eyebrow: "How we work",
    headline: "The Six Ds",
    steps: [
      { d: "Discover", line: "We learn the business before we touch the brand." },
      { d: "Debate", line: "The insight gets argued before it gets approved. Conviction, not consensus." },
      { d: "Define", line: "One position that makes every future decision easier." },
      { d: "Design", line: "Identity, communication and experience as one connected system." },
      { d: "Deliver", line: "Consistency measured as strictly as quality." },
      { d: "Develop", line: "Measure, refine, repeat. A brand is a living thing." },
    ],
  },
};

const homeInvitation: SectionSchema = {
  kind: "home.invitation",
  label: "Invitation",
  description: "Closing section with the brief form.",
  fields: [
    text("eyebrow", "Eyebrow"),
    text("headline", "Headline"),
    text("headlineAccent", "Headline accent"),
    area("body", "Body"),
    area("closing", "Closing line"),
    text("formBadge", "Form badge"),
  ],
  defaults: {
    eyebrow: "The Invitation",
    headline: "We're not for everyone.",
    headlineAccent: "That's deliberate.",
    body: "We work with ambitious brands ready to make bold moves.",
    closing: "If you're looking for a partner, not another agency, we'd love to meet.",
    formBadge: "Start with an audit",
  },
};

/* ── About ───────────────────────────────────────────────────────────────── */

const aboutHero: SectionSchema = {
  kind: "about.hero",
  label: "Hero",
  description: "Page opening.",
  fields: [
    text("eyebrow", "Eyebrow"),
    text("headline", "Headline"),
    text("headlineAccent", "Headline accent"),
  ],
  defaults: { eyebrow: "About", headline: "The brand behind", headlineAccent: "the brands." },
};

const aboutObservation: SectionSchema = {
  kind: "about.observation",
  label: "Observation",
  description: "The centred display line. Gold spans are marked with **double asterisks**.",
  fields: [
    area("line", "Line", {
      required: true,
      help: "Wrap a phrase in **asterisks** to set it in gold.",
    }),
  ],
  defaults: {
    line: "Adversado began with a simple **observation:** too many businesses were spending on marketing while their brands slowly lost **direction.**",
  },
};

const aboutTeam: SectionSchema = {
  kind: "about.team",
  label: "Team wall",
  description: "Headings around the portrait grid. Members come from Team management.",
  fields: [
    text("badgeLeft", "Left badge"),
    text("badgeRight", "Right badge"),
    text("headline", "Headline"),
    text("headlineAccent", "Headline accent"),
    area("intro", "Intro paragraph"),
    area("hiringLine", "Hiring line"),
    text("ctaLabel", "CTA label"),
    text("ctaHref", "CTA link"),
  ],
  defaults: {
    badgeLeft: "Team behind your brand",
    badgeRight: "Curious. Hungry. Talented.",
    headline: "The people behind the brands,",
    headlineAccent: "behind the brands",
    intro: "Small by design. Senior by default. Everyone at this table has shipped real work in the real world.",
    hiringLine: "Want to be on this page? We hire people who flinch at the word “synergy.”",
    ctaLabel: "Start a conversation",
    ctaHref: "/contact",
  },
};

const aboutPoint: SectionSchema = {
  kind: "about.point",
  label: "The point of it all",
  description: "Beliefs pinned to the wall. Six notes.",
  fields: [
    text("badgeLeft", "Left badge"),
    text("badgeRight", "Right badge"),
    text("headline", "Headline"),
    text("headlineAccent", "Headline accent"),
    text("hint", "Hint line"),
    {
      key: "beliefs",
      label: "Beliefs",
      type: "list",
      itemFields: [text("n", "Number"), text("title", "Title"), area("line", "Line")],
    },
  ],
  defaults: {
    badgeLeft: "What we believe",
    badgeRight: "Six, non-negotiable",
    headline: "The",
    headlineAccent: "point",
    hint: "Pick one up ↓",
    beliefs: [
      { n: "01", title: "Strategy is not a phase.", line: "It comes before everything, or it isn't strategy." },
      { n: "02", title: "Work that doesn't perform isn't creative.", line: "It's decoration. Expensive decoration, usually." },
      { n: "03", title: "A brand is not a logo.", line: "It's every touchpoint, connected and considered." },
      { n: "04", title: "Consistency is competitive advantage.", line: "Brands are remembered through repetition, not reinvention." },
      { n: "05", title: "Honest conversations win.", line: "Transparency, constructive disagreement, mutual respect." },
      { n: "06", title: "Premium is a standard, not a price.", line: "A logo gets the same rigour as a national campaign." },
    ],
  },
};

/* ── Services ────────────────────────────────────────────────────────────── */

const servicesHero: SectionSchema = {
  kind: "services.hero",
  label: "Hero",
  description: "Page opening. The four verticals come from Services management.",
  fields: [
    text("eyebrow", "Eyebrow"),
    text("headline", "Headline"),
    text("headlineAccent", "Headline accent"),
    area("intro", "Intro paragraph"),
    area("intro2", "Second paragraph"),
  ],
  defaults: {
    eyebrow: "Services",
    headline: "Everything,",
    headlineAccent: "connected.",
    intro: "Four verticals covering a brand's complete journey, from the first strategic decision to the experience people remember. Engage one vertical or all four.",
    intro2: "Every engagement starts with an audit, and everything we produce holds one standard. One integrated branding, digital marketing and advertising agency, working from Kochi with brands across India.",
  },
};

/* ── Contact ─────────────────────────────────────────────────────────────── */

const contactBrief: SectionSchema = {
  kind: "contact.brief",
  label: "Brief",
  description: "The form section at the top of the contact page.",
  fields: [
    text("eyebrow", "Eyebrow"),
    text("headline", "Headline"),
    text("headlineAccent", "Headline accent"),
  ],
  defaults: { eyebrow: "Contact", headline: "Share a", headlineAccent: "brief." },
};

const contactAudit: SectionSchema = {
  kind: "contact.audit",
  label: "Brand audit",
  description: "The no-form section that routes to WhatsApp.",
  fields: [
    text("eyebrow", "Eyebrow"),
    text("headline", "Headline"),
    text("subhead", "Sub-headline"),
    text("ctaLabel", "CTA label"),
    area("note", "Note under the CTA"),
  ],
  defaults: {
    eyebrow: "Brand audit",
    headline: "Not sure how your brand is performing?",
    subhead: "Start with a brand audit.",
    ctaLabel: "Message us on WhatsApp",
    note: "Send a message and we'll come back to you on the same thread.",
  },
};

const contactClosing: SectionSchema = {
  kind: "contact.closing",
  label: "Closing band",
  description: "The last line on the contact page.",
  fields: [
    text("line", "Line"),
    text("lineAccent", "Line accent"),
    text("ctaLabel", "CTA label"),
    text("ctaHref", "CTA link"),
  ],
  defaults: {
    line: "You've read this far.",
    lineAccent: "That's usually a sign.",
    ctaLabel: "Start with an audit",
    ctaHref: "#audit",
  },
};

/* ── Events ──────────────────────────────────────────────────────────────── */

const eventsHero: SectionSchema = {
  kind: "events.hero",
  label: "Hero",
  description: "Events landing opening.",
  fields: [
    text("eyebrow", "Eyebrow"),
    text("headline", "Headline"),
    text("headlineAccent", "Headline accent"),
    area("sub", "Sub-line"),
    text("ctaLabel", "CTA label"),
  ],
  defaults: {
    eyebrow: "Corporate Events · Conferences · Entertainment · Gaming · Brand Events",
    headline: "The room empties.",
    headlineAccent: "The event shouldn't.",
    sub: "Corporate events, conferences, concerts and launches, built in Kochi to run across India.",
    ctaLabel: "Talk to us",
  },
};

const eventsAbout: SectionSchema = {
  kind: "events.about",
  label: "01 — About us",
  description: "The draughtsman's grid section.",
  fields: [
    text("index", "Index label"),
    text("corner", "Corner label"),
    text("headline", "Headline"),
    area("body", "Body"),
  ],
  defaults: {
    index: "01 — About us",
    corner: "[KOCHI] STUDIO",
    headline: "The advantage is integration.",
    body: "We design and build events under one roof, so nothing gets lost between suppliers, because there are none. The crew, the workshop, the cameras and the press desk sit in one building in Kochi, which is how we ended up called the best event company in Kerala.",
  },
};

const eventsWhy: SectionSchema = {
  kind: "events.why",
  label: "02 — Why Adversado Events",
  description: "Bone spread with the three pillars.",
  fields: [
    text("index", "Index label"),
    text("headline", "Headline"),
    text("headlineAccent", "Headline accent"),
    area("body", "Body"),
    {
      key: "pillars",
      label: "Pillars",
      type: "list",
      itemFields: [text("n", "Number"), text("label", "Label"), area("line", "Line")],
    },
  ],
  defaults: {
    index: "02 — Why Adversado Events",
    headline: "Built on experience,",
    headlineAccent: "structured for scale.",
    body: "Our crew has run corporate floors, conferences, concerts and gaming arenas for fifteen years, and we still build the stages ourselves. Fabrication, film and PR are in-house, which makes us one of the few event production companies in Kerala that owns the whole job.",
    pillars: [
      { n: "01", label: "Fabrication", line: "We build the stages ourselves, in our own workshop." },
      { n: "02", label: "Film", line: "Cameras, livestream and post sit on the same floor." },
      { n: "03", label: "PR", line: "The press desk runs from the room, not from an agency brief." },
    ],
  },
};

const eventsProcess: SectionSchema = {
  kind: "events.process",
  label: "04 — Process",
  description: "The five steps on the sticky stage.",
  fields: [
    text("index", "Index label"),
    text("headline", "Headline"),
    {
      key: "steps",
      label: "Steps",
      type: "list",
      itemFields: [
        text("value", "Number"),
        text("left", "Label"),
        area("right", "Line"),
        { key: "image", label: "Image", type: "image" },
      ],
    },
  ],
  defaults: {
    index: "04 — Process",
    headline: "From vision to buzz.",
    steps: [
      { value: "01", left: "DEFINE", right: "We start with what the event actually has to achieve." },
      { value: "02", left: "DESIGN", right: "Then the room and the guest journey are drawn around it." },
      { value: "03", left: "BUILD", right: "It goes into our own workshop, not out to a supplier." },
      { value: "04", left: "RUN", right: "We run the show on the day, floor to backstage." },
      { value: "05", left: "AMPLIFY", right: "Then we film it, place it and get it seen." },
    ],
  },
};

const eventsClosing: SectionSchema = {
  kind: "events.closing",
  label: "05 — Get in touch",
  description: "Closing CTA with the Events brief form.",
  fields: [
    text("badge", "Badge"),
    text("headline", "Headline"),
    area("sub", "Sub-line"),
    text("whatsappLabel", "WhatsApp label"),
  ],
  defaults: {
    badge: "05 — Get in touch",
    headline: "Let's create the experience people talk about.",
    sub: "Kochi's corporate event management company, working pan-India.",
    whatsappLabel: "Or message us instead",
  },
};

/* ── FAQ / Blog ──────────────────────────────────────────────────────────── */

const faqHero: SectionSchema = {
  kind: "faq.hero",
  label: "Hero",
  description: "FAQ opening. Questions come from FAQ management.",
  fields: [
    text("eyebrow", "Eyebrow"),
    text("headline", "Headline"),
    text("headlineAccent", "Headline accent"),
    area("intro", "Intro"),
    text("closingLine", "Closing line"),
    text("closingAccent", "Closing accent"),
    text("ctaLabel", "CTA label"),
    text("ctaHref", "CTA link"),
  ],
  defaults: {
    eyebrow: "FAQ",
    headline: "The questions",
    headlineAccent: "worth asking.",
    intro: "Straight answers about what an agency does, what it costs you in time, and when you genuinely don't need one. If yours isn't here, ask us directly.",
    closingLine: "Still deciding?",
    closingAccent: "That's the right instinct.",
    ctaLabel: "Ask us yours",
    ctaHref: "/contact#audit",
  },
};

const blogHero: SectionSchema = {
  kind: "blog.hero",
  label: "Hero",
  description: "Blog index opening. Posts come from Blog management.",
  fields: [
    text("eyebrow", "Eyebrow"),
    text("headline", "Headline"),
    text("headlineAccent", "Headline accent"),
    area("intro", "Intro"),
    area("emptyState", "Empty state", {
      help: "Shown when nothing is published yet.",
    }),
  ],
  defaults: {
    eyebrow: "Blog",
    headline: "Nothing published",
    headlineAccent: "yet.",
    intro: "We would rather publish nothing than publish filler. Writing on brand strategy, marketing and the work itself is on the way.",
    emptyState: "In the meantime, the questions we get asked most are already answered.",
  },
};

/* ── Site-wide ───────────────────────────────────────────────────────────── */

const siteFooter: SectionSchema = {
  kind: "site.footer",
  label: "Footer",
  description: "Shown on every page.",
  fields: [
    text("tagline", "Tagline"),
    text("subline", "Sub-line"),
    text("verticals", "Verticals list", { help: "Separated by / characters." }),
    text("eventsCtaLabel", "Events CTA label"),
    text("closingNote", "Closing note"),
  ],
  defaults: {
    tagline: "The Brand Behind The Brands.",
    subline: "Strategy to execution, end to end.",
    verticals: "Branding / Advertising / Marketing / Events / Performance",
    eventsCtaLabel: "Adversado Events",
    closingNote: "Kochi, Kerala — working with brands across India.",
  },
};

/* ── Registry ────────────────────────────────────────────────────────────── */

export const SECTION_SCHEMAS: SectionSchema[] = [
  homeHero, homeBelief, homeVerticals, homeSixDs, homeInvitation,
  aboutHero, aboutObservation, aboutTeam, aboutPoint,
  servicesHero,
  contactBrief, contactAudit, contactClosing,
  eventsHero, eventsAbout, eventsWhy, eventsProcess, eventsClosing,
  faqHero, blogHero,
  siteFooter,
];

export const SCHEMA_BY_KIND: Record<string, SectionSchema> = Object.fromEntries(
  SECTION_SCHEMAS.map((s) => [s.kind, s]),
);

/** The pages the CMS manages, and the sections each one owns, in order. */
export const PAGE_MAP: { slug: string; title: string; sections: { key: string; kind: string }[] }[] = [
  {
    slug: "/",
    title: "Home",
    sections: [
      { key: "hero", kind: "home.hero" },
      { key: "belief", kind: "home.belief" },
      { key: "verticals", kind: "home.verticals" },
      { key: "six_ds", kind: "home.six_ds" },
      { key: "invitation", kind: "home.invitation" },
    ],
  },
  {
    slug: "/about",
    title: "About",
    sections: [
      { key: "hero", kind: "about.hero" },
      { key: "observation", kind: "about.observation" },
      { key: "point", kind: "about.point" },
      { key: "team", kind: "about.team" },
    ],
  },
  { slug: "/services", title: "Services", sections: [{ key: "hero", kind: "services.hero" }] },
  {
    slug: "/contact",
    title: "Contact",
    sections: [
      { key: "brief", kind: "contact.brief" },
      { key: "audit", kind: "contact.audit" },
      { key: "closing", kind: "contact.closing" },
    ],
  },
  {
    slug: "/events",
    title: "Events",
    sections: [
      { key: "hero", kind: "events.hero" },
      { key: "about", kind: "events.about" },
      { key: "why", kind: "events.why" },
      { key: "process", kind: "events.process" },
      { key: "closing", kind: "events.closing" },
    ],
  },
  { slug: "/faq", title: "FAQ", sections: [{ key: "hero", kind: "faq.hero" }] },
  { slug: "/blog", title: "Blog", sections: [{ key: "hero", kind: "blog.hero" }] },
  { slug: "/projects", title: "Projects", sections: [] },
  { slug: "_site", title: "Site-wide", sections: [{ key: "footer", kind: "site.footer" }] },
];

/** Defaults for a section, used when the database has nothing published. */
export function defaultsFor(kind: string): Record<string, unknown> {
  return SCHEMA_BY_KIND[kind]?.defaults ?? {};
}
