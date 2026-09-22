import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/rbac";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata = { title: "Sign in — Adversado Admin" };

/* Never static. This page branches on the session and on whether a project is
   linked; prerendering it bakes in whichever answer was true at build time —
   which would keep redirecting to /admin/setup after Supabase is connected. */
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (!isSupabaseConfigured()) redirect("/admin/setup");

  const session = await getSession();

  // Already signed in: send staff to the admin, clients to their portal.
  if (session) {
    redirect(session.profile.role === "client" ? "/portal" : "/admin");
  }

  /* Signed in, but `getSession()` said no — so the account exists and is
     switched off. Without saying so, signing in here "works" and then lands
     straight back on this form, which reads as a broken password. */
  const {
    data: { user },
  } = await (await getSupabase()).auth.getUser();
  const waitingForActivation = Boolean(user);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bone px-6 py-16">
      <div className="w-full max-w-[26rem]">
        <p className="font-sans text-[0.62rem] font-black uppercase tracking-[0.28em] text-charcoal/45">
          Adversado
        </p>
        <h1 className="mt-3 font-sans text-[clamp(1.8rem,4vw,2.6rem)] font-black uppercase leading-[1] tracking-[-0.02em] text-charcoal">
          Admin
        </h1>
        <p className="mt-4 font-sans text-[0.9rem] font-medium leading-[1.6] text-charcoal/60">
          Sign in to manage content, leads and delivery.
        </p>

        {waitingForActivation ? (
          <div className="mt-7 border-[3px] border-charcoal bg-gold px-4 py-3 font-sans text-[0.86rem] font-bold leading-relaxed text-charcoal">
            You&rsquo;re signed in as {user?.email}, but your account hasn&rsquo;t been
            switched on yet. Ask a super admin to activate it.
          </div>
        ) : null}

        <div className="mt-9 border-[4px] border-charcoal bg-cream p-7 shadow-[10px_10px_0_0_#212121]">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
