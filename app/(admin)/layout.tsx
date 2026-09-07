import type { Metadata } from "next";

/**
 * Admin route group.
 *
 * A layout of its own so the admin escapes the marketing site's chrome: no
 * StickyLogo, no StaggeredMenu, no Lenis, no starfield. Those belong to the
 * public site and would fight a dense working screen.
 */
export const metadata: Metadata = {
  title: "Adversado Admin",
  robots: { index: false, follow: false },
};

export default function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-bone text-charcoal">{children}</div>;
}
