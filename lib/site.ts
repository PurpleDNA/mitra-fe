/**
 * Facts the page states about itself. Keep these true: the landing page must not
 * claim more than the engine has demonstrated (see ../mitra/forge/PROOF_LEDGER.md).
 */
export const site = {
  /** The sign-up page. Its list is a stand-in until a store is connected (lib/signups.ts). */
  earlyAccessHref: "/early-access",
  /** Every live run so far is on test networks. Update only with new evidence. */
  networkStatus: "Running on test networks · Base · Solana · Tempo",
  /** Where the engine's source lives; docs link to files there. */
  engineRepoUrl: "https://github.com/cybort360/mitra",
  /**
   * The portal's pages were checked against the code and much did not hold (engine repo
   * forge/FAILURES.md F105, docs/portal/CLAIMS_CHECK.md). Until they are corrected the
   * portal says so on every page. Set to null once F105 is closed.
   */
  docsDraftNotice:
    "Draft. These pages are being checked against the code; some samples and features described here are not accurate yet." as
      | string
      | null,
};
