import Link from "next/link";
import { MAILTO_URL } from "@/lib/contact";

export const metadata = { title: "Portal — Adversado" };
export const dynamic = "force-dynamic";

/**
 * Shown when someone signs in but the portal isn't theirs to see: no client
 * linked to the account, or the client's portal is switched off.
 *
 * Deliberately says the same thing for both. Which of the two it is isn't the
 * signed-in person's business to learn from a page.
 */
export default function NoAccess() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bone px-6 py-16">
      <div className="w-full max-w-[32rem] border-[4px] border-charcoal bg-cream p-8 shadow-[10px_10px_0_0_#212121] sm:p-10">
        <p className="font-sans text-[0.62rem] font-black uppercase tracking-[0.28em] text-charcoal/45">
          Adversado
        </p>
        <h1 className="mt-3 font-sans text-[clamp(1.5rem,4vw,2.2rem)] font-black uppercase leading-[1.05] tracking-[-0.02em] text-charcoal">
          Not switched on yet
        </h1>
        <p className="mt-5 font-sans text-[0.95rem] font-medium leading-[1.65] text-charcoal/65">
          Your account is signed in, but there&rsquo;s no portal attached to it yet.
          Your contact at Adversado can turn it on — drop them a line and it&rsquo;ll
          be here next time.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={MAILTO_URL}
            className="border-[3px] border-charcoal bg-gold px-6 py-3 font-sans text-[0.66rem] font-black uppercase tracking-[0.2em] text-charcoal shadow-[4px_4px_0_0_#212121]"
          >
            Email us
          </a>
          <Link
            href="/"
            className="border-[3px] border-charcoal bg-cream px-6 py-3 font-sans text-[0.66rem] font-black uppercase tracking-[0.2em] text-charcoal shadow-[4px_4px_0_0_#212121]"
          >
            Back to the site
          </Link>
        </div>
      </div>
    </div>
  );
}
