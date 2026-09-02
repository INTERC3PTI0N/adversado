"use client";

import { useRef } from "react";
import { BoxReveal } from "@/components/Cinematic";
import { CatBell } from "@/components/CatBell";
import { ContactForm } from "@/components/ContactForm";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import VariableProximity from "@/components/reactbits/VariableProximity";
import { CONTACT, MAILTO_URL, WHATSAPP_URL } from "@/lib/contact";

export function ContactPage() {
  const heroRef = useRef<HTMLDivElement>(null);

  /* No load-in reveal. The page used `useDepthReveal`, which hinged every
     block up off its baseline on a 42deg rotateX — on a form that reads as
     the page falling over rather than as arrival. Content is simply present. */
  return (
    <div>
      {/* Straight into the brief — no headline-plus-paragraph preamble ahead of
          it. The page's job is to take one, so it opens with the form. */}
      <section className="px-6 pb-20 pt-12 sm:px-10 sm:pb-24 sm:pt-16 lg:px-16">
        <div className="mx-auto grid max-w-[1500px] gap-x-16 gap-y-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="min-w-0">
            <p className="mb-10 text-sm uppercase tracking-[0.35em] text-gold">
              Contact
            </p>
            <div ref={heroRef}>
              <h1 className="max-w-[12ch] font-sans text-[clamp(2.75rem,8vw,6.5rem)] font-light leading-[0.96] tracking-[-0.04em] text-cream">
                <VariableProximity
                  label="Share a"
                  containerRef={heroRef as React.RefObject<HTMLElement>}
                  fromFontVariationSettings="'wght' 300"
                  toFontVariationSettings="'wght' 800"
                  radius={220}
                  falloff="gaussian"
                  style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
                />{" "}
                <span className="font-serif italic text-gold">
                  <VariableProximity
                    label="brief."
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

            <div className="mt-12 border-[4px] border-charcoal bg-bone p-6 shadow-[12px_12px_0_0_#e6b325] sm:p-9">
              <ContactForm />
            </div>
          </div>

          <aside className="lg:border-l lg:border-cream/12 lg:pl-16">
            {/* WhatsApp first — it is the fastest line in, and the number the
                studio actually answers. */}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 bg-gold px-6 py-3.5 font-sans text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-charcoal transition-colors duration-300 hover:bg-cream"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Message us on WhatsApp
            </a>

            <dl className="mt-14 border-t border-cream/12">
              <div className="border-b border-cream/12 py-6">
                <dt className="font-sans text-[0.68rem] uppercase tracking-[0.28em] text-cream/40">
                  Studio
                </dt>
                <dd className="mt-3 font-sans text-[clamp(1rem,1.4vw,1.2rem)] font-light leading-[1.7] text-cream">
                  {CONTACT.addressLines.map((l) => (
                    <span key={l} className="block">
                      {l}
                    </span>
                  ))}
                </dd>
              </div>
              <div className="border-b border-cream/12 py-6">
                <dt className="font-sans text-[0.68rem] uppercase tracking-[0.28em] text-cream/40">
                  Email
                </dt>
                <dd className="mt-3">
                  <a
                    href={MAILTO_URL}
                    className="font-sans text-[clamp(1rem,1.4vw,1.2rem)] font-light text-cream transition-colors duration-300 hover:text-gold"
                  >
                    {CONTACT.email}
                  </a>
                </dd>
              </div>
              <div className="border-b border-cream/12 py-6">
                <dt className="font-sans text-[0.68rem] uppercase tracking-[0.28em] text-cream/40">
                  WhatsApp
                </dt>
                <dd className="mt-3">
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-sans text-[clamp(1rem,1.4vw,1.2rem)] font-light text-cream transition-colors duration-300 hover:text-gold"
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                    {CONTACT.phoneDisplay}
                  </a>
                </dd>
              </div>
              <div className="border-b border-cream/12 py-6">
                <dt className="font-sans text-[0.68rem] uppercase tracking-[0.28em] text-cream/40">
                  Starts with
                </dt>
                <dd className="mt-3 font-serif text-[clamp(1.15rem,1.8vw,1.5rem)] font-light italic text-gold">
                  A brand audit. Every time.
                </dd>
              </div>
            </dl>

          </aside>
        </div>
      </section>

      {/* Brand audit — deliberately not the brief form again. Someone who does
          not yet know what they need cannot fill in "what you're looking for",
          which is exactly the person this section is for. One line to
          WhatsApp, nothing to complete. */}
      <section
        id="audit"
        className="scroll-mt-28 border-t border-cream/15 px-6 py-24 sm:px-10 sm:py-32 lg:px-16"
      >
        <div className="mx-auto grid max-w-[1500px] gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end">
          <div>
            <p className="mb-10 text-sm uppercase tracking-[0.35em] text-gold">
              Brand audit
            </p>
            <h2 className="max-w-[16ch] font-sans text-[clamp(2rem,5.4vw,4rem)] font-light leading-[1.02] tracking-[-0.03em] text-cream">
              Not sure how your brand is performing?
            </h2>
            <p className="mt-8 font-serif text-[clamp(1.35rem,2.8vw,2.15rem)] font-light italic leading-[1.25] tracking-[-0.02em] text-gold">
              Start with a brand audit.
            </p>
          </div>

          <div className="lg:justify-self-end">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-4 bg-gold px-8 py-5 font-sans text-[0.78rem] font-semibold uppercase tracking-[0.22em] text-charcoal transition-colors duration-300 hover:bg-cream"
            >
              <WhatsAppIcon className="h-5 w-5" />
              Message us on WhatsApp
              <span
                aria-hidden
                className="transition-transform duration-300 ease-out group-hover:translate-x-1.5"
              >
                →
              </span>
            </a>
            <p className="mt-5 max-w-[34ch] font-sans text-[0.85rem] font-light leading-[1.7] text-cream/55">
              Send a message and we&apos;ll come back to you on the same
              thread.
            </p>
          </div>
        </div>
      </section>

      {/* The bell gets its own band, clear of both the brief and the audit —
          it is play, and sitting inside either of those it read as part of the
          task someone was trying to finish. */}
      <section className="border-t border-cream/15 px-6 py-24 sm:px-10 sm:py-28 lg:px-16">
        <div className="mx-auto flex max-w-[1500px] flex-col items-center gap-8 text-center">
          <p className="font-sans text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-cream/35">
            While you&apos;re here
          </p>
          <CatBell />
        </div>
      </section>

      {/* Closing band */}
      <section className="border-t border-cream/15 px-6 py-28 sm:px-10 sm:py-36 lg:px-16">
        <div className="mx-auto max-w-4xl text-center">
          <BoxReveal>
            <p className="font-serif text-[clamp(2rem,5vw,3.75rem)] font-light italic leading-[1.15] tracking-[-0.015em] text-cream">
              You&apos;ve read this far.{" "}
              <span className="text-gold">That&apos;s usually a sign.</span>
            </p>
          </BoxReveal>
          <a
            href="#audit"
            className="group mt-14 inline-flex items-center gap-4 border-b border-gold/40 pb-2 font-sans text-sm font-medium uppercase tracking-[0.22em] text-gold transition-colors duration-300 hover:border-gold"
          >
            Start with an audit
            <span
              aria-hidden
              className="transition-transform duration-300 ease-out group-hover:translate-x-1.5"
            >
              →
            </span>
          </a>
        </div>
      </section>
    </div>
  );
}
