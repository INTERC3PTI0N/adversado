import type { Metadata } from "next";
import { EventsPage } from "@/components/EventsPage";

export const metadata: Metadata = {
  title: "Events — Adversado",
  description:
    "Event concept, production and brand activations from Adversado. Launches, conferences, exhibitions and market-entry experiences, built on the same strategy that builds the brand.",
};

/**
 * Events owns its whole shell — full-bleed sticky stages, its own grounds, no
 * site footer. `SitePage` would put a starfield behind it and a footer under
 * it, both of which fight the CTA section's full-viewport frame.
 */
export default function Events() {
  return <EventsPage />;
}
