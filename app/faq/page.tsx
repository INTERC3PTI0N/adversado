import type { Metadata } from "next";
import { FAQPage } from "@/components/FAQPage";
import { SitePage } from "@/components/SitePage";

export const metadata: Metadata = {
  title: "FAQ — Adversado",
  description:
    "Straight answers on branding, digital marketing, advertising, PR and event marketing — what an integrated agency does, and when you don't need one.",
};

export default function FAQ() {
  return (
    <SitePage>
      <FAQPage />
    </SitePage>
  );
}
