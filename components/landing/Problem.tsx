import { InView } from "@/components/InView";
import { RiseTitle } from "@/components/RiseTitle";
import "./problem.css";

function Chip({ a = 21, b = 12, t = 3 }: { a?: number; b?: number; t?: number }) {
  return (
    <>
      <polygon className="fig-face" points={`0,-${b} ${a},0 0,${b} -${a},0`} />
      <polygon className="fig-side" points={`-${a},0 0,${b} 0,${b + t} -${a},${t}`} />
      <polygon className="fig-side" points={`${a},0 0,${b} 0,${b + t} ${a},${t}`} />
    </>
  );
}

/** Where the wallet's money leaves from: the middle of the cube's top face. */
const ORIGIN = [-30, 8] as const;
/** Each chip's resting place, and its launch delay. */
const DRAIN = [
  [45, -40, 0],
  [75, -22, 0.4],
  [95, -57, 0.8],
] as const;

function FigDrain() {
  return (
    <svg viewBox="-130 -80 260 160" aria-hidden="true">
      <text className="fig-lbl fig-sm" x={-122} y={-56}>“SEND IT ALL”</text>
      <g transform="translate(-30,8)">
        <polygon className="fig-face" points="0,-40 69,0 0,40 -69,0" />
        <polygon className="fig-side" points="-69,0 0,40 0,54 -69,14" />
        <polygon className="fig-side" points="69,0 0,40 0,54 69,14" />
        <polygon className="fig-face pb-hole" points="0,-20 35,0 0,20 -35,0" />
      </g>
      {DRAIN.map(([x, y]) => (
        <path key={`l${x}`} className="fig-guide" d={`M${ORIGIN[0]} ${ORIGIN[1]} L${x} ${y}`} />
      ))}
      {DRAIN.map(([x, y, d]) => (
        <g key={`c${x}`} transform={`translate(${x},${y})`}>
          <g
            className="pb-fly"
            style={
              { "--fx": `${ORIGIN[0] - x}px`, "--fy": `${ORIGIN[1] - y}px`, animationDelay: `${d}s` } as React.CSSProperties
            }
          >
            <Chip />
          </g>
        </g>
      ))}
    </svg>
  );
}

function FigVanish() {
  return (
    <svg viewBox="-130 -80 260 160" aria-hidden="true">
      <g transform="translate(0,-14)">
        <path className="fig-guide" d="M-36 12 L36 -12" />
        <g transform="translate(-75,25)">
          <Chip a={45} b={26} t={10} />
        </g>
        <g transform="translate(75,-25)">
          <g className="pb-gone">
            <Chip a={45} b={26} t={10} />
          </g>
          <text className="fig-lbl" x={0} y={4} textAnchor="middle" fontSize={14}>?</text>
        </g>
        <g className="pb-pay">
          <circle r={6} fill="currentColor" />
        </g>
      </g>
      <text className="fig-lbl fig-sm" x={-122} y={68}>PAID UPFRONT</text>
      <text className="fig-lbl fig-sm" x={122} y={68} textAnchor="end">GONE</text>
    </svg>
  );
}

function FigFees() {
  const xs = [-100, -60, -20, 20, 60, 100];
  return (
    <svg viewBox="-130 -80 260 160" aria-hidden="true">
      <path className="fig-guide" d="M-100 40 L100 -20" />
      {xs.map((x, i) => (
        <g key={x} transform={`translate(${x},${40 - i * 12})`}>
          <Chip a={17} b={10} t={3} />
          <text className="fig-lbl pb-fee" x={0} y={-18} textAnchor="middle" style={{ animationDelay: `${i * 0.3}s` }}>
            $
          </text>
        </g>
      ))}
      <text className="fig-lbl fig-sm" x={-122} y={68}>EACH JOB, ITS OWN FEE</text>
    </svg>
  );
}

function FigBlind() {
  return (
    <svg viewBox="-130 -80 260 160" aria-hidden="true">
      <g transform="translate(-82,0)">
        <Chip a={38} b={22} t={6} />
        <text className="fig-lbl" x={0} y={4} textAnchor="middle">$5</text>
      </g>
      <path className="fig-lead" d="M-40 0 H-24" />
      <text className="fig-lbl" x={-16} y={-26}>✓ CAN $5 MOVE?</text>
      <text className="fig-lbl pb-q" x={-16} y={4}>? DID YOU APPROVE IT?</text>
      <text className="fig-lbl pb-q" x={-16} y={34} style={{ animationDelay: "1s" }}>? WAS THE WORK DONE?</text>
    </svg>
  );
}

const ITEMS = [
  { fig: <FigDrain />, title: "One bad instruction empties it.", body: "A tricked or confused agent can spend everything it holds, in seconds." },
  { fig: <FigVanish />, title: "Pay first, get nothing.", body: "Pay another agent upfront. If it crashes or disappears, the money goes with it." },
  { fig: <FigFees />, title: "Every small job pays its own way.", body: "Thousands of tiny payments, each one moving money and paying a fee on its own." },
  { fig: <FigBlind />, title: "Payments can’t tell right from wrong.", body: "A payment tool only knows whether $5 can move, not whether you approved it or the work got done." },
];

export function Problem() {
  return (
    <InView className="pb wrap" id="problem" aria-labelledby="problem-title">
      <div className="pb-top tag">
        <span>[ The problem ] · Why Mitra</span>
      </div>
      <RiseTitle id="problem-title" className="pb-title" text="An agent with a wallet is a blank cheque." />
      <p className="pb-lede">Today, people give an AI agent a funded wallet and hope for the best. Four things go wrong.</p>
      <ol className="pb-grid">
        {ITEMS.map((it, i) => (
          <li key={it.title} className="pb-item">
            <span className="tag pb-num">{String(i + 1).padStart(2, "0")}</span>
            <div className="pb-fig dots">{it.fig}</div>
            <h3 className="pb-h">{it.title}</h3>
            <p className="pb-p">{it.body}</p>
          </li>
        ))}
      </ol>
      <p className="pb-foot tag">Mitra answers all four ↓</p>
    </InView>
  );
}
