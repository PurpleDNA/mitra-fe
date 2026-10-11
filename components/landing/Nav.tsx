import { Mark } from "@/components/Mark";
import { site } from "@/lib/site";
import "./nav.css";

export function Nav() {
  return (
    <header className="nav">
      <div className="nav-in wrap">
        <a href="#top" className="nav-logo" aria-label="Mitra, back to top">
          <Mark className="nav-mark" />
          <span>mitra</span>
        </a>
        <nav className="nav-links" aria-label="Sections">
          <a href="#problem">Why Mitra</a>
          <a href="#functions">What it does</a>
          <a href="#checks">How it works</a>
          <a href="#clear">Clear first</a>
          <a href="/docs">Docs</a>
          <a href="/app">App</a>
        </nav>
        <a href={site.earlyAccessHref} className="btn btn-dark nav-cta">
          Get early access <span aria-hidden="true">›</span>
        </a>
      </div>
    </header>
  );
}
