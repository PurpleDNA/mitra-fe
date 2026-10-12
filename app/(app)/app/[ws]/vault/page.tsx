import { notFound } from "next/navigation";
import { PageHead } from "@/components/app/Blocks";
import { getWorkspace, money, totals } from "@/lib/app/workspaces";
import { VaultLive } from "@/components/app/live/VaultLive";

export const metadata = { title: "Vault" };

export default async function Vault({ params }: { params: Promise<{ ws: string }> }) {
  const { ws } = await params;
  const w = getWorkspace(ws);
  if (!w) notFound();
  const sub = "The money your agents can spend. It stays here until a payment passes all three checks.";

  // A real workspace reads the vault contract for the connected wallet.
  if (!w.demo) {
    return (
      <>
        <PageHead title="Vault" sub={sub} />
        <VaultLive />
      </>
    );
  }

  const t = totals(w);
  return (
    <>
      <PageHead title="Vault" sub={sub} />
      <div className="ap-stats">
        <div className="ap-stat">
          <span className="tag">Free to spend</span>
          <span className="ap-stat-v">{money(t.free)}</span>
        </div>
        <div className="ap-stat">
          <span className="tag">On hold</span>
          <span className="ap-stat-v">{money(t.onHold)}</span>
        </div>
        <div className="ap-stat tinted">
          <span className="tag">In escrow</span>
          <span className="ap-stat-v">{money(t.inEscrow)}</span>
        </div>
      </div>
      <div className="ap-tbl-wrap">
        <table className="ap-tbl">
          <thead>
            <tr>
              <th>Chain</th>
              <th>Asset</th>
              <th className="r">Free</th>
              <th className="r">On hold</th>
              <th className="r">In escrow</th>
              <th className="r">Total</th>
            </tr>
          </thead>
          <tbody>
            {w.vault.map((v) => (
              <tr key={v.chain}>
                <td>{v.chain}</td>
                <td className="mono">{v.asset}</td>
                <td className="r">{money(v.free)}</td>
                <td className="r">{money(v.onHold)}</td>
                <td className="r">{money(v.inEscrow)}</td>
                <td className="r">
                  <b>{money(v.free + v.onHold + v.inEscrow)}</b>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="ap-sub">Deposits and withdrawals from the app arrive with accounts.</p>
    </>
  );
}
