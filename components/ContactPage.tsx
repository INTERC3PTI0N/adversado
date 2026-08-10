"use client";

import { useEffect, useRef, useState } from "react";
import { BoxReveal, useDepthReveal } from "@/components/Cinematic";

const TURNING_POINTS = [
  "Launching something new",
  "Relaunching or repositioning",
  "Expanding to new markets",
  "Our brand doesn't match our business anymore",
  "Something else",
] as const;

/**
 * Contact page form — fields from the SEO content doc. Front-end only;
 * submit confirms in place. No invented email/phone: Kochi is confirmed;
 * direct lines go through the conversation.
 */
function ContactForm() {
  const sentRef = useRef<HTMLParagraphElement>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (sent) sentRef.current?.focus();
  }, [sent]);

  if (sent) {
    return (
      <p
        ref={sentRef}
        tabIndex={-1}
        role="status"
        className="border border-gold/40 bg-[#120f17]/90 px-6 py-10 font-sans text-[clamp(1.05rem,1.7vw,1.25rem)] font-light leading-relaxed text-cream/85 focus:outline-none sm:px-8"
      >
        Got it. You&apos;ll hear from us within one working day, and if anything
        shifts, you&apos;ll hear from us sooner. That&apos;s how we work with
        clients, so it&apos;s how we start with them too.
      </p>
    );
  }

  return (
    <form
      className="relative border border-gold/50 bg-[#120f17]/90 px-6 py-8 sm:px-8 sm:py-10"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      {/* Paw prints walking toward the human-contact column */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-2 bottom-8 hidden gap-5 opacity-35 lg:flex"
      >
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="block h-2.5 w-2.5 rotate-12 rounded-[40%_60%_50%_50%] bg-gold/70"
            style={{ transform: `translateY(${(i % 2) * 6}px) rotate(${12 + i * 8}deg)` }}
          />
        ))}
      </div>

      <div className="flex flex-col gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs uppercase tracking-[0.22em] text-cream/60">Name</span>
          <input
            required
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Who are we talking to?"
            className="border border-cream/20 bg-charcoal/50 px-3.5 py-2.5 text-sm text-cream placeholder:text-cream/45 focus:border-gold focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs uppercase tracking-[0.22em] text-cream/60">Company</span>
          <input
            required
            name="company"
            type="text"
            autoComplete="organization"
            placeholder="The brand on the table"
            className="border border-cream/20 bg-charcoal/50 px-3.5 py-2.5 text-sm text-cream placeholder:text-cream/45 focus:border-gold focus:outline-none"
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-[0.22em] text-cream/60">Email</span>
            <input
              required
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              className="border border-cream/20 bg-charcoal/50 px-3.5 py-2.5 text-sm text-cream placeholder:text-cream/45 focus:border-gold focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-[0.22em] text-cream/60">Phone</span>
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+91"
              className="border border-cream/20 bg-charcoal/50 px-3.5 py-2.5 text-sm text-cream placeholder:text-cream/45 focus:border-gold focus:outline-none"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs uppercase tracking-[0.22em] text-cream/60">
            What&apos;s the turning point?
          </span>
          <select
            required
            name="turningPoint"
            defaultValue=""
            className="border border-cream/20 bg-charcoal/50 px-3.5 py-2.5 text-sm text-cream focus:border-gold focus:outline-none"
          >
            <option value="" disabled>
              Choose one
            </option>
            {TURNING_POINTS.map((p) => (
              <option key={p} value={p} className="bg-navy text-cream">
                {p}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs uppercase tracking-[0.22em] text-cream/60">Tell us more</span>
          <textarea
            required
            name="more"
            rows={4}
            placeholder="Be honest. We will be."
            className="resize-none border border-cream/20 bg-charcoal/50 px-3.5 py-2.5 text-sm text-cream placeholder:text-cream/45 focus:border-gold focus:outline-none"
          />
        </label>

        <button
          type="submit"
          className="mt-2 bg-gold px-7 py-3.5 text-sm font-medium uppercase tracking-[0.2em] text-charcoal transition-colors duration-300 hover:bg-cream"
        >
          Start the conversation
        </button>
      </div>
    </form>
  );
}

export function ContactPage() {
  const ref = useDepthReveal<HTMLDivElement>(0.08);

  return (
    <div ref={ref}>
      <section className="px-6 pb-12 pt-8 sm:px-10 sm:pb-16 sm:pt-12 lg:px-16">
        <div className="mx-auto max-w-[1500px]">
          <p data-depth className="mb-8 text-sm uppercase tracking-[0.35em] text-gold">
            Contact
          </p>
          <BoxReveal>
            <h1 className="max-w-[14ch] font-sans text-[clamp(2.75rem,7vw,5.5rem)] font-black leading-[1.02] tracking-[-0.03em] text-cream">
              Tell us where it{" "}
              <span className="text-gold">hurts.</span>
            </h1>
          </BoxReveal>
          <p
            data-depth
            className="mt-8 max-w-[44ch] font-sans text-[clamp(1.1rem,1.9vw,1.4rem)] font-light leading-[1.75] text-cream/75"
          >
            Every engagement starts with a conversation and an audit. No pitch
            theatre, no twelve-slide credentials deck. You talk, we listen, then
            we tell you what we see. Including the parts you may not want to
            hear.
          </p>
        </div>
      </section>

      <section id="audit" className="scroll-mt-28 px-6 py-12 sm:px-10 sm:py-16 lg:px-16">
        <div className="mx-auto grid max-w-[1500px] gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16 xl:gap-20">
          <div data-depth>
            <ContactForm />
          </div>

          <aside data-depth className="flex flex-col justify-center lg:pl-4">
            <p className="text-sm uppercase tracking-[0.35em] text-gold">
              Prefer humans directly?
            </p>
            <p className="mt-6 max-w-[32ch] font-sans text-[clamp(1.1rem,1.8vw,1.35rem)] font-light leading-[1.75] text-cream/75">
              Start the conversation above. We reply from Kochi within one
              working day — email and WhatsApp included in the reply, not
              parked on a page for scrapers.
            </p>
            <dl className="mt-10 space-y-6 border-t border-cream/12 pt-8">
              <div>
                <dt className="font-sans text-xs uppercase tracking-[0.28em] text-cream/45">
                  Office
                </dt>
                <dd className="mt-2 font-sans text-base text-cream/80">
                  Kochi, Kerala
                </dd>
              </div>
              <div>
                <dt className="font-sans text-xs uppercase tracking-[0.28em] text-cream/45">
                  Starts with
                </dt>
                <dd className="mt-2 font-sans text-base text-cream/80">
                  A brand audit. Every time.
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      {/* Closing band */}
      <section className="px-6 py-24 sm:px-10 sm:py-32 lg:px-16">
        <div className="mx-auto max-w-4xl text-center">
          <BoxReveal>
            <p className="font-serif text-[clamp(2rem,5vw,3.75rem)] font-light italic leading-[1.15] tracking-[-0.015em] text-cream">
              You&apos;ve read this far.{" "}
              <span className="text-gold not-italic font-semibold sm:italic">
                That&apos;s usually a sign.
              </span>
            </p>
          </BoxReveal>
          <a
            href="#audit"
            data-depth
            className="mt-12 inline-block bg-gold px-8 py-4 font-sans text-sm font-medium uppercase tracking-[0.2em] text-charcoal transition-colors duration-300 hover:bg-cream"
          >
            Start with an audit
          </a>
        </div>
      </section>
    </div>
  );
}
