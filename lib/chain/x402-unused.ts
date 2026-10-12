/**
 * Stands in for the optional `@x402/*` packages that `@coinbase/cdp-sdk` loads lazily
 * for its x402 payment helpers. It reaches this app through wagmi's Base Account
 * connector; the app never calls those helpers, and the packages are not installed.
 * Aliased in next.config.ts. Anything that does reach here fails loudly.
 */
const unused = (): never => {
  throw new Error("x402 helpers are not bundled in mitra-fe (lib/chain/x402-unused.ts)");
};
export const toClientEvmSigner = unused;
export default unused;
