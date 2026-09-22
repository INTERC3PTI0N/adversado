import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SitePage } from "@/components/SitePage";
import { getProject } from "@/lib/cms/content";

// Same cadence as the gallery; publishing a project invalidates the CMS tag.
export const revalidate = 300;

type Params = { params: Promise<{ slug: string }> };

/**
 * A project's case study.
 *
 * Reached by clicking its card in the /projects gallery. Only published
 * projects resolve — a draft is a 404 here, not a preview, because this read
 * uses the anonymous client and so cannot see one.
 */

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const project = await getProject((await params).slug);
  if (!project) return { title: "Project not found — Adversado" };

  const title = project.seo_title || `${project.title}${project.client_name ? ` — ${project.client_name}` : ""}`;
  const description = project.seo_description || project.summary || undefined;

  return {
    title: `${title} — Adversado`,
    description,
    alternates: project.canonical_url ? { canonical: project.canonical_url } : undefined,
    robots: { index: !project.noindex, follow: !project.nofollow },
    openGraph: {
      title,
      description,
      images: project.coverUrl ? [project.coverUrl] : undefined,
    },
  };
}

/** Blank-line-separated paragraphs, as an editor naturally types them. */
function paragraphs(text: string | null): string[] {
  return (text ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export default async function CaseStudy({ params }: Params) {
  const project = await getProject((await params).slug);
  if (!project) notFound();

  const chapters = [
    { label: "The challenge", body: paragraphs(project.challenge) },
    { label: "The approach", body: paragraphs(project.approach) },
    { label: "The result", body: paragraphs(project.result) },
  ].filter((c) => c.body.length > 0);

  const facts = [
    ["Client", project.client_name],
    ["Discipline", project.category],
    ["Year", project.year ? String(project.year) : null],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <SitePage sky="deep">
      <article className="px-6 pb-24 pt-12 sm:px-10 sm:pt-16 lg:px-16">
        <div className="mx-auto max-w-[1500px]">
          <Link
            href="/projects"
            className="text-sm uppercase tracking-[0.35em] text-gold transition-opacity hover:opacity-70"
          >
            ← Selected works
          </Link>

          <h1 className="mt-10 max-w-[18ch] font-sans text-[clamp(2.5rem,7vw,6rem)] font-light leading-[0.98] tracking-[-0.04em] text-cream">
            {project.title}
            {project.client_name ? (
              <>
                {" "}
                <span className="font-serif italic text-gold">for {project.client_name}.</span>
              </>
            ) : null}
          </h1>

          {project.summary ? (
            <p className="mt-8 max-w-[56ch] font-sans text-[1.1rem] font-light leading-[1.75] text-cream/75">
              {project.summary}
            </p>
          ) : null}

          {facts.length ? (
            <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-4 border-t border-cream/15 pt-6">
              {facts.map(([term, value]) => (
                <div key={term}>
                  <dt className="font-sans text-[0.6rem] uppercase tracking-[0.3em] text-cream/45">
                    {term}
                  </dt>
                  <dd className="mt-1.5 font-sans text-[0.95rem] font-medium text-cream">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}

          {project.coverUrl ? (
            <figure className="mt-14 border-[4px] border-charcoal bg-bone shadow-[12px_12px_0_0_#e6b325]">
              {/* A plain img rather than next/image: a cover can be any aspect
                  ratio, and `fill` needs a container of known height. This
                  lets the image set its own. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={project.coverUrl}
                alt={`${project.title}${project.client_name ? ` for ${project.client_name}` : ""}`}
                className="block h-auto w-full"
              />
            </figure>
          ) : null}

          {chapters.length ? (
            <div className="mt-20 grid gap-14 lg:grid-cols-3 lg:gap-10">
              {chapters.map((chapter) => (
                <section key={chapter.label}>
                  <h2 className="font-sans text-[0.72rem] uppercase tracking-[0.3em] text-gold">
                    {chapter.label}
                  </h2>
                  <div className="mt-5 flex flex-col gap-4 border-l border-cream/15 pl-6">
                    {chapter.body.map((p, i) => (
                      <p
                        key={i}
                        className="font-sans text-[1rem] font-light leading-[1.8] text-cream/80"
                      >
                        {p}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : null}

          <div className="mt-24 flex flex-wrap items-center gap-6 border-t border-cream/15 pt-10">
            <Link
              href="/contact"
              className="inline-flex items-center gap-3 bg-gold px-7 py-4 font-sans text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-charcoal transition-colors duration-300 hover:bg-cream"
            >
              Start a project →
            </Link>
            <Link
              href="/projects"
              className="font-sans text-[0.8rem] uppercase tracking-[0.22em] text-cream/60 transition-colors hover:text-cream"
            >
              Back to all work
            </Link>
          </div>
        </div>
      </article>
    </SitePage>
  );
}
