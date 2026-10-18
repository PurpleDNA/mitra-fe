import { NextResponse, type NextRequest } from "next/server";
import { currentAccount } from "@/lib/supabase/server";

/**
 * The app's door to the engine (NEXT_PUBLIC_MITRA_ENGINE_URL; public, it is just an address). It forwards a short
 * allow-list of engine endpoints and nothing else, for signed-in accounts only.
 *
 * It holds no engine secret and adds no authority: every write it forwards is already
 * signed by a wallet (the agent's registration, the vault owner's card sync), and the
 * engine verifies that signature itself. Forwarding through the app keeps the engine's
 * origin out of the browser and spares the engine a CORS policy.
 */
const ALLOWED: Record<string, { methods: ("GET" | "POST")[]; upstream: string }> = {
  agents: { methods: ["GET", "POST"], upstream: "/api/v1/agents" },
  mandates: { methods: ["GET"], upstream: "/api/v1/mandates" },
  sync: { methods: ["POST"], upstream: "/api/v1/vaults/sync" },
  health: { methods: ["GET"], upstream: "/api/v1/health" },
};

async function forward(req: NextRequest, path: string[], method: "GET" | "POST") {
  if (!(await currentAccount())) return NextResponse.json({ error: "SIGN_IN_REQUIRED" }, { status: 401 });
  const route = ALLOWED[path.join("/")];
  if (!route || !route.methods.includes(method)) return NextResponse.json({ error: "NOT_FORWARDED" }, { status: 404 });
  const base = process.env.NEXT_PUBLIC_MITRA_ENGINE_URL;
  if (!base) return NextResponse.json({ error: "ENGINE_URL_NOT_SET", detail: "NEXT_PUBLIC_MITRA_ENGINE_URL is not configured for this app." }, { status: 503 });

  const target = new URL(route.upstream, base);
  req.nextUrl.searchParams.forEach((v, k) => target.searchParams.set(k, v));
  try {
    const res = await fetch(target, {
      method,
      headers: { "content-type": "application/json" },
      body: method === "POST" ? await req.text() : undefined,
      signal: AbortSignal.timeout(25_000),
      cache: "no-store",
    });
    const text = await res.text();
    // A lookup that found nothing is an answer, not a failure: "this agent is not registered
    // yet" and "this card is not synced yet" are ordinary states the card shows.
    if (method === "GET" && res.status === 404 && /"(AGENT|MANDATE)_NOT_FOUND"/.test(text)) {
      return NextResponse.json({ data: null, notFound: true });
    }
    return new NextResponse(text, { status: res.status, headers: { "content-type": res.headers.get("content-type") ?? "application/json" } });
  } catch (e) {
    return NextResponse.json({ error: "ENGINE_UNREACHABLE", detail: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return forward(req, (await params).path, "GET");
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return forward(req, (await params).path, "POST");
}
