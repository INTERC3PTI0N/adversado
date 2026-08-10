import Link from "next/link";

/**
 * Sitewide footer from the content doc. The Brand Behind The Brands line is
 * the identity; the vertical list is the service map in one breath.
 */
export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-cream/10 px-6 py-16 sm:px-10 sm:py-20 lg:px-16">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-serif text-[clamp(1.15rem,2.2vw,1.6rem)] font-light italic tracking-[0.06em] text-cream">
            The Brand Behind The Brands.
          </p>
          <p className="mt-3 max-w-[36ch] font-sans text-sm font-light leading-relaxed text-cream/55">
            Strategy to execution, end to end.
          </p>
          <p className="mt-6 font-sans text-xs font-medium uppercase tracking-[0.28em] text-cream/40">
            Branding / Advertising / Marketing / Events / Performance
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3 font-sans text-xs font-medium uppercase tracking-[0.22em]">
          <Link href="/about" className="text-cream/50 transition-colors hover:text-gold">
            About
          </Link>
          <Link href="/services" className="text-cream/50 transition-colors hover:text-gold">
            Services
          </Link>
          <Link href="/contact" className="text-cream/50 transition-colors hover:text-gold">
            Contact
          </Link>
          <Link href="/home" className="text-cream/50 transition-colors hover:text-gold">
            Home
          </Link>
        </div>
      </div>
    </footer>
  );
}
