import Link from "next/link";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import { SetPasswordForm } from "@/components/auth/SetPasswordForm";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  expired:
    "That link has expired or has already been used. Ask the person who invited you to send a new one.",
  invalid: "That link is incomplete. Open it from the email again.",
};

/**
 * Set a password after redeeming an invite.
 *
 * Reads the auth user directly rather than through `getSession()`, which
 * treats an account that hasn't been switched on as signed out — and a newly
 * invited editor is exactly that, but still needs to set a password.
 */
export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { error } = await searchParams;

  const user = isSupabaseConfigured()
    ? (await (await getSupabase()).auth.getUser()).data.user
    : null;

  const problem = (error && ERRORS[error]) || (!user ? ERRORS.expired : null);

  return (
    <>
      <h1 className="mt-3 font-sans text-[clamp(1.8rem,4vw,2.6rem)] font-black uppercase leading-[1] tracking-[-0.02em] text-charcoal">
        {problem ? "Link expired" : "Set a password"}
      </h1>

      <div className="mt-9 border-[4px] border-charcoal bg-cream p-7 shadow-[10px_10px_0_0_#212121]">
        {problem || !user?.email ? (
          <div className="flex flex-col gap-5">
            <p className="font-sans text-[0.9rem] font-medium leading-[1.6] text-charcoal/70">
              {problem ?? ERRORS.expired}
            </p>
            <div className="flex flex-wrap gap-4 font-sans text-[0.72rem] font-black uppercase tracking-[0.16em]">
              <Link href="/admin/login" className="underline decoration-charcoal/30 underline-offset-4">
                Team sign-in
              </Link>
              <Link href="/portal/login" className="underline decoration-charcoal/30 underline-offset-4">
                Client sign-in
              </Link>
            </div>
          </div>
        ) : (
          <SetPasswordForm email={user.email} />
        )}
      </div>
    </>
  );
}
