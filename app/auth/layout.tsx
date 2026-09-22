import type { Metadata } from "next";

/**
 * First-login screens: redeem an invite, set a password.
 *
 * Shared by staff and clients, so it sits outside both the admin and portal
 * route groups — and is listed in `lib/routes` as an app area, so it gets
 * native scrolling and none of the marketing site's cursor or menu.
 */
export const metadata: Metadata = {
  title: "Set up your account — Adversado",
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bone px-6 py-16 text-charcoal">
      <div className="w-full max-w-[28rem]">
        <p className="font-sans text-[0.62rem] font-black uppercase tracking-[0.28em] text-charcoal/45">
          Adversado
        </p>
        {children}
      </div>
    </div>
  );
}
