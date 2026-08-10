"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { StaggeredMenu } from "@/components/StaggeredMenu";

const ITEMS = [
  { label: "Home", ariaLabel: "Go to Home page", link: "/home" },
  { label: "About", ariaLabel: "Go to About page", link: "/about" },
  { label: "Services", ariaLabel: "Go to Services page", link: "/services" },
  { label: "Contact", ariaLabel: "Go to Contact page", link: "/contact" },
  { label: "Audit", ariaLabel: "Request a brand audit", link: "/contact#audit" },
];

/**
 * Site-wide nav: React Bits Staggered Menu, branded navy / gold / cream.
 * StickyLogo stays top-left; this owns the Menu toggle and panel only.
 * Hidden on the countdown splash (`/`).
 */
export function SiteNav() {
  const pathname = usePathname();

  useEffect(() => {
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [pathname]);

  if (pathname === "/") return null;

  return (
    <StaggeredMenu
      key={pathname}
      position="right"
      isFixed
      colors={["#e6b325", "#1f355e"]}
      accentColor="#e6b325"
      menuButtonColor="#f9f7f2"
      openMenuButtonColor="#1f355e"
      changeMenuColorOnOpen
      closeOnClickAway
      displaySocials={false}
      displayItemNumbering
      items={ITEMS}
      onMenuOpen={() => {
        document.documentElement.style.overflow = "hidden";
      }}
      onMenuClose={() => {
        document.documentElement.style.overflow = "";
      }}
    />
  );
}
