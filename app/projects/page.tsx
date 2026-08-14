import type { Metadata } from "next";
import { ProjectsPage } from "@/components/ProjectsPage";

export const metadata: Metadata = {
  title: "Projects — Adversado",
  description:
    "Selected work from Adversado — brand identity, packaging, advertising, web and events for brands in Kochi and across India.",
};

export default function Projects() {
  return <ProjectsPage />;
}
