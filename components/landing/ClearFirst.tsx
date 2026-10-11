import { InView } from "@/components/InView";
import "./clear.css";

function Party({ x, y, name, role, dark = false }: { x: number; y: number; name: string; role: string; dark?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={200} height={96} className={dark ? "cf-party-dark" : "cf-party"} />
      <text x={x + 100} y={y + 46} className={dark ? "cf-name cf-name-dark" : "cf-name"} textAnchor="middle">{name}</text>
      <text x={x + 100} y={y + 64} className={dark ? "cf-role cf-role-dark" : "cf-role"} textAnchor="middle">{role}</text>
    </g>
  );
}

function Diagram() {
  return (
    <svg
      className="cf-svg"
      viewBox="60 280 760 400"
      role="img"
      aria-label="Without Mitra, four payments move $250: you pay Northwind $100, Northwind pays you $70, you pay Atlas $40 and Atlas pays you $40. With Mitra, the debts are cleared first and one payment of $30 goes from you to Northwind."
    >
      <defs>
        <marker id="cf-head" viewBox="0 0 4 4" refX="2" refY="2" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0 0 L4 2 L0 4 Z" fill="#0b0b0c" />
        </marker>
        <marker id="cf-head-acc" viewBox="0 0 4 4" refX="2" refY="2" markerWidth="3.5" markerHeight="3.5" orient="auto">
          <path d="M0 0 L4 2 L0 4 Z" className="cf-head-acc" />
        </marker>
      </defs>

      <g className="cf-ghost">
        <line className="cf-arrow" x1={280} y1={332} x2={595} y2={332} markerEnd="url(#cf-head)" />
        <line className="cf-arrow" x1={600} y1={364} x2={285} y2={364} markerEnd="url(#cf-head)" />
        <line className="cf-arrow" x1={147} y1={396} x2={147} y2={555} markerEnd="url(#cf-head)" />
        <line className="cf-arrow" x1={213} y1={560} x2={213} y2={401} markerEnd="url(#cf-head)" />
      </g>
      <line className="cf-res" x1={280} y1={348} x2={588} y2={348} markerEnd="url(#cf-head-acc)" />

      <Party x={80} y={300} name="You" role="YOUR AGENT" dark />
      <Party x={600} y={300} name="Northwind" role="DESIGN STUDIO" />
      <Party x={80} y={560} name="Atlas" role="DATA PROVIDER" />

      <g className="cf-a">
        <text x={440} y={318} className="cf-amt" textAnchor="middle">$100</text>
        <text x={440} y={389} className="cf-amt" textAnchor="middle">$70</text>
        <text x={119} y={482} className="cf-amt" textAnchor="middle">$40</text>
        <text x={245} y={482} className="cf-amt" textAnchor="middle">$40</text>
      </g>
      <g className="cf-b">
        <rect x={404} y={300} width={72} height={22} className="cf-tagbox" />
        <text x={440} y={316} className="cf-amt cf-amt-b" textAnchor="middle">$30</text>
        <text x={440} y={389} className="cf-eq" textAnchor="middle">100 − 70 = 30</text>
        <text x={225} y={474} className="cf-eq">40 − 40 = 0</text>
        <text x={225} y={490} className="cf-eq">CANCELS OUT</text>
      </g>

      <g className="cf-dot">
        <circle r={10} className="cf-dot-ring" />
        <circle r={7} className="cf-dot-c" />
      </g>
    </svg>
  );
}

export function ClearFirst() {
  return (
    <InView className="cf" id="clear" aria-labelledby="clear-title">
      <div className="cf-copy">
        <div className="cf-copy-top">
          <div className="tag cf-row">
            <span>[ Netting ≠ Settlement ]</span>
            <span className="cf-rule" aria-hidden="true" />
            <span className="cf-count">04 / 05</span>
          </div>
          <h2 id="clear-title" className="cf-title">Clear first. Move only what remains.</h2>
          <p className="cf-p">
            When people owe each other, Mitra adds it all up first. What cancels out never moves, so there are fewer
            payments, fewer fees, and less that can go wrong.
          </p>
        </div>
        <p className="tag cf-sum">
          You owe Northwind $100
          <br />
          Northwind owes you $70
          <br />
          You and Atlas owe each other $40
          <br />→ Only $30 moves
        </p>
      </div>

      <div className="cf-panel dots">
        <p className="tag cf-cap">FIG_04 — The same debts, twice</p>

        <div className="cf-card" aria-live="off">
          <div className="cf-lay cf-a">
            <span className="tag cf-k">Without Mitra</span>
            <div className="cf-nums">
              <span className="cf-big cf-pa" />
              <span className="tag cf-u">Payments</span>
              <span className="cf-big cf-ma cf-gap" />
              <span className="tag cf-u">Moved</span>
            </div>
            <span className="tag cf-u">Every debt paid in full</span>
          </div>
          <div className="cf-lay cf-b">
            <span className="tag cf-k">
              <span className="cf-sq" aria-hidden="true" />
              With Mitra
            </span>
            <div className="cf-nums">
              <span className="cf-big cf-pb" />
              <span className="tag cf-u">Payment</span>
              <span className="cf-big cf-mb cf-gap cf-acc" />
              <span className="tag cf-u">Moved</span>
            </div>
            <div className="tag cf-never">
              <span className="cf-ink">$220 never had to move</span>
              <span>
                Without Mitra: <s>4 payments · $250</s>
              </span>
            </div>
          </div>
        </div>

        <div className="cf-banner tag">
          <span className="cf-a">
            <b className="cf-ink">[ Without Mitra ]</b> Every debt is paid, one by one
          </span>
          <span className="cf-b">
            <b className="cf-acc">[ With Mitra ]</b> Cleared first, then one payment
          </span>
        </div>

        <div className="cf-scroll">
          <Diagram />
        </div>

        <div className="tag cf-foot">
          <span>Same debts · Same people</span>
          <span>Four payments become one</span>
        </div>
      </div>
    </InView>
  );
}
