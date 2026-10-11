import Link from "next/link";
import type { ReactNode } from "react";
import type { CheckResult, Onboarding, PaymentResult } from "@/lib/app/types";

export function PageHead({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="ap-head">
      <div className="ap-head-t">
        <h1>{title}</h1>
        {sub ? <p className="ap-sub">{sub}</p> : null}
      </div>
      {actions ? <div className="ap-actions">{actions}</div> : null}
    </div>
  );
}

/** What a page says when there is nothing in it yet, and the one thing to do next. */
export function Empty({
  title,
  body,
  action,
  secondary,
}: {
  title: string;
  body: ReactNode;
  action?: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <div className="ap-empty">
      <span className="ap-empty-mark" aria-hidden="true">
        <span />
      </span>
      <h2>{title}</h2>
      <p>{body}</p>
      {action || secondary ? (
        <div className="ap-actions">
          {action ? (
            <Link href={action.href} className="btn btn-dark ap-btn">
              {action.label} <span aria-hidden="true">→</span>
            </Link>
          ) : null}
          {secondary ? (
            <Link href={secondary.href} className="btn btn-line ap-btn">
              {secondary.label}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** The four steps between a new workspace and its first checked payment. */
export function Steps({ ws, state }: { ws: string; state: Onboarding }) {
  const steps = [
    {
      done: state.hasVault,
      title: "Get a vault",
      body: "The money your agents can spend lives in a vault on a test network.",
      href: `/app/${ws}/vault`,
      cta: "Set up the vault",
    },
    {
      done: state.hasAgent,
      title: "Register an agent",
      body: "Tell Mitra who your agent is and which wallet it signs with.",
      href: `/app/${ws}/developers#register`,
      cta: "Register an agent",
    },
    {
      done: state.hasLimits,
      title: "Give it limits",
      body: "A budget, a cap per payment, who it may pay. It can never change these.",
      href: `/app/${ws}/developers#limits`,
      cta: "Set its limits",
    },
    {
      done: state.hasActivity,
      title: "Connect it and let it work",
      body: "Point the agent at Mitra over MCP or the SDK. Its first payment shows up here.",
      href: `/app/${ws}/developers#connect`,
      cta: "Connect the agent",
    },
  ];
  const next = steps.findIndex((s) => !s.done);
  return (
    <ol className="ap-steps">
      {steps.map((s, i) => (
        <li key={s.title} className={s.done ? "done" : i === next ? "next" : undefined}>
          <span className="ap-step-n">{s.done ? "✓" : String(i + 1).padStart(2, "0")}</span>
          <span className="ap-step-t">{s.title}</span>
          <span className="ap-step-b">{s.body}</span>
          {s.done ? (
            <span className="tag">Done</span>
          ) : (
            <Link href={s.href} className={`btn ${i === next ? "btn-dark" : "btn-line"} ap-btn`}>
              {s.cta} <span aria-hidden="true">→</span>
            </Link>
          )}
        </li>
      ))}
    </ol>
  );
}

export function Pips({ checks }: { checks: [CheckResult, CheckResult, CheckResult] }) {
  const names = ["Budget", "Rules", "Exact match"];
  return (
    <span className="ap-pips" role="img" aria-label={checks.map((c, i) => `${names[i]} ${c.replace("-", " ")}`).join(", ")}>
      {checks.map((c, i) => (
        <span key={i} className={`ap-pip ${c}`} />
      ))}
    </span>
  );
}

const RESULT: Record<PaymentResult, { label: string; cls: string }> = {
  paid: { label: "Paid", cls: "paid" },
  stopped: { label: "Stopped", cls: "stop" },
  waiting: { label: "Waiting for you", cls: "hold" },
  "in-escrow": { label: "In escrow", cls: "esc" },
  cleared: { label: "Cleared", cls: "" },
};

export function ResultChip({ result }: { result: PaymentResult }) {
  const r = RESULT[result];
  return <span className={`ap-chip ${r.cls}`}>{r.label}</span>;
}
