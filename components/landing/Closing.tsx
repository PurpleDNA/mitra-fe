import { site } from "@/lib/site";
import "./closing.css";

export function Closing() {
  return (
    <>
      <section className="cl wrap" id="early-access" aria-labelledby="cl-title">
        <p className="tag">[ The clearinghouse for agentic commerce ]</p>
        <h2 id="cl-title" className="cl-title">
          Agents trade. <span className="cl-acc">Mitra clears.</span>
        </h2>
        <p className="cl-p">
          Mitra runs on test networks today. Early access is for teams building agents that buy, sell and pay each
          other, who want every payment checked and every deal cleared before money moves.
        </p>
        <div className="cl-ctas">
          <a href={site.earlyAccessHref} className="btn btn-dark">
            Get early access <span aria-hidden="true">›</span>
          </a>
          <a href="#checks" className="btn btn-line">
            See how it works
          </a>
        </div>
      </section>
      <footer className="ft">
        <div className="ft-in wrap">
          <span className="ft-logo">
            <span className="ft-mark" aria-hidden="true" />
            mitra
          </span>
          <span className="tag">[ {site.networkStatus} ]</span>
          <span className="tag">© {new Date().getFullYear()} Mitra</span>
        </div>
      </footer>
    </>
  );
}
