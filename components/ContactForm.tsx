"use client";

import { useEffect, useRef, useState } from "react";

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
  id,
  name,
  label,
  type = "text",
  required = false,
  autoComplete,
  error,
}: {
  id: string;
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
        id={id}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        /* A space, not "", so :placeholder-shown flips only when empty. */
        placeholder=" "
        className={`${FIELD} ${error ? "border-[#c8322a]" : ""}`}
      />
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      {error ? (
        <p
          id={`${id}-error`}
          className="mt-2 inline-block bg-[#c8322a] px-2 py-0.5 font-sans text-[0.68rem] font-black uppercase tracking-[0.12em] text-cream"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function ContactForm({
  idPrefix,
  /** Which page the enquiry came from, carried through to the email subject.
   *  Without it an events lead and a contact-page lead are indistinguishable. */
  source,
}: {
  idPrefix?: string;
  source?: string;
}) {
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
      {source ? <input type="hidden" name="source" value={source} /> : null}

      {/* Honeypot — off-screen for sighted users, hidden from AT. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="pointer-events-none absolute -left-[9999px] h-px w-px opacity-0"
      />

      <Field id={uid("name")} name="name" label="Name" required autoComplete="name" error={errors.name} />
      <Field
        id={uid("brand")}
        name="brand"
        label="Brand"
        required
        autoComplete="organization"
        error={errors.brand}
      />
      <Field
        id={uid("email")}
        name="email"
        label="Email"
        type="email"
        required
        autoComplete="email"
        error={errors.email}
      />

      <div className="relative">
        <textarea
          id={uid("looking")}
          name="looking"
          rows={3}
          required
          placeholder=" "
          aria-invalid={errors.looking ? true : undefined}
          className={`${FIELD} resize-none ${errors.looking ? "border-[#c8322a]" : ""}`}
        />
        <label htmlFor={uid("looking")} className={LABEL}>
          What you&apos;re looking for
        </label>
        {errors.looking ? (
          <p className="mt-2 inline-block bg-[#c8322a] px-2 py-0.5 font-sans text-[0.68rem] font-black uppercase tracking-[0.12em] text-cream">
            {errors.looking}
          </p>
        ) : null}
      </div>

      <Field id={uid("budget")} name="budget" label="Budget" error={errors.budget} />

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
        {pending ? "Sending…" : "Submit"}
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
