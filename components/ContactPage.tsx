"use client";

import { useEffect, useRef, useState } from "react";
import { BoxReveal, useDepthReveal } from "@/components/Cinematic";
import { CatBell } from "@/components/CatBell";

const TURNING_POINTS = [
  "Launching something new",
  "Relaunching or repositioning",
  "Expanding to new markets",
  "Our brand doesn't match our business anymore",
  "Something else",
] as const;

/**
 * Contact — rebuilt as an editorial spread rather than a bordered form card
 * parked next to a bordered aside.
 *
 * The page runs on hairlines and type instead of panels: every field is a rule
 * with a label that rises out of it, the rule lights gold on focus, and the
 * only filled element on the page is the submit — so the eye is pulled to the
 * one thing the page is asking for.
 *
 * Copy is unchanged from the SEO content doc; only the art direction and the
 * interaction model are new.
 */

/** Shared field chrome. The label sits inside the field and rises once the
 *  input holds a value or takes focus, so the form reads as a clean set of
 *  rules at rest and never loses its labels the way a placeholder-only form
 *  does. `peer` drives it from the input's own state — no JS per field.
 *
 *  The site-wide `:focus-visible` ring (globals.css) always matches on text
 *  inputs, which drew a boxed outline around every rule and undid the whole
 *  hairline treatment. It is replaced here — not removed — by doubling the
 *  rule to 2px in gold via box-shadow, which is a real focus indicator at the
 *  same contrast and costs no reflow the way `border-b-2` would. */
const FIELD =
  "peer w-full border-0 border-b border-cream/20 bg-transparent pb-2 pt-6 font-sans text-[0.95rem] text-cream outline-none transition-colors duration-300 placeholder:text-transparent focus:border-gold focus-visible:outline-none focus-visible:shadow-[0_1px_0_0_var(--color-gold)]";

const LABEL =
  "pointer-events-none absolute left-0 top-6 font-sans text-[0.95rem] font-light text-cream/45 transition-all duration-300 ease-out peer-focus:top-0 peer-focus:text-[0.68rem] peer-focus:font-semibold peer-focus:uppercase peer-focus:tracking-[0.22em] peer-focus:text-gold peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-[0.68rem] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-[0.22em] peer-[:not(:placeholder-shown)]:text-cream/50 motion-reduce:transition-none";

function Field({
  name,
  label,
  type = "text",
  required = false,
  autoComplete,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <div className="relative">
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        /* A space, not "", so :placeholder-shown flips only when empty. */
        placeholder=" "
        className={FIELD}
      />
      <label htmlFor={name} className={LABEL}>
        {label}
      </label>
    </div>
  );
}

function ContactForm() {
  const sentRef = useRef<HTMLDivElement>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (sent) sentRef.current?.focus();
  }, [sent]);

  if (sent) {
    return (
      <div
        ref={sentRef}
        tabIndex={-1}
        role="status"
        className="border-t border-gold/50 pt-10 focus:outline-none"
      >
        <p className="font-sans text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-gold">
          Received
        </p>
        <p className="mt-6 max-w-[42ch] font-serif text-[clamp(1.15rem,2vw,1.5rem)] font-light italic leading-[1.7] text-cream/85">
          Got it. You&apos;ll hear from us within one working day, and if
          anything shifts, you&apos;ll hear from us sooner. That&apos;s how we
          work with clients, so it&apos;s how we start with them too.
        </p>
      </div>
    );
  }

  return (
    <form
      noValidate={false}
      className="flex flex-col gap-9"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      <Field name="name" label="Who are we talking to?" required autoComplete="name" />
      <Field
        name="company"
        label="The brand on the table"
        required
        autoComplete="organization"
      />

      <div className="grid gap-9 sm:grid-cols-2">
        <Field
          name="email"
          label="Email"
          type="email"
          required
          autoComplete="email"
        />
        <Field name="phone" label="Phone" type="tel" autoComplete="tel" />
      </div>

      {/* A select never shows a placeholder, so its label is static rather than
          floating — pretending otherwise would animate a lie. */}
      <div className="relative">
        <label
          htmlFor="turningPoint"
          className="font-sans text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-cream/50"
        >
          What&apos;s the turning point?
        </label>
        <select
          id="turningPoint"
          name="turningPoint"
          required
          defaultValue=""
          className="mt-3 w-full appearance-none border-0 border-b border-cream/20 bg-transparent pb-2 font-sans text-[0.95rem] text-cream outline-none transition-colors duration-300 focus:border-gold focus-visible:outline-none focus-visible:shadow-[0_1px_0_0_var(--color-gold)]"
        >
          <option value="" disabled>
            Choose one
          </option>
          {TURNING_POINTS.map((p) => (
            <option key={p} value={p} className="bg-charcoal text-cream">
              {p}
            </option>
          ))}
        </select>
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-3 right-0 text-cream/40"
        >
          ↓
        </span>
      </div>

      <div className="relative">
        <textarea
          id="more"
          name="more"
          rows={3}
          required
          placeholder=" "
          className={`${FIELD} resize-none`}
        />
        <label htmlFor="more" className={LABEL}>
          Be honest. We will be.
        </label>
      </div>

      <button
        type="submit"
        className="group mt-2 inline-flex w-fit items-center gap-4 bg-gold px-8 py-4 font-sans text-[0.75rem] font-semibold uppercase tracking-[0.24em] text-charcoal transition-colors duration-300 hover:bg-cream"
      >
        Start the conversation
        <span
          aria-hidden
          className="transition-transform duration-300 ease-out group-hover:translate-x-1.5"
        >
          →
        </span>
      </button>
    </form>
  );
}

export function ContactPage() {
  const ref = useDepthReveal<HTMLDivElement>(0.08);

  return (
    <div ref={ref}>
      {/* Hero — headline against an open right column, so the page opens on
          composition rather than on a form. */}
      <section className="px-6 pb-20 pt-12 sm:px-10 sm:pb-24 sm:pt-16 lg:px-16">
        <div className="mx-auto grid max-w-[1500px] gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div>
            <p
              data-depth
              className="mb-10 text-sm uppercase tracking-[0.35em] text-gold"
            >
              Contact
            </p>
            <BoxReveal>
              <h1 className="max-w-[12ch] font-sans text-[clamp(2.75rem,8vw,6.5rem)] font-black uppercase leading-[0.92] tracking-[-0.04em] text-cream">
                Tell us where it{" "}
                <span className="text-gold">hurts.</span>
              </h1>
            </BoxReveal>
          </div>

          <p
            data-depth
            className="max-w-[44ch] self-end border-l border-gold/40 pl-6 font-serif text-[clamp(1rem,1.5vw,1.2rem)] font-light leading-[1.9] text-cream/75 sm:pl-8"
          >
            Every engagement starts with a conversation and an audit. No pitch
            theatre, no twelve-slide credentials deck. You talk, we listen, then
            we tell you what we see. Including the parts you may not want to
            hear.
          </p>
        </div>
      </section>

      {/* The exchange — form against the standing details */}
      <section
        id="audit"
        className="scroll-mt-28 border-t border-cream/15 px-6 py-20 sm:px-10 sm:py-24 lg:px-16"
      >
        <div className="mx-auto grid max-w-[1500px] gap-x-16 gap-y-20 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div data-depth className="min-w-0">
            <p className="mb-12 font-sans text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-cream/45">
              The brief
            </p>
            <ContactForm />
          </div>

          <aside data-depth className="lg:border-l lg:border-cream/12 lg:pl-16">
            <p className="text-sm uppercase tracking-[0.35em] text-gold">
              Prefer humans directly?
            </p>
            <p className="mt-8 max-w-[32ch] font-serif text-[clamp(1.05rem,1.6vw,1.3rem)] font-light leading-[1.85] text-cream/75">
              Start the conversation above. We reply from Kochi within one
              working day — email and WhatsApp included in the reply, not
              parked on a page for scrapers.
            </p>

            <dl className="mt-14 border-t border-cream/12">
              <div className="border-b border-cream/12 py-6">
                <dt className="font-sans text-[0.68rem] uppercase tracking-[0.28em] text-cream/40">
                  Office
                </dt>
                <dd className="mt-3 font-sans text-[clamp(1.15rem,1.8vw,1.5rem)] font-light text-cream">
                  Kochi, Kerala
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

            {/* Easter egg, parked below the real information so it can never
                come between someone and the contact details. */}
            <CatBell className="mt-24" />
          </aside>
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
            data-depth
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
