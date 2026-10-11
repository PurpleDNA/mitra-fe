"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ROLES } from "@/lib/signups";
import { submitSignup, type SignupState } from "./actions";

export function SignupForm({ saves }: { saves: boolean }) {
  const [state, action, pending] = useActionState<SignupState, FormData>(submitSignup, { status: "idle" });

  if (state.status === "done") {
    return state.saved ? (
      <div className="ea-done" role="status">
        <p className="tag">[ You’re on the list ]</p>
        <h2>Thanks. We’ll be in touch.</h2>
        <p>We let teams in a few at a time. When it’s your turn you’ll get an email with an access code for the app.</p>
        <Link href="/docs" className="btn btn-line">
          Read the docs meanwhile
        </Link>
      </div>
    ) : (
      <div className="ea-done" role="status">
        <p className="tag">[ Preview ]</p>
        <h2>Thanks for trying the form.</h2>
        <p>
          Sign-ups aren’t being saved yet, so nothing you entered was kept. When the list opens, this is where you’ll join it.
        </p>
        <Link href="/docs" className="btn btn-line">
          Read the docs meanwhile
        </Link>
      </div>
    );
  }

  const e = state.errors ?? {};
  const v = state.values;
  return (
    <form action={action} className="ea-form" noValidate>
      {!saves ? (
        <p className="ea-note" role="note">
          <span className="ea-sq" aria-hidden="true" />
          Preview — sign-ups aren’t saved yet.
        </p>
      ) : null}

      <div className="ea-field">
        <label htmlFor="name">Your name</label>
        <input id="name" name="name" autoComplete="name" defaultValue={v?.name} aria-invalid={e.name ? true : undefined} aria-describedby={e.name ? "name-e" : undefined} />
        {e.name ? <p id="name-e" className="ea-err">{e.name}</p> : null}
      </div>
      <div className="ea-field">
        <label htmlFor="email">Work email</label>
        <input id="email" name="email" type="email" autoComplete="email" defaultValue={v?.email} aria-invalid={e.email ? true : undefined} aria-describedby={e.email ? "email-e" : undefined} />
        {e.email ? <p id="email-e" className="ea-err">{e.email}</p> : null}
      </div>
      <div className="ea-field">
        <label htmlFor="team">
          Team or company <span className="ea-opt">optional</span>
        </label>
        <input id="team" name="team" autoComplete="organization" defaultValue={v?.team} />
      </div>
      <fieldset className="ea-field" aria-invalid={e.role ? true : undefined} aria-describedby={e.role ? "role-e" : undefined}>
        <legend>Which is closest to you?</legend>
        <div className="ea-roles">
          {ROLES.map((r) => (
            <label key={r.value} className="ea-role">
              <input type="radio" name="role" value={r.value} defaultChecked={v?.role === r.value} />
              <span>{r.label}</span>
            </label>
          ))}
        </div>
        {e.role ? <p id="role-e" className="ea-err">{e.role}</p> : null}
      </fieldset>
      <div className="ea-field">
        <label htmlFor="building">
          What are your agents buying or selling? <span className="ea-opt">optional</span>
        </label>
        <textarea id="building" name="building" rows={3} defaultValue={v?.building} />
      </div>
      <div className="ea-hp" aria-hidden="true">
        <label htmlFor="website">Leave this empty</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <button type="submit" className="btn btn-dark ea-submit" disabled={pending}>
        {pending ? "Sending…" : "Request early access"} <span aria-hidden="true">→</span>
      </button>
      <p className="ea-small">We only use this to let you into the app. No newsletter.</p>
    </form>
  );
}
