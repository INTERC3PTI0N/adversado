"use client";

import { useRef } from "react";
import Link from "next/link";
import { BoxReveal } from "@/components/Cinematic";
import VariableProximity from "@/components/reactbits/VariableProximity";
import {
  InteractiveAccordion,
  type AccordionItem,
} from "@/components/ui/interactive-accordion";

/**
 * FAQ — the questions doc, set on the site's own night ground.
 *
 * Same display treatment as the home and Contact headlines: light Montserrat
 * with the turn in Merriweather italic gold, hairline rules instead of panels,
 * no section painting a ground of its own. The answers are verbatim from the
 * supplied Frequently Asked Questions document — nothing added, nothing
 * rewritten.
 */

const FAQS: AccordionItem[] = [
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

export function FAQPage() {
  const heroRef = useRef<HTMLDivElement>(null);

  return (
    <div>
      {/* Hero — the home page's display treatment. */}
      <section className="px-6 pb-16 pt-12 sm:px-10 sm:pb-20 sm:pt-16 lg:px-16">
        <div className="mx-auto grid max-w-[1500px] gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div>
            <p className="mb-10 text-sm uppercase tracking-[0.35em] text-gold">
              FAQ
            </p>
            <div ref={heroRef}>
              <h1 className="max-w-[13ch] font-sans text-[clamp(2.75rem,8vw,6.5rem)] font-light leading-[0.96] tracking-[-0.04em] text-cream">
                <VariableProximity
                  label="The questions"
                  containerRef={heroRef as React.RefObject<HTMLElement>}
                  fromFontVariationSettings="'wght' 300"
                  toFontVariationSettings="'wght' 800"
                  radius={220}
                  falloff="gaussian"
                  style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
                />{" "}
                <span className="font-serif italic text-gold">
                  <VariableProximity
                    label="worth asking."
                    containerRef={heroRef as React.RefObject<HTMLElement>}
                    fromFontVariationSettings="'wght' 300"
                    toFontVariationSettings="'wght' 800"
                    radius={220}
                    falloff="gaussian"
                    style={{ fontFamily: "var(--font-merriweather), serif" }}
                  />
                </span>
              </h1>
            </div>
          </div>

          <p className="max-w-[44ch] self-end border-l border-gold/40 pl-6 font-serif text-[clamp(1rem,1.5vw,1.2rem)] font-light leading-[1.9] text-cream/75 sm:pl-8">
            Straight answers about what an agency does, what it costs you in
            time, and when you genuinely don&apos;t need one. If yours
            isn&apos;t here, ask us directly.
          </p>
        </div>
      </section>

      {/* The list */}
      <section className="border-t border-cream/15 px-6 py-16 sm:px-10 sm:py-20 lg:px-16">
        <div className="mx-auto grid max-w-[1500px] gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,0.28fr)_minmax(0,1fr)]">
          <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-cream/45 lg:sticky lg:top-28 lg:self-start">
            Eleven questions
          </p>

          <div className="min-w-0">
            <InteractiveAccordion items={FAQS} />
          </div>
        </div>
      </section>

      {/* Closing band — same shape as the Contact page's. */}
      <section className="border-t border-cream/15 px-6 py-24 sm:px-10 sm:py-32 lg:px-16">
        <div className="mx-auto max-w-4xl text-center">
          <BoxReveal>
            <p className="font-serif text-[clamp(1.75rem,4.4vw,3.25rem)] font-light italic leading-[1.15] tracking-[-0.015em] text-cream">
              Still deciding?{" "}
              <span className="text-gold">That&apos;s the right instinct.</span>
            </p>
          </BoxReveal>
          <Link
            href="/contact#audit"
            className="group mt-12 inline-flex items-center gap-4 border-b border-gold/40 pb-2 font-sans text-sm font-medium uppercase tracking-[0.22em] text-gold transition-colors duration-300 hover:border-gold"
          >
            Ask us yours
            <span
              aria-hidden
              className="transition-transform duration-300 ease-out group-hover:translate-x-1.5"
            >
              →
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
