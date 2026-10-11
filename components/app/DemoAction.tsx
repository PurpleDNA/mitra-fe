"use client";

import { useState, type ReactNode } from "react";

/**
 * A button for an action the app will perform once it talks to the engine: approve,
 * pause, accept, revoke. In a demo workspace it says plainly that nothing happened,
 * rather than pretending — the same rule as the engine's dev adapters.
 */
export function DemoAction({
  children,
  dark = false,
  stop = false,
  demo,
}: {
  children: ReactNode;
  dark?: boolean;
  stop?: boolean;
  demo: boolean;
}) {
  const [said, setSaid] = useState(false);
  return (
    <span className="ap-act">
      <button type="button" className={`btn ${dark ? "btn-dark" : "btn-line"} ap-btn`} onClick={() => setSaid(true)}>
        {stop ? <span className="ap-dot-stop" aria-hidden="true" /> : null}
        {children}
      </button>
      {said ? (
        <span className="ap-said" role="status">
          {demo ? "Demo workspace: nothing happened." : "Not connected to the engine yet."}
        </span>
      ) : null}
    </span>
  );
}
