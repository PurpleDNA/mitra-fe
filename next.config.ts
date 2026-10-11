import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // A package-lock.json in the parent folder would otherwise be taken as the root.
  turbopack: { root: path.resolve(".") },
};

export default nextConfig;
