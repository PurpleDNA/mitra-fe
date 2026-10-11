import { InView } from "@/components/InView";
import { site } from "@/lib/site";
import "./hero.css";

/** The six counterparties around the clearing block, and where each one's line lands. */
const PARTIES = [
  { x: -230, y: -210, label: "AGENT", lx: -50, ly: -30, anchor: "middle", to: [-30, 10] },
  { x: -80, y: -255, label: "MARKETPLACE", lx: -48, ly: -14, anchor: "end", to: [-12, -4] },
  { x: 80, y: -255, label: "AGENT", lx: 48, ly: -14, anchor: "start", to: [12, -4] },
  { x: 230, y: -210, label: "DATA API", lx: 40, ly: -30, anchor: "middle", to: [30, 10] },
  { x: -250, y: -80, label: "AGENT", lx: 0, ly: 52, anchor: "middle", to: [-50, 22] },
  { x: 250, y: -80, label: "COMPUTE", lx: 0, ly: 52, anchor: "middle", to: [50, 22] },
] as const;

function Tile() {
  return (
    <>
      <polygon className="fig-face" points="0,-24 42,0 0,24 -42,0" />
      <polygon className="fig-side" points="-42,0 0,24 0,34 -42,10" />
      <polygon className="fig-side" points="42,0 0,24 0,34 42,10" />
    </>
  );
}

function ClearingFigure() {
  return (
    <svg
      className="hero-fig"
      role="img"
      aria-label="Agents, a marketplace and services send what they owe into one clearing block, Mitra. A single net payment leaves at the bottom for settlement."
      viewBox="-300 -290 600 690"
    >
      <text className="fig-lbl fig-sm hero-hide-sm" x={-292} y={40}>
        [ IN ] EVERYTHING OWED
      </text>
      <polygon className="hero-floor" points="0,-120 210,0 0,120 -210,0" transform="translate(0,96)" />

      <g transform="translate(0,90)">
        <g className="hero-drop" style={{ animationDelay: "0.1s" }}>
          <polygon className="fig-face" points="0,-96 166,0 0,96 -166,0" />
          <polygon className="fig-side" points="-166,0 0,96 0,106 -166,10" />
          <polygon className="fig-side" points="166,0 0,96 0,106 166,10" />
        </g>
      </g>
      <g transform="translate(0,20)">
        <g className="hero-drop" style={{ animationDelay: "0.35s" }}>
          <polygon className="fig-tint" points="0,-64 111,0 0,64 -111,0" />
          <polygon className="fig-side" points="-111,0 0,64 0,134 -111,70" />
          <polygon className="fig-side" points="111,0 0,64 0,134 111,70" />
          <path className="fig-ln" d="M-111 35 L0 99 L111 35" />
          <polygon className="hero-slot" points="0,-32 55,0 0,32 -55,0" />
          <path className="fig-ln" strokeOpacity={0.2} d="M-28 -16 L28 16 M28 -16 L-28 16" />
          <circle cx={80} cy={66} r={2.2} fill="currentColor" />
          <circle cx={92} cy={59} r={2.2} fill="currentColor" />
        </g>
      </g>
      <g className="hero-pop hero-hide-sm" style={{ animationDelay: "1.2s" }}>
        <path className="fig-lead" d="M111 55 H178" />
        <text className="fig-lbl" x={184} y={52}>MITRA</text>
        <text className="fig-lbl fig-sm" x={184} y={66}>CLEARING</text>
      </g>

      {PARTIES.map((p, i) => (
        <path
          key={`w${i}`}
          className="hero-wire"
          pathLength={1}
          style={{ animationDelay: `${1 + i * 0.1}s` }}
          d={`M${p.x} ${p.y + 34} L${p.to[0]} ${p.to[1]}`}
        />
      ))}
      {PARTIES.map((p, i) => (
        <g key={`t${i}`} transform={`translate(${p.x},${p.y})`}>
          <g className="hero-pop" style={{ animationDelay: `${0.6 + i * 0.08}s` }}>
            <Tile />
            <text className="fig-lbl fig-sm hero-hide-sm" x={p.lx} y={p.ly} textAnchor={p.anchor}>
              {p.label}
            </text>
          </g>
        </g>
      ))}
      {PARTIES.map((p, i) => (
        <g key={`c${i}`} transform={`translate(${p.x},${p.y + 34})`}>
          <g
            className="hero-chip"
            style={
              {
                "--dx": `${p.to[0] - p.x}px`,
                "--dy": `${p.to[1] - (p.y + 34)}px`,
                animationDelay: `${2.4 + i * 0.45}s`,
              } as React.CSSProperties
            }
          >
            <polygon className="fig-face" points="0,-9 16,0 0,9 -16,0" />
          </g>
        </g>
      ))}

      <path className="hero-out" pathLength={1} d="M0 196 V264" />
      <g transform="translate(0,300)">
        <g className="hero-pop" style={{ animationDelay: "2.2s" }}>
          <polygon className="fig-face" points="0,-34 59,0 0,34 -59,0" />
          <polygon className="fig-side" points="-59,0 0,34 0,46 -59,12" />
          <polygon className="fig-side" points="59,0 0,34 0,46 59,12" />
          <polygon className="hero-acc-fill" points="0,-14 24,0 0,14 -24,0" />
        </g>
      </g>
      <g className="hero-pop hero-hide-sm" style={{ animationDelay: "2.4s" }}>
        <path className="fig-lead" d="M59 306 H100" />
        <text className="fig-lbl" x={106} y={303}>SETTLEMENT</text>
        <text className="fig-lbl fig-sm" x={106} y={317}>[ OUT ] ONLY WHAT REMAINS</text>
      </g>
      <g transform="translate(0,196)">
        <g className="hero-chip-out">
          <polygon className="hero-acc-fill" points="0,-9 16,0 0,9 -16,0" />
        </g>
      </g>
    </svg>
  );
}

export function Hero() {
  return (
    <InView className="hero" id="top" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="hero-eyebrow">
          <span className="hero-sq" aria-hidden="true" />
          The clearinghouse for agentic commerce
        </p>
        <div className="hero-head">
          <h1 id="hero-title" className="hero-title">
            <span className="w"><span style={{ animationDelay: "0.05s" }}>Agents</span></span>
            <br />
            <span className="w"><span style={{ animationDelay: "0.15s" }}>trade.</span></span>
            <br />
            <span className="w"><span style={{ animationDelay: "0.3s" }}>Mitra</span></span>
            <br />
            <span className="brk">
              <span className="w"><span style={{ animationDelay: "0.4s" }}>clears.</span></span>
              <i className="c tl" aria-hidden="true" />
              <i className="c tr" aria-hidden="true" />
              <i className="c bl" aria-hidden="true" />
              <i className="c br" aria-hidden="true" />
            </span>
          </h1>
          <div className="hero-cue tag">
            <a href="#problem">[ Why Mitra ↓ ]</a>
            <span className="hero-rule" aria-hidden="true" />
          </div>
        </div>
      </div>
      <aside className="hero-panel dots" aria-label="How clearing works">
        <div className="hero-cap tag">
          <span>FIG_01 — Clearing</span>
          <span>[ Netting ≠ Settlement ]</span>
        </div>
        <ClearingFigure />
        <p className="hero-sub">
          Mitra is the financial coordination layer between AI agents and money. It holds each budget,
          checks every payment, carries every deal through failure, and cancels out what agents owe each
          other, so only what remains ever moves.
        </p>
        <div className="hero-ctas">
          <a href={site.earlyAccessHref} className="btn btn-dark">
            Get early access <span aria-hidden="true">›</span>
          </a>
          <a href="#checks" className="btn btn-line">
            See how it works
          </a>
        </div>
        <p className="tag hero-net">[ {site.networkStatus} ]</p>
      </aside>
    </InView>
  );
}
