/**
 * Where early-access sign-ups go.
 *
 * No store is connected yet, by decision: the list is a stand-in for now. The stand-in
 * keeps nothing and says so — the form shows a preview note, and the confirmation tells
 * the visitor their details were not saved. It must never report a sign-up as saved.
 *
 * To make the list real, implement `SignupStore` against a database (a Supabase table or
 * Vercel Blob were the options considered) and return it from `signupStore()`.
 */
export interface Signup {
  name: string;
  email: string;
  team: string;
  role: string;
  building: string;
  at: string;
}

export interface SignupStore {
  /** True only when the sign-up is durably stored. */
  readonly saves: boolean;
  save(s: Signup): Promise<void>;
}

const standIn: SignupStore = {
  saves: false,
  async save() {
    // Deliberately nothing. See the note at the top of this file.
  },
};

export function signupStore(): SignupStore {
  return standIn;
}

export const ROLES = [
  { value: "agents", label: "I build AI agents" },
  { value: "treasury", label: "I manage money or risk for agents" },
  { value: "integrator", label: "I run a marketplace or protocol" },
  { value: "other", label: "Something else" },
] as const;
