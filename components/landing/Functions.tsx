"use client";

import { useEffect, useRef, useState } from "react";
import "./functions.css";

const INTRO = [
  "Mitra sits between your AI agents and your money.",
  "It holds the budget, writes down every deal, checks every",
  "payment and cleans up when something fails, so your agent",
  "can work on its own without ever being able to overspend.",
];

const SLIDES = [
  {
    tag: "[ Vault · Wallet ≠ Principal ]",
    title: "The budget",
    body: "Money set aside for your agent, never the keys to your treasury. It sees what’s free, what’s on hold and what’s committed.",
  },
  {
    tag: "[ Coordination ]",
    title: "The deal",
    body: "Every job is an agreement: who does what, for how much, by when. Nobody gets paid until the work is accepted.",
  },
  {
    tag: "[ Recovery ]",
    title: "The safety net",
    body: "If an agent fails, the money comes back. Automatically. No chasing.",
  },
  {
    tag: "[ Netting ≠ Settlement ]",
    title: "Clear first. Move only what remains.",
    body: "You owe them $100, they owe you $70. Only $30 moves.",
  },
  {
    tag: "[ Settlement ]",
    title: "Final payment",
    body: "What remains is paid on Base, Solana or Tempo, with a signed receipt.",
  },
];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function Slab({ a, b, t, top = "fig-face" }: { a: number; b: number; t: number; top?: string }) {
  return (
    <>
      <polygon className={top} pathLength={1} points={`0,-${b} ${a},0 0,${b} -${a},0`} />
      <polygon className="fig-side" pathLength={1} points={`-${a},0 0,${b} 0,${b + t} -${a},${t}`} />
      <polygon className="fig-side" pathLength={1} points={`${a},0 0,${b} 0,${b + t} ${a},${t}`} />
    </>
  );
}

function Card() {
  return (
    <>
      <polygon className="fig-face" pathLength={1} points="-17,-60 104,10 17,60 -104,-10" />
      <polygon className="fig-side" pathLength={1} points="104,10 17,60 17,66 104,16" />
      <polygon className="fig-side" pathLength={1} points="17,60 -104,-10 -104,-4 17,66" />
      <path className="fig-ln" pathLength={1} d="M-40 -28 L30 12 M-56 -16 L0 16" />
    </>
  );
}

function Figures({ active }: { active: number }) {
  const on = (i: number) => `fn-f${active === i ? " on" : ""}`;
  return (
    <svg viewBox="-240 -220 480 440" role="img" aria-label={`Figure for ${SLIDES[active].title}`}>
      <g className={on(0)}>
        <g transform="translate(0,60)"><Slab a={121} b={70} t={8} /></g>
        <g transform="translate(0,31)"><Slab a={97} b={56} t={26} /></g>
        <g transform="translate(0,2)"><Slab a={97} b={56} t={26} /></g>
        <g transform="translate(0,-27)">
          <Slab a={97} b={56} t={26} top="fig-tint" />
          <polygon className="fig-face" pathLength={1} points="0,-28 48,0 0,28 -48,0" />
        </g>
      </g>

      <g className={on(1)}>
        <path className="fig-guide" d="M-120 80 L120 -60" />
        <g transform="translate(-120,40)"><Card /></g>
        <g transform="translate(120,-40)"><Card /></g>
        <polygon className="fn-acc-fill" pathLength={1} points="0,-14 24,0 0,14 -24,0" />
      </g>

      <g className={on(2)}>
        <g transform="translate(-90,80)"><Slab a={121} b={70} t={10} /></g>
        <g transform="translate(-90,51)"><Slab a={97} b={56} t={26} top="fig-tint" /></g>
        <path className="fig-guide" d="M150 -133 L220 -173" />
        <g transform="translate(110,-110)">
          <Slab a={45} b={26} t={6} />
          <path className="fn-x" pathLength={1} d="M-9 -6 L9 6 M9 -6 L-9 6" />
        </g>
        <path className="fig-acc" pathLength={1} d="M110 -76 C 110 40, 10 60, -50 40" />
        <path className="fig-acc" pathLength={1} d="M-36 55 L-50 40 L-30 37" />
      </g>

      <g className={on(3)}>
        <path className="fig-guide" d="M-90 30 L90 30 M-90 46 L90 46 M-110 10 L-20 -80 M110 10 L20 -80" />
        <g transform="translate(-130,40)"><Slab a={45} b={26} t={10} /></g>
        <g transform="translate(130,40)"><Slab a={45} b={26} t={10} /></g>
        <g transform="translate(0,-90)"><Slab a={45} b={26} t={10} /></g>
        <path className="fig-acc" pathLength={1} d="M110 110 L-110 110" />
        <path className="fig-acc" pathLength={1} d="M-94 98 L-112 110 L-94 122" />
      </g>

      <g className={on(4)}>
        <g transform="translate(-40,100)">
          <polygon className="fn-shadow" points="0,24 90,-28 0,-80 -90,-28" />
          <g className="fn-receipt-meta">
            <path className="fig-lead" d="M58 -204 H70" />
            <text className="fig-lbl" x={76} y={-200}>RECEIPT</text>
            <text className="fig-lbl fig-sm" x={76} y={-182}>TEMPO MODERATO · TESTNET</text>
            <text className="fig-lbl fig-sm" x={76} y={-164}>BLOCK 38398243</text>
            <text className="fig-lbl fig-sm" x={76} y={-146}>TX 0x80cc…35f3</text>
          </g>
          <g className="fn-stamp">
            <path
              className="fig-face"
              pathLength={1}
              d="M52 -230 L-52 -170 L-52 30 L-43 33 L-35 20 L-26 23 L-17 10 L-9 13 L0 0 L9 3 L17 -10 L26 -7 L35 -20 L43 -17 L52 -30 Z"
            />
            <path className="fig-ln" pathLength={1} d="M35 -190 L-35 -150 M35 -170 L-35 -130 M35 -150 L-9 -125" />
            <path className="fig-ln" pathLength={1} strokeWidth={2.4} d="M35 -90 L-35 -50" />
            <circle className="fn-acc-fill" pathLength={1} cx={0} cy={-100} r={13} />
            <path className="fn-tick" pathLength={1} d="M-6 -100 L-2 -96 L7 -105" />
          </g>
        </g>
      </g>
    </svg>
  );
}

export function Functions() {
  const introRef = useRef<HTMLParagraphElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  // Server render shows the finished state (all lines lit, first slide), so the
  // section reads correctly before hydration and without JavaScript.
  const [lit, setLit] = useState(1);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const intro = introRef.current;
      if (intro) {
        const r = intro.getBoundingClientRect();
        setLit(clamp((vh * 0.9 - r.top) / (r.height + vh * 0.4), 0, 1));
      }
      const pin = pinRef.current;
      if (pin) {
        const r = pin.getBoundingClientRect();
        const travel = r.height - vh;
        setProgress(travel > 0 ? clamp(-r.top / travel, 0, 1) : 0);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const active = Math.min(SLIDES.length - 1, Math.floor(progress * SLIDES.length));

  return (
    <section id="functions" className="fn" aria-labelledby="fn-title">
      <div className="fn-intro wrap">
        <h2 id="fn-title" className="tag fn-eyebrow">[ What Mitra does ]</h2>
        <span className="tag fn-ellipsis" aria-hidden="true">···</span>
        <p ref={introRef} className="fn-para">
          {INTRO.map((line, i) => (
            <span key={line} className={`fn-line${lit > (i + 0.5) / INTRO.length ? " lit" : ""}`}>
              {line}{" "}
            </span>
          ))}
        </p>
      </div>
      <div className="fn-matrix" aria-hidden="true" />
      <div ref={pinRef} className="fn-pin">
        <div className="fn-stick">
          <div className="fn-grid wrap">
            <div className="fn-figbox brackets">
              <span className="bk tl" />
              <span className="bk tr" />
              <span className="bk bl" />
              <span className="bk br" />
              <Figures active={active} />
            </div>
            <div className="fn-text">
              <div className="fn-slides">
                {SLIDES.map((s, i) => (
                  <article key={s.title} className={`fn-s${active === i ? " on" : ""}`} aria-current={active === i}>
                    <div className="tag fn-row">
                      <span>{s.tag}</span>
                      <span className="fn-rule" aria-hidden="true" />
                      <span className="fn-count">
                        {String(i + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
                      </span>
                    </div>
                    <h3 className="fn-h">{s.title}</h3>
                    <p className="fn-p">{s.body}</p>
                  </article>
                ))}
              </div>
              <div className="fn-bars" aria-hidden="true">
                {SLIDES.map((s, i) => (
                  <div key={s.title} className="fn-bar">
                    <div
                      className="fn-fill"
                      style={{ transform: `scaleX(${clamp(progress * SLIDES.length - i, 0, 1)})` }}
                    />
                  </div>
                ))}
              </div>
              <p className="tag fn-hint">Scroll to step through</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
