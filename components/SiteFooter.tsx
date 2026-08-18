import Link from "next/link";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { CONTACT, MAILTO_URL, WHATSAPP_URL } from "@/lib/contact";

const NAV = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Projects", href: "/projects" },
  { label: "Contact", href: "/contact" },
] as const;

const VERTICALS = [
  "Branding",
  "Advertising",
  "Marketing",
  "Events",
  "Performance",
] as const;

/**
 * Sitewide footer.
 *
 * Four columns on desktop — identity, sitemap, the studio's real address, and
 * the two lines people actually use — collapsing to a single stack on a phone.
 * Address and number come from `lib/contact` so the footer and the contact
 * page can never drift out of sync.
 */
export function SiteFooter() {
  return (
    <footer
      data-nav-navy
      className="relative z-10 border-t border-cream/10 bg-navy px-6 py-16 sm:px-10 sm:py-20 lg:px-16"
    >
      <div className="mx-auto max-w-[1500px]">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.7fr)_minmax(0,1fr)_minmax(0,1fr)]">
          {/* Identity */}
          <div>
            <p className="font-serif text-[clamp(1.15rem,2.2vw,1.6rem)] font-light italic tracking-[0.06em] text-cream">
              The Brand Behind The Brands.
            </p>
            <p className="mt-3 max-w-[36ch] font-sans text-sm font-light leading-relaxed text-cream/55">
              Strategy to execution, end to end.
            </p>
            <p className="mt-6 font-sans text-[0.7rem] font-medium uppercase tracking-[0.24em] text-cream/40">
              {VERTICALS.join(" / ")}
            </p>
          </div>

          {/* Sitemap */}
          <nav aria-label="Footer">
            <p className="font-sans text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-cream/35">
              Site
            </p>
            <ul className="mt-5 flex flex-col gap-2.5">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    className="font-sans text-sm font-light text-cream/60 transition-colors duration-300 hover:text-gold"
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Address */}
          <div>
            <p className="font-sans text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-cream/35">
              Studio
            </p>
            <address className="mt-5 not-italic font-sans text-sm font-light leading-[1.85] text-cream/60">
              {CONTACT.addressLines.map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
            </address>
          </div>

          {/* The two lines people actually use */}
          <div>
            <p className="font-sans text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-cream/35">
              Get in touch
            </p>
            <ul className="mt-5 flex flex-col gap-3">
              <li>
                <a
                  href={MAILTO_URL}
                  className="font-sans text-sm font-light text-cream/60 transition-colors duration-300 hover:text-gold"
                >
                  {CONTACT.email}
                </a>
              </li>
              <li>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 font-sans text-sm font-light text-cream/60 transition-colors duration-300 hover:text-gold"
                >
                  <WhatsAppIcon className="h-4 w-4 shrink-0" />
                  {CONTACT.phoneDisplay}
                </a>
              </li>
            </ul>
            <p className="mt-3 max-w-[28ch] font-sans text-[0.72rem] font-light leading-relaxed text-cream/35">
              WhatsApp is the fastest way to reach us directly.
            </p>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-cream/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-sans text-[0.72rem] font-light text-cream/35">
            © {new Date().getFullYear()} Adversado. All rights reserved.
          </p>
          <p className="font-sans text-[0.72rem] font-light text-cream/35">
            Kochi, Kerala — working with brands across India.
          </p>
        </div>
      </div>
    </footer>
  );
}
