#!/usr/bin/env node
/**
 * Copies the developer portal's pages from the engine repo into content/docs.
 *
 * The engine repo (../mitra, or $MITRA_ENGINE_DIR) owns the words: docs/portal/NN-*.md
 * and docs/llms.txt. This repo only renders them. Edit the pages there, then run
 * `npm run docs:sync` here and commit the result — the copy is what the site builds
 * from, so a deploy never depends on a sibling checkout being present.
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const engine = path.resolve(process.env.MITRA_ENGINE_DIR ?? "../mitra");
const src = path.join(engine, "docs/portal");
const out = path.resolve("content/docs");

if (!existsSync(src)) {
  console.error(`[docs:sync] no portal pages at ${src}. Set MITRA_ENGINE_DIR to the engine checkout.`);
  process.exit(2);
}

const pages = readdirSync(src).filter((f) => /^\d{2}-[a-z0-9-]+\.md$/.test(f)).sort();
if (pages.length === 0) {
  console.error(`[docs:sync] ${src} has no NN-name.md pages.`);
  process.exit(2);
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const f of pages) copyFileSync(path.join(src, f), path.join(out, f));

const llms = path.join(engine, "docs/llms.txt");
if (existsSync(llms)) copyFileSync(llms, path.resolve("content/llms.txt"));

let commit = "unknown";
try {
  commit = execFileSync("git", ["-C", engine, "rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
} catch {
  // Not a git checkout: the copy still works, it just cannot say which commit it came from.
}
writeFileSync(path.join(out, "SOURCE.json"), JSON.stringify({ engineCommit: commit, pages: pages.length }, null, 2) + "\n");
console.log(`[docs:sync] ${pages.length} pages from ${engine} @ ${commit}`);

// A page the portal's nav does not list would be built but unreachable from the sidebar.
const nav = readFileSync(path.resolve("lib/docs/nav.ts"), "utf8");
const unlisted = pages.filter((f) => !nav.includes(`"${f}"`));
if (unlisted.length > 0) {
  console.warn(`[docs:sync] not in lib/docs/nav.ts yet, add them: ${unlisted.join(", ")}`);
  process.exitCode = 1;
}
