import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/access";
import { supabaseServer } from "@/lib/supabase/server";

/** Where Google, GitHub and email links come back to: trade the one-time code for a session. */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));
  if (code) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(new URL(`/signin?error=1&next=${encodeURIComponent(next)}`, url.origin));
}
