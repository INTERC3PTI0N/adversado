import type { Metadata } from "next";
import { ContactPage } from "@/components/ContactPage";
import { SitePage } from "@/components/SitePage";

export const metadata: Metadata = {
  title: "Contact — Adversado",
  description:
    "Tell us where it hurts. Every Adversado engagement starts with a conversation and a brand audit. Based in Kochi, Kerala.",
};

export default function Contact() {
  return (
    <SitePage>
      <ContactPage />
    </SitePage>
  );
}
