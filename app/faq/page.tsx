import type { Metadata } from "next";
import { FAQPage } from "@/components/FAQPage";
import { FAQ_FALLBACK, FAQ_HERO_FALLBACK, type FaqHero } from "@/lib/cms/fallbacks";
import { SitePage } from "@/components/SitePage";
import { getFaqs, getSection } from "@/lib/cms/content";

export const metadata: Metadata = {
  title: "FAQ — Adversado",
  description:
    "Straight answers on branding, digital marketing, advertising, PR and event marketing — what an integrated agency does, and when you don't need one.",
};

// Content is CMS-driven; ISR keeps it fast while a publish invalidates the tag.
export const revalidate = 300;

export default async function FAQ() {
  const [hero, faqs] = await Promise.all([
    getSection<FaqHero>("/faq", "hero", FAQ_HERO_FALLBACK),
    getFaqs(),
  ]);

  // An empty table means the CMS has nothing to say, not that the page should
  // be empty — fall back to the copy that shipped with the component.
  const items = faqs.length
    ? faqs.map((f) => ({ question: f.question, answer: f.answer }))
    : FAQ_FALLBACK;

  return (
    <SitePage>
      <FAQPage hero={hero} faqs={items} />
    </SitePage>
  );
}
