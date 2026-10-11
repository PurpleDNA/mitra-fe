import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PAGES } from "@/lib/docs/nav";
import { renderPage, sourceInfo } from "@/lib/docs/render";
import { Toc } from "@/components/docs/Toc";
import { site } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const r = await renderPage(slug);
  return { title: r?.title ?? "Not found" };
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = await renderPage(slug);
  if (!r) notFound();

  const i = PAGES.findIndex((p) => p.slug === slug);
  const prev = PAGES[i - 1];
  const next = PAGES[i + 1];
  const { engineCommit } = sourceInfo();

  return (
    <>
      <main className="dz-main">
        <p className="tag dz-crumb">
          <span>{r.page.section}</span>
          <span aria-hidden="true">·</span>
          <span>
            {String(i + 1).padStart(2, "0")} / {String(PAGES.length).padStart(2, "0")}
          </span>
        </p>
        <h1 className="dz-h1">{r.title}</h1>
        <article className="dz-prose">{r.body}</article>
        <nav className="dz-pager" aria-label="Previous and next page">
          {prev ? (
            <Link href={`/docs/${prev.slug}`} className="dz-pg">
              <span className="tag">← Previous</span>
              <span>{prev.nav}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={`/docs/${next.slug}`} className="dz-pg dz-pg-next">
              <span className="tag">Next →</span>
              <span>{next.nav}</span>
            </Link>
          ) : null}
        </nav>
        <p className="tag dz-source">
          Source:{" "}
          <a href={`${site.engineRepoUrl}/blob/main/docs/portal/${r.page.file}`} target="_blank" rel="noreferrer">
            docs/portal/{r.page.file}
          </a>{" "}
          @ {engineCommit}
        </p>
      </main>
      <Toc items={r.toc} />
    </>
  );
}
