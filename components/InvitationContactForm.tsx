"use client";

import { useEffect, useRef, useState } from "react";
import { useTilt } from "@/components/Interactions";

const FIELDS = [
  { name: "name", label: "Name", type: "text", autoComplete: "name", placeholder: "Who are we talking to?" },
  { name: "email", label: "Email", type: "email", autoComplete: "email", placeholder: "you@company.com" },
  { name: "whatsapp", label: "WhatsApp number", type: "tel", autoComplete: "tel", placeholder: "+91" },
] as const;

/**
 * Invitation CTA — the contact form as a panel that looks toward the cursor.
 * Front-end example only; submit confirms in place and sends nowhere yet.
 */
export function InvitationContactForm() {
  const tiltRef = useTilt<HTMLDivElement>(11, { follow: "window" });
  const sentRef = useRef<HTMLParagraphElement>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (sent) sentRef.current?.focus();
  }, [sent]);

  return (
    <div className="invitation-form-stage [perspective:1100px]">
      <div
        ref={tiltRef}
        className="invitation-form-panel will-change-transform"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div
          aria-hidden
          className="invitation-form-panel__sheen pointer-events-none absolute inset-0"
        />

        <div className="relative" style={{ transform: "translateZ(28px)" }}>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Start with an audit</p>
          <h3 className="mt-3 font-serif text-[clamp(1.35rem,2.6vw,1.85rem)] font-light leading-tight text-cream">
            Tell us where it hurts.
          </h3>
        </div>

        {sent ? (
          <p
            ref={sentRef}
            tabIndex={-1}
            role="status"
            className="relative mt-8 leading-relaxed text-cream/80 focus:outline-none"
            style={{ transform: "translateZ(22px)" }}
          >
            Got it. You’ll hear from us within one working day, and if anything shifts,
            you’ll hear from us sooner. That’s how we work with clients, so it’s how we
            start with them too.
          </p>
        ) : (
          <form
            className="relative mt-7 flex flex-col gap-4"
            style={{ transform: "translateZ(36px)" }}
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
          >
            {FIELDS.map((f) => (
              <label key={f.name} className="flex flex-col gap-1.5">
                <span className="text-xs uppercase tracking-[0.22em] text-cream/60">
                  {f.label}
                </span>
                <input
                  required
                  name={f.name}
                  type={f.type}
                  autoComplete={f.autoComplete}
                  placeholder={f.placeholder}
                  className="border border-cream/20 bg-charcoal/50 px-3.5 py-2.5 text-sm text-cream placeholder:text-cream/45 focus:border-gold focus:outline-none"
                />
              </label>
            ))}

            <label className="flex flex-col gap-1.5">
              <span className="text-xs uppercase tracking-[0.22em] text-cream/60">
                Your query
              </span>
              <textarea
                required
                name="query"
                rows={3}
                placeholder="Be honest. We will be."
                className="resize-none border border-cream/20 bg-charcoal/50 px-3.5 py-2.5 text-sm text-cream placeholder:text-cream/45 focus:border-gold focus:outline-none"
              />
            </label>

            <button
              type="submit"
              className="mt-1 bg-gold px-7 py-3.5 text-sm font-medium uppercase tracking-[0.2em] text-charcoal transition-colors duration-300 hover:bg-cream"
              style={{ transform: "translateZ(18px)" }}
            >
              Start the conversation
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
