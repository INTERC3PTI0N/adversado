"use client";

import { ContactForm } from "@/components/ContactForm";
import { WHATSAPP_URL } from "@/lib/contact";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

/**
 * 05 — Closing CTA.
 *
 * The brief calls for a form here rather than a link out, so this mounts the
 * site's own `ContactForm` — the one already wired to /api/contact and Resend
 * — rather than standing up a second form with its own endpoint to keep in
 * sync. `source` tags the enquiry so an events lead is identifiable in the
 * inbox without a separate address.
 *
 * Set in the site's neobrutalist idiom: gold ground, hard 4px charcoal borders,
 * flat offset shadows, no rounded corners.
 */
export function CTASection() {
  return (
    <section
      id="talk"
      aria-label="Let's create the experience people talk about"
      /* Gold ground: chrome inverts to the dark wordmark and navy menu. */
      data-nav-light
      className="relative z-40 scroll-mt-24 bg-gold px-6 py-28 text-charcoal sm:px-10 sm:py-36 lg:px-16"
    >
      <div className="mx-auto max-w-[1500px]">
        <span className="inline-block -rotate-2 border-[3px] border-charcoal bg-charcoal px-3 py-1.5 font-sans text-[0.7rem] font-black uppercase tracking-[0.28em] text-gold shadow-[5px_5px_0_0_#212121]">
          05 — Get in touch
        </span>

        <div className="mt-16 grid gap-x-16 gap-y-14 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div>
            <h2 className="max-w-[15ch] font-sans text-[clamp(2rem,4.6vw,3.6rem)] font-black uppercase leading-[1] tracking-[-0.02em] text-charcoal">
              Let&apos;s create the experience people talk about.
            </h2>

            <p className="mt-8 max-w-[38ch] font-sans text-[clamp(1.05rem,1.5vw,1.25rem)] font-bold leading-[1.6] text-charcoal/75">
              Kochi&apos;s corporate event management company, working
              pan-India.
            </p>

            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-12 inline-flex items-center gap-4 border-[4px] border-charcoal bg-charcoal px-7 py-4 font-sans text-[0.72rem] font-black uppercase tracking-[0.24em] text-gold shadow-[6px_6px_0_0_#212121] transition-[transform,box-shadow] duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0_0_#212121] motion-reduce:transition-none"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Or message us instead
            </a>
          </div>

          <div className="border-[4px] border-charcoal bg-bone p-6 shadow-[12px_12px_0_0_#212121] sm:p-9">
            <ContactForm idPrefix="events" source="Events page" />
          </div>
        </div>
      </div>
    </section>
  );
}
