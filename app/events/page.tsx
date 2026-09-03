import type { Metadata } from "next";
import { EventsPage } from "@/components/EventsPage";

export const metadata: Metadata = {
  title: "Adversado Events | Best Corporate Event Company in Kerala",
  description:
    "Adversado Events, Kochi's integrated event and film PR agency, producing corporate events, conferences, entertainment and gaming experiences across India.",
};

export default function Events() {
  return <EventsPage />;
}
