import { readFileSync } from "node:fs";
import path from "node:path";
import { cache, type ReactNode } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { unified, type Plugin } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeKatex from "rehype-katex";
import rehypeShiki from "@shikijs/rehype";
import { toJsxRuntime, type Components } from "hast-util-to-jsx-runtime";
import { visit } from "unist-util-visit";
import { toString as mdToString } from "mdast-util-to-string";
import type { Root as MdRoot, RootContent, Heading, Code, Link } from "mdast";
import type { Root as HastRoot, Element } from "hast";
import { site } from "@/lib/site";
import { pageByFile, pageBySlug, PAGES, type DocPage } from "./nav";
import { CodeTabs, CodeTab } from "@/components/docs/CodeTabs";

const CONTENT = path.resolve("content/docs");

export interface TocItem {
  id: string;
  text: string;
  depth: 2 | 3;
}

export interface RenderedPage {
  page: DocPage;
  title: string;
  toc: TocItem[];
  body: ReactNode;
}

/** A tab heading names a language: "TypeScript", "Python (`httpx`)", "REST API", … */
const TAB_HEADING = /^(TypeScript|Python|REST API|Bash|Rust|Solidity|JSON)\b/i;
const tabLabel = (h: Heading) => mdToString(h).replace(/\s*\(.*\)\s*$/, "").replace(/\s+Example$/i, "").trim();

/**
 * Consecutive "### TypeScript" / "### Python" sections, each holding one code block,
 * become one tabbed block — the Stripe-style switcher the spec asks for.
 */
const remarkCodeTabs: Plugin<[], MdRoot> = () => (tree) => {
  const out: RootContent[] = [];
  const kids = tree.children;
  for (let i = 0; i < kids.length; ) {
    const run: { label: string; code: Code }[] = [];
    let j = i;
    while (j + 1 < kids.length) {
      const h = kids[j];
      const c = kids[j + 1];
      if (h.type === "heading" && h.depth >= 3 && TAB_HEADING.test(mdToString(h)) && c.type === "code") {
        run.push({ label: tabLabel(h), code: c });
        j += 2;
      } else break;
    }
    if (run.length >= 2) {
      out.push({
        type: "codeTabs",
        data: { hName: "code-tabs" },
        children: run.map((r) => ({ type: "codeTab", data: { hName: "code-tab", hProperties: { label: r.label } }, children: [r.code] })),
      } as unknown as RootContent);
      i = j;
    } else {
      out.push(kids[i]);
      i += 1;
    }
  }
  tree.children = out;
};

/**
 * The pages use `$` both for prices ("$100") and for inline maths ("$A \to B$"). A `$`
 * directly before a digit is a price, so it is escaped before parsing; code is left alone.
 */
function escapePriceDollars(md: string): string {
  return md
    .split(/(```[\s\S]*?```|`[^`\n]*`)/g)
    .map((part, i) => (i % 2 === 1 ? part : part.replace(/(?<![\\$])\$(?=\d)/g, "\\$")))
    .join("");
}

/** Pictograph emoji (the pages' track icons) are not part of the site's type; prose drops them. */
const EMOJI = /\p{Extended_Pictographic}\uFE0F?\s?/gu;
const remarkStripEmoji: Plugin<[], MdRoot> = () => (tree) => {
  visit(tree, "text", (node: { value: string }) => {
    node.value = node.value.replace(EMOJI, "");
  });
};

/** Takes the page's H1 out of the body; the page header renders it. */
const remarkTitle: Plugin<[], MdRoot> = () => (tree, file) => {
  const idx = tree.children.findIndex((n) => n.type === "heading" && n.depth === 1);
  if (idx >= 0) {
    file.data.title = mdToString(tree.children[idx]);
    tree.children.splice(idx, 1);
  }
};

/**
 * Links in the pages are relative to docs/portal in the engine repo. Sibling pages
 * become portal routes; everything else points at the file in the engine repo.
 */
const remarkLinks: Plugin<[], MdRoot> = () => (tree) => {
  visit(tree, "link", (node: Link) => {
    const url = node.url;
    if (/^(https?:|mailto:|#)/.test(url)) return;
    const [rel, hash] = url.split("#");
    const repoPath = path.posix.normalize(path.posix.join("docs/portal", rel));
    const sibling = repoPath.startsWith("docs/portal/") ? pageByFile(repoPath.slice("docs/portal/".length)) : undefined;
    if (sibling) node.url = `/docs/${sibling.slug}${hash ? `#${hash}` : ""}`;
    else if (repoPath === "docs/llms.txt") node.url = "/llms.txt";
    else node.url = `${site.engineRepoUrl}/blob/main/${repoPath}${hash ? `#${hash}` : ""}`;
  });
};

/** Collects h2/h3 (after rehype-slug has given them ids) for "On this page". */
const rehypeToc: Plugin<[], HastRoot> = () => (tree, file) => {
  const toc: TocItem[] = [];
  visit(tree, "element", (el: Element) => {
    if ((el.tagName === "h2" || el.tagName === "h3") && typeof el.properties?.id === "string") {
      toc.push({ id: el.properties.id, text: hastText(el), depth: el.tagName === "h2" ? 2 : 3 });
    }
  });
  file.data.toc = toc;
};

function hastText(node: Element | HastRoot): string {
  let s = "";
  visit(node, "text", (t: { value: string }) => {
    s += t.value;
  });
  return s.trim();
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkStripEmoji)
  .use(remarkTitle)
  .use(remarkCodeTabs)
  .use(remarkLinks)
  .use(remarkRehype)
  .use(rehypeSlug)
  .use(rehypeKatex)
  .use(rehypeShiki, {
    theme: "github-light",
    langs: ["typescript", "python", "bash", "json", "rust", "solidity"],
    // Fences with no language are ASCII diagrams; they stay plain preformatted text.
    defaultLanguage: undefined,
  })
  .use(rehypeToc);

const components = {
  "code-tabs": CodeTabs,
  "code-tab": CodeTab,
  a: ({ href, children, ...rest }: { href?: string; children?: ReactNode }) =>
    href && /^https?:/.test(href) ? (
      <a href={href} target="_blank" rel="noreferrer" {...rest}>
        {children}
      </a>
    ) : (
      <a href={href} {...rest}>
        {children}
      </a>
    ),
  table: ({ children }: { children?: ReactNode }) => (
    <div className="dz-table">
      <table>{children}</table>
    </div>
  ),
} as unknown as Components;

export const renderPage = cache(async (slug: string): Promise<RenderedPage | null> => {
  const page = pageBySlug(slug);
  if (!page) return null;
  const source = readFileSync(path.join(CONTENT, page.file), "utf8");
  const file = { value: escapePriceDollars(source), data: {} as { title?: string; toc?: TocItem[] } };
  const mdast = processor.parse(file.value);
  const hast = (await processor.run(mdast, file as never)) as unknown as HastRoot;
  const body = toJsxRuntime(hast, { Fragment, jsx, jsxs, components });
  return { page, title: file.data.title ?? page.nav, toc: file.data.toc ?? [], body };
});

/** Titles and headings of every page, for the command palette. */
export const searchIndex = cache(async () => {
  const out: { slug: string; title: string; section: string; headings: TocItem[] }[] = [];
  for (const p of PAGES) {
    const r = await renderPage(p.slug);
    if (r) out.push({ slug: p.slug, title: r.title, section: p.section, headings: r.toc });
  }
  return out;
});

export function sourceInfo(): { engineCommit: string } {
  try {
    return JSON.parse(readFileSync(path.join(CONTENT, "SOURCE.json"), "utf8"));
  } catch {
    return { engineCommit: "unknown" };
  }
}
