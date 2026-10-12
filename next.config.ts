import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // A package-lock.json in the parent folder would otherwise be taken as the root.
  turbopack: {
    root: path.resolve("."),
    // wagmi's Base Account connector pulls in @coinbase/cdp-sdk, whose x402 helpers
    // lazily import optional packages that are not installed. The app never calls them.
    resolveAlias: Object.fromEntries(
      ["@x402/core/client", "@x402/evm", "@x402/evm/exact/client", "@x402/evm/upto/client", "@x402/svm/exact/client"].map((m) => [
        m,
        "./lib/chain/x402-unused.ts",
      ]),
    ),
  },
};

export default nextConfig;
