import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/rbac";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { PortalLoginForm } from "@/components/portal/PortalLoginForm";

export const metadata = { title: "Sign in — Adversado" };

/* Never static. This page branches on the session; prerendering it would bake
   in whichever answer was true at build time. */
export const dynamic = "force-dynamic";

export default async function PortalLogin() {
  if (!isSupabaseConfigured()) redirect("/");

  const session = await getSession();
  if (session) {
    redirect(session.profile.role === "client" ? "/portal" : "/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bone px-6 py-16">
      <div className="w-full max-w-[26rem]">
        <p className="font-sans text-[0.62rem] font-black uppercase tracking-[0.28em] text-charcoal/45">
          Adversado
        </p>
        <h1 className="mt-3 font-sans text-[clamp(1.8rem,4vw,2.6rem)] font-black uppercase leading-[1] tracking-[-0.02em] text-charcoal">
          Client portal
        </h1>
        <p className="mt-4 font-sans text-[0.9rem] font-medium leading-[1.6] text-charcoal/60">
          Your projects, invoices and shared files.
        </p>

        <div className="mt-9 border-[4px] border-charcoal bg-cream p-7 shadow-[10px_10px_0_0_#212121]">
          <PortalLoginForm />
        </div>
      </div>
    </div>
  );
}
