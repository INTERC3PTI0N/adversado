import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Imperative animation effects (Preloader's Motion timeline, future r3f
  // canvases) can't survive StrictMode's dev-only double-invoke: cleanup runs
  // mid-animation and the second mount races the first over the same DOM
  // nodes/motion values. Dev-only difference — production never double-mounts.
  reactStrictMode: false,
};

export default nextConfig;
