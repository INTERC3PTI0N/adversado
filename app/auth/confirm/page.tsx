import { redeemInvite } from "../actions";

export const dynamic = "force-dynamic";

/**
 * The page an invitation link opens.
 *
 * It does not verify anything on load. Mail scanners fetch every link in an
 * email to vet it, and a GET that redeemed the token would spend it before the
 * person arrived — they'd click and be told it had expired. Verification waits
 * for the button, which a scanner never presses.
 */
export default async function ConfirmInvite({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { token_hash: tokenHash = "", type = "invite" } = await searchParams;
  const resend = type === "recovery";

  return (
    <>
      <h1 className="mt-3 font-sans text-[clamp(1.8rem,4vw,2.6rem)] font-black uppercase leading-[1] tracking-[-0.02em] text-charcoal">
        {resend ? "Welcome back" : "You're invited"}
      </h1>
      <p className="mt-4 font-sans text-[0.95rem] font-medium leading-[1.6] text-charcoal/65">
        Continue to set a password for your Adversado account. The link works
        once, so finish in this window.
      </p>

      <div className="mt-9 border-[4px] border-charcoal bg-cream p-7 shadow-[10px_10px_0_0_#212121]">
        {tokenHash ? (
          <form action={redeemInvite}>
            <input type="hidden" name="token_hash" value={tokenHash} />
            <input type="hidden" name="type" value={type} />
            <button
              type="submit"
              className="w-full border-[3px] border-charcoal bg-gold px-6 py-3.5 font-sans text-[0.72rem] font-black uppercase tracking-[0.22em] text-charcoal shadow-[4px_4px_0_0_#212121] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
            >
              Continue
            </button>
          </form>
        ) : (
          <p className="font-sans text-[0.9rem] font-medium leading-[1.6] text-charcoal/70">
            This link is incomplete. Open it from the email again, or ask the
            person who invited you to send a new one.
          </p>
        )}
      </div>
    </>
  );
}
