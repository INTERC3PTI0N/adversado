"use client";

import { useEffect, useRef, useState } from "react";

const TURNING_POINTS = [
  "Launching something new",
  "Relaunching or repositioning",
  "Expanding to new markets",
  "Our brand doesn't match our business anymore",
  "Something else",
] as const;

/**
 * The site's contact form. One implementation, used by the Contact page and by
 * the home page's Invitation — the home page previously ran a second, simpler
 * form that confirmed in place and posted nowhere, so half the enquiries the
 * site collected went into the void.
 *
 * Posts to /api/contact for real, with server-side validation mirrored back
 * onto the fields. Pending and error states are rendered rather than assumed.
 *
 * Set for a light panel: callers are expected to place it on bone or cream.
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

export function ContactForm({ idPrefix }: { idPrefix?: string }) {
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
      <div ref={sentRef} tabIndex={-1} role="status" className="focus:outline-none">
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

  /* Both pages can be on screen at once in a single document only if someone
     embeds two of these, but `id` collisions break label/aria wiring the moment
     that happens — so ids are namespaced when a caller asks. */
  const uid = (n: string) => (idPrefix ? `${idPrefix}-${n}` : n);

  return (
    <form
      className="flex flex-col gap-9"
      onSubmit={async (e) => {
        e.preventDefault();
        if (pending) return;

        const data = Object.fromEntries(new FormData(e.currentTarget).entries());
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
          htmlFor={uid("turningPoint")}
          className="font-sans text-[0.68rem] font-black uppercase tracking-[0.2em] text-charcoal"
        >
          What&apos;s the turning point?
        </label>
        <select
          id={uid("turningPoint")}
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
          id={uid("more")}
          name="more"
          rows={3}
          required
          placeholder=" "
          aria-invalid={errors.more ? true : undefined}
          className={`${FIELD} resize-none ${errors.more ? "border-[#c8322a]" : ""}`}
        />
        <label htmlFor={uid("more")} className={LABEL}>
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
