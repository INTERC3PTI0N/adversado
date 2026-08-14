import type { Metadata } from "next";
import { ServicesPage } from "@/components/ServicesPage";
import { SitePage } from "@/components/SitePage";

export const metadata: Metadata = {
  title: "Services — Adversado",
  description:
    "One integrated branding, digital marketing and advertising agency in Kochi. Brand Foundation, Marketing, Reach and Experience — engage one vertical or all four.",
};

export default function Services() {
  return (
    <SitePage>
      <ServicesPage />
    </SitePage>
  );
}
