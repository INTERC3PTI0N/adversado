import type { Metadata } from "next";
import { ProjectsPage } from "@/components/ProjectsPage";
import { getProjectCards } from "@/lib/cms/content";
import { PROJECTS_FALLBACK } from "@/lib/cms/fallbacks";

export const metadata: Metadata = {
  title: "Projects — Adversado",
  description:
    "Selected work from Adversado — brand identity, packaging, advertising, web and events for brands in Kochi and across India.",
};

// CMS-driven; ISR keeps it fast while publishing a project invalidates the tag.
export const revalidate = 300;

export default async function Projects() {
  const cards = await getProjectCards();

  // No published project with a cover means the CMS has nothing to show yet —
  // not that the gallery should be empty. Fall back to the pre-CMS set.
  return <ProjectsPage items={cards.length ? cards : PROJECTS_FALLBACK} />;
}
