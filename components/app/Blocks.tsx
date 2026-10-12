import Link from "next/link";
import type { ReactNode } from "react";
import type { CheckResult, PaymentResult } from "@/lib/app/types";

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
