import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Imperative animation effects (Preloader's Motion timeline, future r3f
  // canvases) can't survive StrictMode's dev-only double-invoke: cleanup runs
  // mid-animation and the second mount races the first over the same DOM
  // nodes/motion values. Dev-only difference — production never double-mounts.
  reactStrictMode: false,

  // adv-orb PeachWeb assets are authored with root-absolute paths (/cdn/...,
  // /scene-state/...). beforeFiles so they win over any leftover public/
  // copies of those paths from older scene dumps.
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/cdn/files.peachworlds.com/:path*",
          destination: "/adv-orb/cdn/files.peachworlds.com/:path*",
        },
        {
          source: "/cdn/files.development.peachworlds.com/:path*",
          destination: "/adv-orb/cdn/files.development.peachworlds.com/:path*",
        },
        {
          source: "/scene-state/:path*",
          destination: "/adv-orb/scene-state/:path*",
        },
        {
          source: "/draco/:path*",
          destination: "/adv-orb/draco/:path*",
        },
        {
          source: "/ui-state.json",
          destination: "/adv-orb/ui-state.json",
        },
        {
          source: "/ui-state.full.json",
          destination: "/adv-orb/ui-state.full.json",
        },
      ],
    };
  },
};

export default nextConfig;
