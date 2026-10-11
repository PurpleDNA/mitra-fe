import { readFileSync } from "node:fs";
import path from "node:path";

export const dynamic = "force-static";

/** The machine-readable index of the docs, copied from the engine repo by `npm run docs:sync`. */
export function GET() {
  let body: string;
  try {
    body = readFileSync(path.resolve("content/llms.txt"), "utf8");
  } catch {
    return new Response("llms.txt has not been synced. Run `npm run docs:sync`.\n", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
