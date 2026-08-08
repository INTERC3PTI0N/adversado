"use client";

import { useEffect, useRef, useState } from "react";

const FIELDS = [
  { name: "name", label: "Name", type: "text", autoComplete: "name", placeholder: "Who are we talking to?" },
  { name: "email", label: "Email", type: "email", autoComplete: "email", placeholder: "you@company.com" },
  { name: "whatsapp", label: "WhatsApp number", type: "tel", autoComplete: "tel", placeholder: "+91" },
] as const;

/**
 * Contact popup for the closing CTA.
 *
 * Built on the native <dialog> rather than a hand-rolled overlay: it renders
 * in the top layer, so it escapes the Invitation section's `overflow-hidden`
 * without any portal, and it brings focus trapping, focus restore on close
 * and Escape-to-dismiss for free.
 *
 * This is a front-end example — submitting shows the confirmation copy from
 * the content doc and sends nothing anywhere. Wire it to a real endpoint
 * before it goes near a visitor.
 */
export function ContactDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const sentRef = useRef<HTMLParagraphElement>(null);
  const [sent, setSent] = useState(false);

  // Submitting replaces the form with the confirmation, which destroys the
  // element that had focus — without this, focus falls back to the body and a
  // keyboard or screen-reader user is left with no idea the send succeeded.
  useEffect(() => {
    if (sent) sentRef.current?.focus();
  }, [sent]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      setSent(false);
      d.showModal();
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    // Fires for Escape and for close() alike, so parent state can never drift
    // out of sync with the dialog's own open state.
    const handleClose = () => onClose();
    d.addEventListener("close", handleClose);
    return () => d.removeEventListener("close", handleClose);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="contact-dialog-title"
      className="m-auto w-[min(34rem,92vw)] bg-transparent p-0 text-cream backdrop:bg-charcoal/70"
      // A click landing on the dialog element itself is a click on the
      // backdrop — anything inside hits a child first.
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="border border-gold/30 bg-navy p-8 text-left sm:p-10">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gold">Start with an audit</p>
            <h2
              id="contact-dialog-title"
              className="mt-3 font-serif text-[clamp(1.5rem,3.4vw,2.1rem)] leading-tight text-cream"
            >
              Tell us where it hurts.
            </h2>
          </div>
          {/* A drawn glyph rather than the `×` character: the multiplication
              sign is not an icon, it inherits the text metrics, and it left a
              hit area far under the touch-target floor. */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-2 flex size-11 shrink-0 items-center justify-center text-cream/60 transition-colors hover:text-gold"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden
              focusable="false"
            >
              <path
                d="M3.5 3.5 L12.5 12.5 M12.5 3.5 L3.5 12.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {sent ? (
          <p
            ref={sentRef}
            tabIndex={-1}
            role="status"
            className="mt-8 leading-relaxed text-cream/80 focus:outline-none"
          >
            Got it. You’ll hear from us within one working day, and if anything shifts,
            you’ll hear from us sooner. That’s how we work with clients, so it’s how we
            start with them too.
          </p>
        ) : (
          <form
            className="mt-8 flex flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
          >
            {FIELDS.map((f) => (
              <label key={f.name} className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-[0.22em] text-cream/60">
                  {f.label}
                </span>
                <input
                  required
                  name={f.name}
                  type={f.type}
                  autoComplete={f.autoComplete}
                  placeholder={f.placeholder}
                  className="border border-cream/20 bg-charcoal/40 px-4 py-3 text-cream placeholder:text-cream/55 focus:border-gold"
                />
              </label>
            ))}

            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.22em] text-cream/60">
                Your query
              </span>
              <textarea
                required
                name="query"
                rows={4}
                placeholder="Be honest. We will be."
                className="resize-none border border-cream/20 bg-charcoal/40 px-4 py-3 text-cream placeholder:text-cream/55 focus:border-gold"
              />
            </label>

            <button
              type="submit"
              className="mt-2 bg-gold px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-charcoal transition-colors duration-300 hover:bg-cream"
            >
              Start the conversation
            </button>
          </form>
        )}
      </div>
    </dialog>
  );
}
