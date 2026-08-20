import type { Metadata } from "next";
import Link from "next/link";
import { SitePage } from "@/components/SitePage";

export const metadata: Metadata = {
  title: "Blog — Adversado",
  description:
    "Writing from Adversado on brand strategy, marketing and the work. Coming soon.",
};

/**
 * Placeholder. The menu carries a Blog entry because posts are planned, and a
 * menu item that 404s is worse than one that says "not yet" — so this is the
 * honest holding page until there is something to publish. Replace the body
 * with the post list when the first piece lands.
 */
export default function Blog() {
  return (
    <SitePage>
      <section className="px-6 pb-32 pt-12 sm:px-10 sm:pb-40 sm:pt-16 lg:px-16">
        <div className="mx-auto grid max-w-[1500px] gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div>
            <p className="mb-10 text-sm uppercase tracking-[0.35em] text-gold">
              Blog
            </p>
            <h1 className="max-w-[13ch] font-sans text-[clamp(2.75rem,8vw,6.5rem)] font-light leading-[0.96] tracking-[-0.04em] text-cream">
              Nothing published{" "}
              <span className="font-serif italic text-gold">yet.</span>
            </h1>
          </div>

          <p className="max-w-[44ch] self-end border-l border-gold/40 pl-6 font-serif text-[clamp(1rem,1.5vw,1.2rem)] font-light leading-[1.9] text-cream/75 sm:pl-8">
            We would rather publish nothing than publish filler. Writing on
            brand strategy, marketing and the work itself is on the way. In the
            meantime, the questions we get asked most are already answered.
          </p>
        </div>

        <div className="mx-auto mt-16 flex max-w-[1500px] flex-wrap gap-x-10 gap-y-5">
          <Link
            href="/faq"
            className="group inline-flex items-center gap-4 border-b border-gold/40 pb-2 font-sans text-sm font-medium uppercase tracking-[0.22em] text-gold transition-colors duration-300 hover:border-gold"
          >
            Read the FAQ
            <span
              aria-hidden
              className="transition-transform duration-300 ease-out group-hover:translate-x-1.5"
            >
              →
            </span>
          </Link>
          <Link
            href="/contact"
            className="group inline-flex items-center gap-4 border-b border-cream/25 pb-2 font-sans text-sm font-medium uppercase tracking-[0.22em] text-cream/70 transition-colors duration-300 hover:border-cream hover:text-cream"
          >
            Talk to us instead
            <span
              aria-hidden
              className="transition-transform duration-300 ease-out group-hover:translate-x-1.5"
            >
              →
            </span>
          </Link>
        </div>
      </section>
    </SitePage>
  );
}
