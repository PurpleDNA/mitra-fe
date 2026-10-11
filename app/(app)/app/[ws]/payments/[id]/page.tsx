import Link from "next/link";
import { notFound } from "next/navigation";
import { DemoAction } from "@/components/app/DemoAction";
import { getWorkspace, money, workspaceSlugs } from "@/lib/app/workspaces";

export const dynamicParams = false;
export function generateStaticParams() {
  return workspaceSlugs().flatMap((ws) => (getWorkspace(ws)?.payments ?? []).filter((p) => p.detail).map((p) => ({ ws, id: p.id })));
}

export const metadata = { title: "Why was this stopped?" };

const Tick = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
    <path d="M2.5 7.5 5.5 10.5 11.5 3.5" fill="none" stroke="#fff" strokeWidth="2" />
  </svg>
);
const Cross = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
    <path d="M3.5 3.5 10.5 10.5M10.5 3.5 3.5 10.5" fill="none" stroke="#fff" strokeWidth="2" />
  </svg>
);

export default async function PaymentPage({ params }: { params: Promise<{ ws: string; id: string }> }) {
  const { ws, id } = await params;
  const w = getWorkspace(ws);
  const p = w?.payments.find((x) => x.id === id);
  if (!w || !p || !p.detail) notFound();
  const d = p.detail;
  const differ = d.rows.filter((r) => !r.ok).length;

  return (
    <>
      <p className="tag" style={{ margin: 0 }}>
        <Link href={`/app/${w.slug}`} style={{ color: "var(--mute)", textDecoration: "none" }}>
          Activity
        </Link>{" "}
        / <span style={{ color: "var(--ink)" }}>Payment {p.id}</span>
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <span className="ap-chip stop" style={{ alignSelf: "flex-start" }}>
          <span className="ap-dot-stop" aria-hidden="true" />
          Stopped
        </span>
        <h1 style={{ margin: 0, fontSize: "clamp(32px, 4vw, 44px)", lineHeight: 1.02, fontWeight: 600, letterSpacing: "-0.04em", textWrap: "balance" }}>
          {money(p.amount)} to an address its approval didn’t name.
        </h1>
        <p className="ap-meta" style={{ margin: 0 }}>
          {p.agentId} · {d.askedAt} · {p.chain} · stopped before anything was signed
        </p>
      </div>

      <div className="ap-panel" style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "12px 28px" }}>
        <span style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em" }}>Nothing moved.</span>
        <span style={{ fontSize: 16, color: "var(--body)" }}>
          Your vault is exactly as it was. The approval this payment tried to use is still unused.
        </span>
      </div>

      <section className="ap-sec" aria-labelledby="trail">
        <h2 id="trail" className="ap-h2">
          The three checks
        </h2>
        <div className="ap-checks">
          <div className="ap-check">
            <div className="ap-check-h">
              <span className="tag">01 · Budget</span>
              <span className="ap-badge">{p.checks[0] === "passed" ? <Tick /> : <Cross />}</span>
            </div>
            <span className="ap-check-t">Within budget? Yes.</span>
            <span className="ap-check-b">{d.budgetLine}</span>
          </div>
          <div className="ap-check">
            <div className="ap-check-h">
              <span className="tag">02 · Rules</span>
              <span className="ap-badge">
                <Tick />
              </span>
            </div>
            <span className="ap-check-t">Approved? Yes, for something else.</span>
            <span className="ap-check-b">{d.rulesLine}</span>
          </div>
          <div className="ap-check failed">
            <div className="ap-check-h">
              <span className="tag" style={{ color: "var(--stop-text)" }}>
                03 · Exact match
              </span>
              <span className="ap-badge">
                <Cross />
              </span>
            </div>
            <span className="ap-check-t">Exact match? No.</span>
            <span className="ap-check-b">
              The payment it asked to move is not the one that was approved. {differ === 1 ? "One detail" : `${differ} details`} changed.
            </span>
          </div>
        </div>
      </section>

      <section className="ap-sec" aria-labelledby="diff">
        <h2 id="diff" className="ap-h2">
          What was approved, and what it asked to move
        </h2>
        <div className="ap-tbl-wrap" style={{ border: 0 }}>
          <table className="ap-tbl" style={{ fontSize: 15 }}>
            <thead>
              <tr>
                <th>Detail</th>
                <th>Approved at {d.approvedAt}</th>
                <th>Asked at {d.askedAt}</th>
                <th>Check</th>
              </tr>
            </thead>
            <tbody>
              {d.rows.map((r) => (
                <tr key={r.field} className={r.ok ? undefined : "bad"}>
                  <td>{r.field}</td>
                  <td>{r.approved}</td>
                  <td>{r.asked}</td>
                  <td>{r.verdict}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="ap-grid2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(360px, 100%), 1fr))" }}>
        <section className="ap-sec" aria-labelledby="what">
          <h2 id="what" className="ap-h2">
            What you can do
          </h2>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: "var(--body)" }}>
            Mitra never lets a payment through that doesn’t match its approval, and there is no override. If this address is
            one you trust, add it as a payee and let the agent ask again.
          </p>
          <div className="ap-actions">
            <DemoAction dark stop demo={w.demo}>
              Pause {p.agentId}
            </DemoAction>
            <DemoAction demo={w.demo}>Revoke its limits</DemoAction>
            <DemoAction demo={w.demo}>Add payee</DemoAction>
          </div>
        </section>
        <section className="ap-sec" aria-labelledby="when">
          <h2 id="when" className="ap-h2">
            What happened
          </h2>
          <ol className="ap-tl">
            {d.timeline.map((e, i) => (
              <li key={i} className={e.kind === "done" ? undefined : e.kind} style={i === d.timeline.length - 1 ? { paddingBottom: 0 } : undefined}>
                <span className="t">{e.time}</span>
                {e.kind === "stop" ? <b>{e.text}</b> : e.text}
              </li>
            ))}
          </ol>
        </section>
      </div>

      <details style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
        <summary className="ap-h2" style={{ cursor: "pointer" }}>
          Evidence for auditors
        </summary>
        <pre className="ap-pre">{d.evidence}</pre>
      </details>
    </>
  );
}
