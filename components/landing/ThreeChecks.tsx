import { InView } from "@/components/InView";
import "./checks.css";

const DIAMONDS = [
  { cx: 508, lines: ["Within", "budget?"] },
  { cx: 756, lines: ["Approved by", "your rules?"] },
  { cx: 1004, lines: ["Exact", "match?"] },
];

/** Straight arrows along the main row, tail x → head x (the head sits past the end). */
const ROW_ARROWS: [number, number][] = [
  [96, 139],
  [344, 419],
  [592, 667],
  [840, 915],
  [1088, 1163],
  [1344, 1403],
];

function Diagram() {
  return (
    <svg
      className="chk-svg"
      viewBox="40 316 1440 456"
      role="img"
      aria-label="A payment passes three checks in order: within budget, approved by your rules, and an exact match. Passing all three, it is paid with a receipt. Failing any one, it is stopped and nothing moves."
    >
      <defs>
        <marker id="chk-head" viewBox="0 0 4 4" refX="2" refY="2" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0 0 L4 2 L0 4 Z" fill="#0b0b0c" />
        </marker>
        <marker id="chk-head-stop" viewBox="0 0 4 4" refX="2" refY="2" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0 0 L4 2 L0 4 Z" fill="#e0341c" />
        </marker>
      </defs>

      {ROW_ARROWS.map(([a, b]) => (
        <line key={a} className="chk-arrow" x1={a} y1={430} x2={b} y2={430} markerEnd="url(#chk-head)" />
      ))}
      <path className="chk-no" d="M508 490 V620 M756 490 V620 M1004 490 V620 M508 620 H1004" />
      <line className="chk-no-head" x1={756} y1={620} x2={756} y2={671} markerEnd="url(#chk-head-stop)" />

      <circle cx={80} cy={430} r={16} className="chk-ink" />
      <rect x={144} y={390} width={200} height={80} className="chk-card" />
      <text x={244} y={436} className="chk-card-t" textAnchor="middle">Agent asks to pay</text>

      {DIAMONDS.map((d) => (
        <g key={d.cx}>
          <polygon className="chk-ink" points={`${d.cx},370 ${d.cx + 84},430 ${d.cx},490 ${d.cx - 84},430`} />
          <text x={d.cx} y={426} className="chk-dia-t" textAnchor="middle">{d.lines[0]}</text>
          <text x={d.cx} y={443} className="chk-dia-t" textAnchor="middle">{d.lines[1]}</text>
        </g>
      ))}

      <rect x={1162} y={384} width={188} height={92} className="chk-ring chk-ring-paid" />
      <rect x={1168} y={390} width={176} height={80} className="chk-paid" />
      <text x={1256} y={428} className="chk-paid-t" textAnchor="middle">Paid</text>
      <text x={1256} y={448} className="chk-paid-s" textAnchor="middle">+ RECEIPT</text>

      <circle cx={1424} cy={430} r={15} className="chk-end" />
      <circle cx={1424} cy={430} r={8} className="chk-ink" />

      <rect x={650} y={674} width={212} height={92} className="chk-ring chk-ring-stop" />
      <rect x={656} y={680} width={200} height={80} className="chk-stop" />
      <rect x={690} y={704} width={12} height={12} className="chk-stop-sq" />
      <text x={714} y={716} className="chk-card-t chk-strong">Stopped</text>
      <text x={714} y={737} className="chk-mono chk-mute">NOTHING MOVES</text>

      {[632, 880, 1128].map((x) => (
        <text key={x} x={x} y={414} className="chk-yes" textAnchor="middle">yes</text>
      ))}
      {[532, 780, 1028].map((x) => (
        <text key={x} x={x} y={559} className="chk-no-t" textAnchor="middle">no</text>
      ))}
      <text x={1040} y={512} className="chk-mono">RE-CHECKED ON-CHAIN</text>
      <text x={880} y={342} className="chk-mono chk-chg" textAnchor="middle">RECIPIENT CHANGED</text>

      <g className="chk-dot">
        <circle r={13} className="chk-dot-ring" />
        <circle r={9} className="chk-dot-c" />
      </g>
    </svg>
  );
}

export function ThreeChecks() {
  return (
    <InView className="chk wrap" id="checks" aria-labelledby="checks-title">
      <div className="chk-top">
        <p className="tag chk-eyebrow">[ How it works ] · FIG_02</p>
        <p className="tag chk-run" aria-hidden="true">
          <span className="chk-s1">Run 01 · All checks pass → Paid</span>
          <span className="chk-s2">Run 02 · Recipient changed → Stopped</span>
        </p>
      </div>
      <h2 id="checks-title" className="chk-title">Three checks. Every payment.</h2>
      <p className="chk-lede">
        Your agent can ask to pay. It can’t skip a check, and an approval on its own never moves money. The last
        check looks at this exact payment, again.
      </p>
      <div className="chk-scroll">
        <Diagram />
      </div>
      <div className="chk-below">
        <p className="chk-note">
          <b>Approval isn’t payment.</b> Your rules can say yes, and the final check still confirms this exact payment,
          to this person, for this amount. Change one detail and the vault refuses it on-chain.
        </p>
        <ul className="chk-legend tag">
          <li><span className="chk-key chk-key-pay" />Payment</li>
          <li><span className="chk-key chk-key-stop" />Stopped</li>
          <li><span className="chk-key chk-key-check" />Check</li>
        </ul>
      </div>
      <div className="chk-foot tag">
        <span>[ Allow ≠ Payment ] · Budget → Rules → Final check</span>
        <span>The agent never holds the keys</span>
      </div>
    </InView>
  );
}
