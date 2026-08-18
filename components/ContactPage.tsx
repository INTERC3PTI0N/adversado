"use client";

import { useEffect, useRef, useState } from "react";
import { BoxReveal } from "@/components/Cinematic";
import { CatBell } from "@/components/CatBell";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import VariableProximity from "@/components/reactbits/VariableProximity";
import { CONTACT, MAILTO_URL, WHATSAPP_URL } from "@/lib/contact";

const TURNING_POINTS = [
  "Launching something new",
  "Relaunching or repositioning",
  "Expanding to new markets",
  "Our brand doesn't match our business anymore",
  "Something else",
] as const;

/**
 * Contact — editorial spread on the site's starfield, matching the home and
 * About pages: proximity-weighted display headline, hairline rules instead of
 * panels, Merriweather italic gold for the one accent.
 *
 * The form posts to /api/contact for real, with server-side validation mirrored
 * back onto the fields. Pending and error states are rendered rather than
 * assumed — the previous version flipped to a success message on submit without
 * sending anything, which is the one failure mode a contact form must not have.
 */

/* Neobrutalist field: a filled paper box with a hard charcoal border that
   pops a flat offset shadow on focus. The floating label is kept — it is what
   lets the form read as a clean stack of boxes at rest without losing its
   labels the way a placeholder-only form does. */
const FIELD =
  "peer w-full border-[3px] border-charcoal bg-cream px-4 pb-3 pt-7 font-sans text-[0.95rem] font-bold text-charcoal outline-none transition-[box-shadow,transform] duration-150 placeholder:text-transparent focus:-translate-x-0.5 focus:-translate-y-0.5 focus:shadow-[6px_6px_0_0_#212121] focus-visible:outline-none";

const LABEL =
  "pointer-events-none absolute left-4 top-5 font-sans text-[0.95rem] font-bold text-charcoal/45 transition-all duration-200 ease-out peer-focus:top-1.5 peer-focus:text-[0.62rem] peer-focus:font-black peer-focus:uppercase peer-focus:tracking-[0.2em] peer-focus:text-charcoal peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[0.62rem] peer-[:not(:placeholder-shown)]:font-black peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-[0.2em] peer-[:not(:placeholder-shown)]:text-charcoal/70 motion-reduce:transition-none";

function Field({
  name,
  label,
  type = "text",
  required = false,
  autoComplete,
  error,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  error?: string;
}) {
  return (
    <div className="relative">
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        /* A space, not "", so :placeholder-shown flips only when empty. */
        placeholder=" "
        className={`${FIELD} ${error ? "border-[#c8322a]" : ""}`}
      />
      <label htmlFor={name} className={LABEL}>
        {label}
      </label>
      {error ? (
        <p
          id={`${name}-error`}
          className="mt-2 inline-block bg-[#c8322a] px-2 py-0.5 font-sans text-[0.68rem] font-black uppercase tracking-[0.12em] text-cream"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ContactForm() {
  const sentRef = useRef<HTMLDivElement>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (sent) sentRef.current?.focus();
  }, [sent]);

  if (sent) {
    return (
      <div
        ref={sentRef}
        tabIndex={-1}
        role="status"
        className="focus:outline-none"
      >
        <span className="inline-block -rotate-1 border-[3px] border-charcoal bg-charcoal px-3 py-1.5 font-sans text-[0.68rem] font-black uppercase tracking-[0.24em] text-gold">
          Received
        </span>
        <p className="mt-6 max-w-[42ch] font-sans text-[clamp(1.05rem,1.8vw,1.35rem)] font-bold leading-[1.6] text-charcoal">
          Got it. You&apos;ll hear from us within one working day, and if
          anything shifts, you&apos;ll hear from us sooner. That&apos;s how we
          work with clients, so it&apos;s how we start with them too.
        </p>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-9"
      onSubmit={async (e) => {
        e.preventDefault();
        if (pending) return;

        const data = Object.fromEntries(
          new FormData(e.currentTarget).entries()
        );
        setPending(true);
        setErrors({});
        setFormError("");

        try {
          const res = await fetch("/api/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          const json = await res.json().catch(() => ({}));

          if (res.ok) {
            setSent(true);
            return;
          }
          if (res.status === 422 && json.errors) {
            setErrors(json.errors as Record<string, string>);
            return;
          }
          setFormError(
            json.error ?? "Something went wrong. Please try again, or email us."
          );
        } catch {
          setFormError(
            "Couldn't reach the server. Check your connection, or email us."
          );
        } finally {
          setPending(false);
        }
      }}
    >
      {/* Honeypot — off-screen for sighted users, hidden from AT. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="pointer-events-none absolute -left-[9999px] h-px w-px opacity-0"
      />

      <Field
        name="name"
        label="Who are we talking to?"
        required
        autoComplete="name"
        error={errors.name}
      />
      <Field
        name="company"
        label="The brand on the table"
        required
        autoComplete="organization"
        error={errors.company}
      />

      <div className="grid gap-9 sm:grid-cols-2">
        <Field
          name="email"
          label="Email"
          type="email"
          required
          autoComplete="email"
          error={errors.email}
        />
        <Field
          name="phone"
          label="Phone"
          type="tel"
          autoComplete="tel"
          error={errors.phone}
        />
      </div>

      {/* A select never shows a placeholder, so its label is static rather than
          floating — pretending otherwise would animate a lie. */}
      <div className="relative">
        <label
          htmlFor="turningPoint"
          className="font-sans text-[0.68rem] font-black uppercase tracking-[0.2em] text-charcoal"
        >
          What&apos;s the turning point?
        </label>
        <select
          id="turningPoint"
          name="turningPoint"
          required
          defaultValue=""
          aria-invalid={errors.turningPoint ? true : undefined}
          className={`mt-3 w-full appearance-none border-[3px] bg-cream px-4 py-3 font-sans text-[0.95rem] font-bold text-charcoal outline-none transition-[box-shadow,transform] duration-150 focus:-translate-x-0.5 focus:-translate-y-0.5 focus:shadow-[6px_6px_0_0_#212121] focus-visible:outline-none ${
            errors.turningPoint ? "border-[#c8322a]" : "border-charcoal"
          }`}
        >
          <option value="" disabled>
            Choose one
          </option>
          {TURNING_POINTS.map((p) => (
            <option key={p} value={p} className="bg-cream text-charcoal">
              {p}
            </option>
          ))}
        </select>
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-4 right-4 font-black text-charcoal"
        >
          ↓
        </span>
        {errors.turningPoint ? (
          <p className="mt-2 inline-block bg-[#c8322a] px-2 py-0.5 font-sans text-[0.68rem] font-black uppercase tracking-[0.12em] text-cream">
            {errors.turningPoint}
          </p>
        ) : null}
      </div>

      <div className="relative">
        <textarea
          id="more"
          name="more"
          rows={3}
          required
          placeholder=" "
          aria-invalid={errors.more ? true : undefined}
          className={`${FIELD} resize-none ${errors.more ? "border-[#c8322a]" : ""}`}
        />
        <label htmlFor="more" className={LABEL}>
          Be honest. We will be.
        </label>
        {errors.more ? (
          <p className="mt-2 inline-block bg-[#c8322a] px-2 py-0.5 font-sans text-[0.68rem] font-black uppercase tracking-[0.12em] text-cream">
            {errors.more}
          </p>
        ) : null}
      </div>

      {formError ? (
        <p
          role="alert"
          className="border-[3px] border-charcoal bg-[#c8322a] px-4 py-3 font-sans text-[0.85rem] font-bold leading-relaxed text-cream"
        >
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="group mt-2 inline-flex w-fit items-center gap-4 border-[4px] border-charcoal bg-gold px-8 py-4 font-sans text-[0.75rem] font-black uppercase tracking-[0.22em] text-charcoal shadow-[7px_7px_0_0_#212121] transition-[transform,box-shadow] duration-150 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[11px_11px_0_0_#212121] disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[7px_7px_0_0_#212121]"
      >
        {pending ? "Sending…" : "Start the conversation"}
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
  const heroRef = useRef<HTMLDivElement>(null);

  /* No load-in reveal. The page used `useDepthReveal`, which hinged every
     block up off its baseline on a 42deg rotateX — on a form that reads as
     the page falling over rather than as arrival. Content is simply present. */
  return (
    <div>
      {/* Hero — same display treatment as the home and About headlines. */}
      <section className="px-6 pb-20 pt-12 sm:px-10 sm:pb-24 sm:pt-16 lg:px-16">
        <div className="mx-auto grid max-w-[1500px] gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div>
            <p
              className="mb-10 text-sm uppercase tracking-[0.35em] text-gold"
            >
              Contact
            </p>
            <div ref={heroRef}>
              <h1 className="max-w-[12ch] font-sans text-[clamp(2.75rem,8vw,6.5rem)] font-light leading-[0.96] tracking-[-0.04em] text-cream">
                <VariableProximity
                  label="Tell us where it"
                  containerRef={heroRef as React.RefObject<HTMLElement>}
                  fromFontVariationSettings="'wght' 300"
                  toFontVariationSettings="'wght' 800"
                  radius={220}
                  falloff="gaussian"
                  style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
                />{" "}
                <span className="font-serif italic text-gold">
                  <VariableProximity
                    label="hurts."
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

          <p
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
          <div className="min-w-0">
            <span className="inline-block -rotate-2 border-[3px] border-charcoal bg-gold px-3 py-1.5 font-sans text-[0.7rem] font-black uppercase tracking-[0.24em] text-charcoal shadow-[5px_5px_0_0_#212121]">
              The brief
            </span>
            <div className="mt-10 border-[4px] border-charcoal bg-bone p-6 shadow-[12px_12px_0_0_#e6b325] sm:p-9">
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
