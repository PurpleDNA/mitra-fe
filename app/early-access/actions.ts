"use server";

import { ROLES, signupStore } from "@/lib/signups";

export interface SignupState {
  status: "idle" | "error" | "done";
  saved?: boolean;
  errors?: Partial<Record<"name" | "email" | "role", string>>;
  values?: { name: string; email: string; team: string; role: string; building: string };
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function submitSignup(_prev: SignupState, form: FormData): Promise<SignupState> {
  const v = {
    name: String(form.get("name") ?? "").trim().slice(0, 120),
    email: String(form.get("email") ?? "").trim().slice(0, 200),
    team: String(form.get("team") ?? "").trim().slice(0, 120),
    role: String(form.get("role") ?? ""),
    building: String(form.get("building") ?? "").trim().slice(0, 1000),
  };

  // A field people never see. Bots fill it; a person never does. Treat it as done, keep nothing.
  if (String(form.get("website") ?? "") !== "") return { status: "done", saved: false };

  const errors: SignupState["errors"] = {};
  if (!v.name) errors.name = "Tell us your name.";
  if (!EMAIL.test(v.email)) errors.email = "That doesn’t look like an email address.";
  if (!ROLES.some((r) => r.value === v.role)) errors.role = "Pick the one closest to you.";
  if (Object.keys(errors).length > 0) return { status: "error", errors, values: v };

  const store = signupStore();
  await store.save({ ...v, at: new Date().toISOString() });
  return { status: "done", saved: store.saves };
}
