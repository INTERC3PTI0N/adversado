import type { Metadata } from "next";

/**
 * Client portal route group.
 *
 * Its own layout for the same reason the admin has one: this is working
 * software, not the marketing site. No starfield, no fluid cursor, no
 * full-screen staggered menu over someone's invoices.
 */
export const metadata: Metadata = {
  title: "Adversado — Client portal",
  robots: { index: false, follow: false },
};

export default function PortalGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-bone text-charcoal">{children}</div>;
}
