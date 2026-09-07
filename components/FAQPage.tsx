"use client";

import { useRef } from "react";
import Link from "next/link";
import { BoxReveal } from "@/components/Cinematic";
import VariableProximity from "@/components/reactbits/VariableProximity";
import { InteractiveAccordion } from "@/components/ui/interactive-accordion";
import {
  FAQ_FALLBACK,
  FAQ_HERO_FALLBACK,
  type AccordionItem,
  type FaqHero,
} from "@/lib/cms/fallbacks";

/**
 * FAQ — the questions doc, set on the site's own night ground.
 *
 * Same display treatment as the home and Contact headlines: light Montserrat
 * with the turn in Merriweather italic gold, hairline rules instead of panels,
 * no section painting a ground of its own. The answers are verbatim from the
 * supplied Frequently Asked Questions document — nothing added, nothing
 * rewritten.
 *
 * Content is CMS-driven with these arrays as the fallback. If the database is
 * empty, unreachable, or the rows are unpublished, the page renders exactly
 * what it did before the CMS existed — a backend problem must never blank a
 * public page.
 */

export function FAQPage({
  hero = FAQ_HERO_FALLBACK,
  faqs = FAQ_FALLBACK,
}: {
  hero?: FaqHero;
  faqs?: AccordionItem[];
} = {}) {
  const heroRef = useRef<HTMLDivElement>(null);
  const items = faqs.length > 0 ? faqs : FAQ_FALLBACK;

  return (
    <div>
      {/* Hero — the home page's display treatment. */}
      <section className="px-6 pb-16 pt-12 sm:px-10 sm:pb-20 sm:pt-16 lg:px-16">
        <div className="mx-auto grid max-w-[1500px] gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div>
            <p className="mb-10 text-sm uppercase tracking-[0.35em] text-gold">
              {hero.eyebrow}
            </p>
            <div ref={heroRef}>
              <h1 className="max-w-[13ch] font-sans text-[clamp(2.75rem,8vw,6.5rem)] font-light leading-[0.96] tracking-[-0.04em] text-cream">
                <VariableProximity
                  label={hero.headline}
                  containerRef={heroRef as React.RefObject<HTMLElement>}
                  fromFontVariationSettings="'wght' 300"
                  toFontVariationSettings="'wght' 800"
                  radius={220}
                  falloff="gaussian"
                  style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
                />{" "}
                <span className="font-serif italic text-gold">
                  <VariableProximity
                    label={hero.headlineAccent}
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
            {hero.intro}
          </p>
        </div>
      </section>

      {/* The list — centred in the page, with the side label gone. Without a
          column beside it the accordion has no reason to sit off-axis. */}
      <section className="border-t border-cream/15 px-6 py-16 sm:px-10 sm:py-20 lg:px-16">
        <div className="mx-auto w-full max-w-[1000px]">
          <InteractiveAccordion items={items} />
        </div>
      </section>

      {/* Closing band — same shape as the Contact page's. */}
      <section className="border-t border-cream/15 px-6 py-24 sm:px-10 sm:py-32 lg:px-16">
        <div className="mx-auto max-w-4xl text-center">
          <BoxReveal>
            <p className="font-serif text-[clamp(1.75rem,4.4vw,3.25rem)] font-light italic leading-[1.15] tracking-[-0.015em] text-cream">
              {hero.closingLine}{" "}
              <span className="text-gold">{hero.closingAccent}</span>
            </p>
          </BoxReveal>
          <Link
            href={hero.ctaHref}
            className="group mt-12 inline-flex items-center gap-4 border-b border-gold/40 pb-2 font-sans text-sm font-medium uppercase tracking-[0.22em] text-gold transition-colors duration-300 hover:border-gold"
          >
            {hero.ctaLabel}
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
