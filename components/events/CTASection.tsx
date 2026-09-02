"use client";

import Link from "next/link";
import { WHATSAPP_URL } from "@/lib/contact";

/**
 * Closing pair — the two panels the gold veils used to hide, now simply on the
 * page. The reveal was doing a lot of work to withhold copy that wants reading,
 * and the photo grounds and full-bleed QUOTE/CONTACT display type went with it.
 *
 * Set in the site's neobrutalist idiom rather than the prototype's: gold
 * ground, hard 4px charcoal borders, flat offset shadows with no blur, no
 * rounded corners, lift on hover as a translate rather than a scale — matching
 * The Point, the team wall and the contact brief.
 */

type Panel = {
  kicker: string;
  heading: string;
  copy: string;
  cta: string;
  href: string;
  /** WhatsApp opens in a new tab; the quote link is internal. */
  external?: boolean;
  tilt: string;
};

const PANELS: Panel[] = [
  {
    kicker: "Your spotlight's waiting",
    heading: "Have an event in mind?",
    copy: "Tell us the shape of it and we'll come back with accurate numbers, strategic ideas, and a plan we build with you.",
    cta: "Get a custom quote",
    href: "/contact",
    tilt: "-1deg",
  },
  {
    kicker: "Let's make it happen",
    heading: "Got questions? A wild idea?",
    copy: "We'll get you started, or help you dream bigger. No concept is too far out to talk through.",
    cta: "Contact us",
    href: WHATSAPP_URL,
    external: true,
    tilt: "0.8deg",
  },
];

export function CTASection() {
  return (
    <section
      aria-label="Start a conversation"
      /* Gold ground: chrome inverts to the dark wordmark and navy menu. */
      data-nav-light
      className="relative bg-gold px-6 py-28 text-charcoal sm:px-10 sm:py-36 lg:px-16"
    >
      <div className="mx-auto max-w-[1500px]">
        <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-5">
          <span className="inline-block -rotate-2 border-[3px] border-charcoal bg-charcoal px-3 py-1.5 font-sans text-[0.7rem] font-black uppercase tracking-[0.28em] text-gold shadow-[5px_5px_0_0_#212121]">
            Start a conversation
          </span>
          <span className="inline-block rotate-1 border-[3px] border-charcoal bg-cream px-3 py-1.5 font-sans text-[0.7rem] font-black uppercase tracking-[0.24em] text-charcoal shadow-[4px_4px_0_0_#212121]">
            Two ways in
          </span>
        </div>

        <div className="mt-16 grid gap-x-10 gap-y-14 lg:grid-cols-2">
          {PANELS.map((p) => {
            const inner = (
              <>
                <span className="inline-block border-[3px] border-charcoal bg-gold px-2.5 py-1 font-sans text-[0.62rem] font-black uppercase tracking-[0.26em] text-charcoal">
                  {p.kicker}
                </span>

                <h2 className="mt-7 max-w-[14ch] font-sans text-[clamp(1.85rem,3.6vw,3rem)] font-black uppercase leading-[1] tracking-[-0.02em] text-charcoal">
                  {p.heading}
                </h2>

                <p className="mt-6 max-w-[38ch] font-sans text-[clamp(1rem,1.4vw,1.15rem)] font-bold leading-[1.6] text-charcoal/75">
                  {p.copy}
                </p>

                <span className="mt-auto inline-flex w-fit items-center gap-4 border-[4px] border-charcoal bg-gold px-7 py-4 font-sans text-[0.72rem] font-black uppercase tracking-[0.24em] text-charcoal shadow-[6px_6px_0_0_#212121] transition-[transform,box-shadow] duration-200 group-hover:-translate-x-1 group-hover:-translate-y-1 group-hover:shadow-[10px_10px_0_0_#212121] group-focus-visible:-translate-x-1 group-focus-visible:-translate-y-1 motion-reduce:transition-none">
                  {p.cta}
                  <span
                    aria-hidden
                    className="transition-transform duration-200 ease-out group-hover:translate-x-1.5"
                  >
                    →
                  </span>
                </span>
              </>
            );

            const className =
              "group flex h-full min-h-[22rem] flex-col items-start gap-0 border-[4px] border-charcoal bg-cream p-7 pb-8 shadow-[10px_10px_0_0_#212121] outline-none transition-[transform,box-shadow] duration-200 ease-out hover:-translate-x-1 hover:-translate-y-1.5 hover:shadow-[16px_16px_0_0_#212121] focus-visible:-translate-x-1 focus-visible:-translate-y-1.5 focus-visible:shadow-[16px_16px_0_0_#212121] motion-reduce:transition-none sm:p-10";

            return (
              <div key={p.heading} className="flex" style={{ rotate: p.tilt }}>
                {p.external ? (
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                  >
                    {inner}
                  </a>
                ) : (
                  <Link href={p.href} className={className}>
                    {inner}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
