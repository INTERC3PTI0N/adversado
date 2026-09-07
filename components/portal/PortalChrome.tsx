"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LINKS = [
  { href: "/portal", label: "Overview" },
  { href: "/portal/invoices", label: "Invoices" },
  { href: "/portal/files", label: "Files" },
  { href: "/portal/messages", label: "Messages" },
];

/**
 * Portal header.
 *
 * A single bar rather than the admin's sidebar: a client has four
 * destinations, and a 248px rail for four links is furniture, not navigation.
 */
export function PortalChrome({
  clientName,
  unread,
}: {
  clientName: string;
  unread: number;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/portal/login");
    router.refresh();
  }

  return (
    <header className="border-b-[3px] border-charcoal bg-navy">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-6 py-5 sm:px-8">
        <div>
          <p className="font-sans text-[0.56rem] font-black uppercase tracking-[0.28em] text-cream/40">
            Adversado
          </p>
          <p className="mt-1 font-sans text-[1.05rem] font-black uppercase leading-none tracking-[-0.01em] text-cream">
            {clientName}
          </p>
        </div>

        <button
          type="button"
          onClick={signOut}
          className="border-[3px] border-cream/30 px-4 py-2 font-sans text-[0.6rem] font-black uppercase tracking-[0.18em] text-cream/70 transition-colors duration-150 hover:border-cream hover:text-cream"
        >
          Sign out
        </button>
      </div>

      <nav className="mx-auto flex max-w-[1200px] flex-wrap gap-1 px-6 sm:px-8">
        {LINKS.map((link) => {
          const active =
            link.href === "/portal" ? pathname === "/portal" : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`border-b-[3px] px-4 py-3 font-sans text-[0.72rem] font-black uppercase tracking-[0.16em] transition-colors duration-150 ${
                active
                  ? "border-gold text-gold"
                  : "border-transparent text-cream/55 hover:text-cream"
              }`}
            >
              {link.label}
              {link.href === "/portal/messages" && unread > 0 ? (
                <span className="ml-2 inline-block border-2 border-charcoal bg-gold px-1.5 font-sans text-[0.58rem] text-charcoal">
                  {unread}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
