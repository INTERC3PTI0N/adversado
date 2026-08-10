"use client";

import Link from "next/link";
import { BoxReveal, useDepthReveal } from "@/components/Cinematic";

const VERTICALS = [
  {
    id: "foundation",
    name: "Brand Foundation",
    tagline: "Build what you stand on.",
    second: "Because “vibes” is not a positioning.",
    body: "Before the campaigns, the content and the launches, there's a harder question: what does this brand stand for, and why should anyone care? Foundation is where we answer it. Properly, in writing, before a single deliverable is designed. It's the branding agency part of us, and the brand strategy agency part too. They were never meant to be separate.",
    services: [
      "Brand strategy & positioning",
      "Brand naming",
      "Brand identity design",
      "Visual identity systems",
      "Brand packaging",
      "Brand audit & entry assessment",
      "Brand guidelines",
    ],
  },
  {
    id: "marketing",
    name: "Brand Marketing",
    tagline: "Say it so people listen.",
    second: "Talking is not the same as being heard.",
    body: "A strong position nobody hears about is a secret, not a strategy. Marketing is where the brand finds its voice: campaigns, content and conversations that sound unmistakably like you, everywhere they show up. It's the advertising agency side of Adversado. Same voice, bigger rooms.",
    services: [
      "Advertising campaigns (ATL & BTL)",
      "Copywriting & content strategy",
      "Social media strategy & management",
      "Campaign planning & execution",
      "Media planning",
    ],
  },
  {
    id: "reach",
    name: "Brand Reach",
    tagline: "Make sure the right people find you.",
    second: "Van Gogh sold one painting in his lifetime. Don’t be Van Gogh.",
    body: "Brilliant and invisible is still invisible. Reach is the engine: performance, search, PR and digital presence working together so the brand compounds instead of just spends. It's what people mean when they search for a digital marketing agency in Kochi, in Kerala or anywhere in India. We just define the job wider.",
    services: [
      "Performance marketing",
      "SEO & digital presence",
      "PR & media relations",
      "Lead generation & digital marketing",
      "Website design & development",
      "Analytics & performance tracking",
    ],
  },
  {
    id: "experience",
    name: "Brand Experience",
    tagline: "Make people feel it.",
    second: "Nobody ever fell in love with a PDF.",
    body: "People forget campaigns. They remember moments. Experience is where the brand becomes physical: launches, events and activations designed with the same strategy that built the identity, so the brand people meet is the brand we built.",
    services: [
      "Event concept & production",
      "Brand activations & pop-ups",
      "Product & brand launches",
      "Corporate events & conferences",
      "Exhibition design & build",
      "Market entry experiences",
    ],
  },
] as const;

/**
 * Services hub — four verticals from the SEO content doc, one journey.
 * Cat system: a misplaced white dot (the O's ball) on Reach's corner.
 */
export function ServicesPage() {
  const ref = useDepthReveal<HTMLDivElement>(0.06);

  return (
    <div ref={ref}>
      <section className="px-6 pb-16 pt-8 sm:px-10 sm:pb-24 sm:pt-12 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <p data-depth className="mb-8 text-sm uppercase tracking-[0.35em] text-gold">
            Services
          </p>
          <BoxReveal>
            <h1 className="font-sans text-[clamp(2.75rem,7vw,5.5rem)] font-black leading-[1.02] tracking-[-0.03em] text-cream">
              Everything,{" "}
              <span className="text-gold">connected.</span>
            </h1>
          </BoxReveal>
          <p
            data-depth
            className="mt-8 max-w-[48ch] font-sans text-[clamp(1.1rem,1.9vw,1.4rem)] font-light leading-[1.75] text-cream/75"
          >
            Four verticals covering a brand&apos;s complete journey, from the
            first strategic decision to the experience people remember. Engage
            one vertical or all four. Every engagement starts with an audit, and
            everything we produce holds one standard. One integrated branding,
            digital marketing and advertising agency, working from Kochi with
            brands across India.
          </p>
          <nav
            data-depth
            aria-label="Verticals"
            className="mt-12 flex flex-wrap gap-x-5 gap-y-3 border-t border-cream/12 pt-8"
          >
            {VERTICALS.map((v) => (
              <a
                key={v.id}
                href={`#${v.id}`}
                className="font-sans text-xs font-medium uppercase tracking-[0.22em] text-cream/50 transition-colors hover:text-gold"
              >
                {v.name.replace("Brand ", "")}
              </a>
            ))}
          </nav>
        </div>
      </section>

      {VERTICALS.map((v, i) => (
        <section
          key={v.id}
          id={v.id}
          className="scroll-mt-28 px-6 py-20 sm:px-10 sm:py-28 lg:px-16"
        >
          <div className="relative mx-auto max-w-4xl">
            {/* Misplaced logo-dot on Reach — the cat's ball, batted out. */}
            {v.id === "reach" && (
              <span
                aria-hidden
                className="pointer-events-none absolute -right-1 top-2 h-2.5 w-2.5 rounded-full bg-cream sm:-right-3"
              />
            )}
            <p data-depth className="mb-4 font-sans text-xs font-medium uppercase tracking-[0.35em] text-gold">
              Vertical {i + 1}
            </p>
            <BoxReveal>
              <h2 className="font-sans text-[clamp(2rem,4.5vw,3.5rem)] font-black uppercase tracking-[0.06em] text-cream">
                {v.name}
              </h2>
            </BoxReveal>
            <p
              data-depth
              className="mt-5 font-serif text-[clamp(1.35rem,2.8vw,2rem)] font-light italic leading-snug text-gold"
            >
              {v.tagline}
            </p>
            <p data-depth className="mt-2 font-sans text-base text-cream/55">
              {v.second}
            </p>
            <p
              data-depth
              className="mt-8 max-w-[52ch] font-sans text-[clamp(1.1rem,1.8vw,1.35rem)] font-light leading-[1.8] text-cream/80"
            >
              {v.body}
            </p>
            <ul
              data-depth
              className="mt-10 grid gap-3 border-t border-cream/12 pt-8 sm:grid-cols-2"
            >
              {v.services.map((s) => (
                <li
                  key={s}
                  className="flex gap-3 font-sans text-sm font-light leading-snug text-cream/70"
                >
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" aria-hidden />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}

      {/* How they connect */}
      <section className="px-6 py-24 sm:px-10 sm:py-32 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <p data-depth className="mb-8 text-sm uppercase tracking-[0.35em] text-gold">
            How the verticals connect
          </p>
          <BoxReveal>
            <h2 className="max-w-[16ch] font-serif text-[clamp(2.25rem,5.5vw,4rem)] font-light leading-[1.12] tracking-[-0.01em] text-cream">
              One journey, walked{" "}
              <em className="font-bold not-italic text-gold sm:italic">
                all the way through.
              </em>
            </h2>
          </BoxReveal>
          <p
            data-depth
            className="mt-8 max-w-[48ch] font-sans text-[clamp(1.15rem,1.9vw,1.4rem)] font-light leading-[1.8] text-cream/80"
          >
            Foundation builds what the brand stands on. Marketing makes sure
            people hear it. Reach makes sure the right people find it.
            Experience makes sure they feel it.
          </p>
          <p
            data-depth
            className="mt-6 max-w-[48ch] font-sans text-[clamp(1.1rem,1.8vw,1.35rem)] font-light leading-[1.8] text-cream/65"
          >
            Start anywhere. What doesn&apos;t change is where we start (with an
            audit) and where everything ends: a standard that holds across every
            single thing we produce. One creative agency in Kochi, built for
            brands across India.
          </p>
          <Link
            href="/contact"
            data-depth
            className="mt-12 inline-block bg-gold px-8 py-4 font-sans text-sm font-medium uppercase tracking-[0.2em] text-charcoal transition-colors duration-300 hover:bg-cream"
          >
            Start with the audit
          </Link>
        </div>
      </section>
    </div>
  );
}
