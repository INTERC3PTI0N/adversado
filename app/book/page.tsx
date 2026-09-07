import type { Metadata } from "next";
import Link from "next/link";
import { SitePage } from "@/components/SitePage";
import { BookingForm } from "@/components/BookingForm";
import { getPublicSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import { MAILTO_URL } from "@/lib/contact";
import type { BookingService } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Book a session — Adversado",
  description:
    "Book a call with Adversado. Pick a session, pick a time, and we'll take it from there.",
};

export const revalidate = 60;

/**
 * Booking.
 *
 * Session types come from the database; if there are none, or the backend is
 * unreachable, the page says so and points at email rather than showing an
 * empty form. Same rule as every other public page — a backend problem is
 * never a blank screen.
 */
export default async function BookPage() {
  let services: BookingService[] = [];

  if (isSupabaseConfigured()) {
    try {
      const { data } = await getPublicSupabase()
        .from("booking_services")
        .select("*")
        .eq("is_active", true)
        .order("position")
        .order("name");

      services = (data ?? []) as BookingService[];
    } catch {
      services = [];
    }
  }

  return (
    <SitePage sky="deep">
      <section className="px-6 pb-24 pt-12 sm:px-10 sm:pt-16 lg:px-16">
        <div className="mx-auto max-w-[1500px]">
          <p className="mb-10 text-sm uppercase tracking-[0.35em] text-gold">
            Book a session
          </p>

          <h1 className="max-w-[16ch] font-sans text-[clamp(2.75rem,8vw,6.5rem)] font-light leading-[0.96] tracking-[-0.04em] text-cream">
            Thirty minutes.{" "}
            <span className="font-serif italic text-gold">No pitch.</span>
          </h1>

          <p className="mt-8 max-w-[52ch] font-sans text-[1.05rem] font-light leading-[1.75] text-cream/70">
            Pick a slot and tell us what you&rsquo;re wrestling with. You&rsquo;ll get a
            straight read on whether we&rsquo;re the right people for it — and if
            we&rsquo;re not, we&rsquo;ll say who is.
          </p>

          <div className="mt-14 border-[4px] border-charcoal bg-bone p-6 shadow-[12px_12px_0_0_#e6b325] sm:p-10">
            {services.length === 0 ? (
              <div className="py-8 text-center">
                <p className="font-sans text-[1.1rem] font-black uppercase tracking-[-0.01em] text-charcoal">
                  Booking isn&rsquo;t open right now
                </p>
                <p className="mx-auto mt-3 max-w-[44ch] font-sans text-[0.95rem] font-medium leading-[1.65] text-charcoal/65">
                  Email us instead and we&rsquo;ll find a time by hand — usually
                  faster anyway.
                </p>
                <a
                  href={MAILTO_URL}
                  className="mt-7 inline-flex items-center gap-3 border-[3px] border-charcoal bg-gold px-7 py-3.5 font-sans text-[0.72rem] font-black uppercase tracking-[0.22em] text-charcoal shadow-[5px_5px_0_0_#212121]"
                >
                  Email us
                </a>
              </div>
            ) : (
              <BookingForm
                services={services.map((s) => ({
                  id: s.id,
                  name: s.name,
                  description: s.description,
                  duration_minutes: s.duration_minutes,
                  price: s.price,
                  currency: s.currency,
                }))}
              />
            )}
          </div>

          <p className="mt-8 font-sans text-[0.9rem] font-light text-cream/50">
            Would rather write first?{" "}
            <Link
              href="/contact"
              className="font-medium text-gold underline decoration-gold/40 underline-offset-4 hover:decoration-gold"
            >
              Use the contact form
            </Link>
            .
          </p>
        </div>
      </section>
    </SitePage>
  );
}
