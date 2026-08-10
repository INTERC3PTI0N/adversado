import type { Metadata } from "next";
import { AboutPage } from "@/components/AboutPage";
import { SitePage } from "@/components/SitePage";

export const metadata: Metadata = {
  title: "About — Adversado",
  description:
    "Adversado is an integrated creative agency born in Kochi and built for brands across India. One team, one voice, one uncompromising standard.",
};

export default function About() {
  return (
    <SitePage background="peach">
      <AboutPage />
    </SitePage>
  );
}
