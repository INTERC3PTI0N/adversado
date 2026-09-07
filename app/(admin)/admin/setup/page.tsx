import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata = { title: "Setup — Adversado Admin" };
export const dynamic = "force-dynamic";

/**
 * Shown when the admin is reachable but no Supabase project is linked.
 *
 * The public site runs without a backend by design, so this state is expected
 * on a fresh checkout rather than exceptional — it deserves instructions, not
 * a stack trace.
 */
export default function SetupPage() {
  if (isSupabaseConfigured()) redirect("/admin");

  const steps: { title: string; body: string; code?: string }[] = [
    {
      title: "Create a Supabase project",
      body: "supabase.com → New project. Note the project ref from the URL.",
    },
    {
      title: "Add the keys",
      body: "Copy .env.example to .env.local and fill in the three values from Project settings → API.",
      code: "cp .env.example .env.local",
    },
    {
      title: "Push the schema",
      body: "Six migrations: identity and roles, CMS, CRM and add-ons, row level security, functions and storage, then the seed.",
      code: "npx supabase link --project-ref <ref>\nnpx supabase db push",
    },
    {
      title: "Create your account",
      body: "Sign up through Supabase Auth, then in the SQL editor promote yourself. New accounts start deactivated and as editors on purpose.",
      code: "update profiles\n   set role = 'super_admin', is_active = true\n where email = 'you@adversado.com';",
    },
    {
      title: "Seed the page sections",
      body: "Sign in, open Pages & sections, and press Sync pages. That creates a row per section, filled with the copy already live on the site.",
    },
  ];

  return (
    <div className="mx-auto max-w-[52rem] px-6 py-16 sm:px-10">
      <p className="font-sans text-[0.62rem] font-black uppercase tracking-[0.28em] text-charcoal/45">
        Adversado Admin
      </p>
      <h1 className="mt-3 font-sans text-[clamp(1.9rem,4.5vw,3rem)] font-black uppercase leading-[1] tracking-[-0.02em] text-charcoal">
        Not connected yet
      </h1>
      <p className="mt-5 max-w-[56ch] font-sans text-[0.98rem] font-medium leading-[1.7] text-charcoal/70">
        The site is running on its built-in copy, which is why the public pages
        still work. Connect a Supabase project to switch the content, leads and
        delivery tooling on.
      </p>

      <ol className="mt-10 flex flex-col gap-5">
        {steps.map((step, i) => (
          <li
            key={step.title}
            className="border-[3px] border-charcoal bg-cream p-6 shadow-[6px_6px_0_0_#212121]"
          >
            <div className="flex items-baseline gap-4">
              <span className="font-sans text-[1.3rem] font-black tabular-nums text-gold">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <h2 className="font-sans text-[1rem] font-black uppercase tracking-[-0.01em] text-charcoal">
                  {step.title}
                </h2>
                <p className="mt-2 font-sans text-[0.9rem] font-medium leading-[1.65] text-charcoal/70">
                  {step.body}
                </p>
                {step.code ? (
                  <pre className="mt-4 overflow-x-auto border-2 border-charcoal/25 bg-bone p-3 font-mono text-[0.78rem] leading-relaxed text-charcoal">
                    {step.code}
                  </pre>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-10 font-sans text-[0.86rem] font-medium leading-[1.7] text-charcoal/60">
        The full specification is at <code className="font-mono">docs/BACKEND_SPEC.md</code>.
      </p>
    </div>
  );
}
