import { acme, fresh } from "./demo";
import type { Onboarding, Workspace } from "./types";

/**
 * The app's one data seam. Today it serves the demo workspace and an empty new one.
 *
 * The engine (../mitra) has no customer accounts yet — no organisations, sign-in or
 * per-customer keys (see the app look-board notes). When it does, an engine-backed
 * workspace is added here, reading the engine's REST API, and every screen keeps working
 * because screens only ever see these types.
 */
const WORKSPACES: Workspace[] = [fresh, acme];

export const workspaceSlugs = () => WORKSPACES.map((w) => w.slug);
export const listWorkspaces = () => WORKSPACES.map((w) => ({ slug: w.slug, name: w.name, demo: w.demo }));
export const getWorkspace = (slug: string) => WORKSPACES.find((w) => w.slug === slug) ?? null;

export function onboarding(ws: Workspace): Onboarding {
  return {
    hasVault: ws.vault.length > 0,
    hasAgent: ws.agents.length > 0,
    hasLimits: ws.agents.some((a) => a.limits),
    hasActivity: ws.payments.length > 0,
  };
}

export const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function totals(ws: Workspace) {
  return ws.vault.reduce(
    (t, v) => ({ free: t.free + v.free, onHold: t.onHold + v.onHold, inEscrow: t.inEscrow + v.inEscrow }),
    { free: 0, onHold: 0, inEscrow: 0 },
  );
}
