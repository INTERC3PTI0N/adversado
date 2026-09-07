/**
 * Public content fallbacks.
 *
 * A plain module on purpose. `components/FAQPage.tsx` carries `"use client"`,
 * and every export of a client module becomes a *client reference* when a
 * Server Component imports it — not the value. Reading `.headline` off one of
 * those proxies gives `undefined`, which is exactly how this file came to
 * exist: the FAQ page crashed at prerender on `label.split(' ')`.
 *
 * Anything shared across the server/client boundary as data, rather than as a
 * component, belongs here.
 */

export type AccordionItem = { question: string; answer: string };

export const FAQ_FALLBACK: AccordionItem[] = [
  {
    question: "Do I really need a digital marketing team, or can I handle this myself?",
    answer:
      "A business can manage digital marketing internally when its needs are relatively simple and the team has the required skills and resources. An agency can become valuable when SEO, paid advertising, and social media need to work together as part of one strategy. A good approach should focus on measurable outcomes such as leads and cost per lead, rather than impressions alone. An integrated agency can also coordinate these channels under one strategy.",
  },
  {
    question: "What can a marketing or creative agency actually do for my business?",
    answer:
      "A marketing agency can support areas such as branding, digital marketing, public relations, and event marketing. Depending on the business's goals, an agency may manage several of these functions together, helping maintain consistency across campaigns and reducing the need to coordinate multiple specialist providers.",
  },
  {
    question: "Why does my brand need a strategy before anything else?",
    answer:
      "A brand strategy establishes the foundation for how a business is positioned and communicated. It typically defines elements such as positioning, brand voice, visual identity, and the way the brand should be presented to its audience. Establishing these elements first helps ensure that future campaigns and marketing activities work toward a consistent idea rather than developing independently.",
  },
  {
    question: "What do I actually get when I hire a branding company?",
    answer:
      "A branding project typically includes core identity elements such as a logo, colour palette, typography, and brand guidelines. The exact deliverables depend on the scope of the project and the business's requirements. A typical branding project may take several weeks, with the timeline and cost determined after understanding the brand's needs and objectives.",
  },
  {
    question: "How can a creative agency make my campaigns more effective?",
    answer:
      "A creative agency can improve campaign effectiveness by bringing strategy, creative development, messaging, and paid media together. This approach helps ensure that the brand story remains consistent while campaigns are optimized for performance across platforms such as Meta and Google. Combining creative and performance considerations can also make it easier to test messaging and improve campaign results.",
  },
  {
    question: "Should I hire an advertising agency to manage my ad spend?",
    answer:
      "An advertising agency can be useful when a business needs specialist support with campaign strategy, creative, media buying, optimization, and performance measurement. Integrating advertising with the wider brand strategy can also help ensure that ad creative and messaging remain consistent with the brand's positioning. The right approach depends on the complexity of the campaigns, internal expertise, and advertising budget.",
  },
  {
    question: "Can a social media marketing agency really save me time?",
    answer:
      "Yes. Social media marketing involves more than publishing posts. It can include content planning, platform selection, publishing, audience considerations, and performance reporting. Outsourcing these activities can reduce the amount of time an internal team spends managing social media while allowing the strategy and content to remain focused on the platforms and audiences that matter most to the business.",
  },
  {
    question: "Which digital marketing services should I start with?",
    answer:
      "The right digital marketing services depend on the business objective, target audience, available budget, and stage of growth. Businesses do not necessarily need to use every channel at once. A focused approach can start with the channel most closely aligned with the primary goal and expand as performance data provides more insight into what works.",
  },
  {
    question: "Why would my business need a PR agency?",
    answer:
      "A PR agency can help businesses build relationships with journalists and media organizations and generate coverage around launches, announcements, and other significant developments. PR is particularly useful when credibility, awareness, and earned media coverage are important objectives. It can complement other marketing activities by creating attention beyond paid advertising.",
  },
  {
    question: "Does my film actually need Film PR?",
    answer:
      "Film PR focuses on generating public and media attention around a film's release. Activities can include pitching the film to critics, journalists, publications, and festival programmers to increase opportunities for coverage and visibility. The value of Film PR depends on the release strategy, target audience, distribution plans, and the level of media attention the film aims to generate.",
  },
  {
    question: "Do you handle event marketing too?",
    answer:
      "Event marketing can cover the promotion and audience-building activities surrounding an event, from generating leads and registrations to supporting corporate activations and other events. The strategy depends on the type of event, its audience, and its objectives. Event marketing can be integrated with broader digital, creative, and PR activities when multiple channels are required.",
  },
];

/** Hero copy, matching the `faq.hero` section schema. */
export type FaqHero = {
  eyebrow: string;
  headline: string;
  headlineAccent: string;
  intro: string;
  closingLine: string;
  closingAccent: string;
  ctaLabel: string;
  ctaHref: string;
};

export const FAQ_HERO_FALLBACK: FaqHero = {
  eyebrow: "FAQ",
  headline: "The questions",
  headlineAccent: "worth asking.",
  intro:
    "Straight answers about what an agency does, what it costs you in time, and when you genuinely don't need one. If yours isn't here, ask us directly.",
  closingLine: "Still deciding?",
  closingAccent: "That's the right instinct.",
  ctaLabel: "Ask us yours",
  ctaHref: "/contact#audit",
};

