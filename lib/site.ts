/**
 * Facts the page states about itself. Keep these true: the landing page must not
 * claim more than the engine has demonstrated (see ../mitra/forge/PROOF_LEDGER.md).
 */
export const site = {
  /** No early-access destination exists yet. Point this at the real form or inbox. */
  earlyAccessHref: "#early-access",
  /** Every live run so far is on test networks. Update only with new evidence. */
  networkStatus: "Running on test networks · Base · Solana · Tempo",
};
