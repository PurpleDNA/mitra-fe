import type { Metadata } from "next";
import Link from "next/link";
import "katex/dist/katex.min.css";
import "./docs.css";
import { Sidebar } from "@/components/docs/Sidebar";
import { Search } from "@/components/docs/Search";
import { searchIndex } from "@/lib/docs/render";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: { default: "Mitra docs", template: "%s — Mitra docs" },
  description: "Developer documentation for Mitra, the clearinghouse for agentic commerce.",
};

export default async function DocsLayout({ children }: { children: React.ReactNode }) {
  const index = await searchIndex();
  return (
    <div className="dz">
      <header className="dz-top">
        <div className="dz-top-in">
          <Link href="/" className="dz-logo" aria-label="Mitra home">
            <span className="dz-mark" aria-hidden="true" />
            <span>mitra</span>
          </Link>
          <Link href="/docs" className="tag dz-docs-tag">
            Docs
          </Link>
          <div className="dz-top-gap" />
          <Search index={index} />
          <a href="/llms.txt" className="tag dz-llms">
            /llms.txt
          </a>
          <a href={site.earlyAccessHref} className="btn btn-dark dz-cta">
            Get early access
          </a>
        </div>
        {site.docsDraftNotice ? (
          <p className="dz-draft tag" role="note">
            <span className="dz-draft-sq" aria-hidden="true" />
            {site.docsDraftNotice}
          </p>
        ) : null}
      </header>
      <div className="dz-body">
        <Sidebar />
        {children}
      </div>
    </div>
  );
}
