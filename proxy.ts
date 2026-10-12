import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, cookieGrantsAccess } from "@/lib/access";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Two doors in front of /app, in order:
 *   1. early access: without the access cookie, /app sends you to /access;
 *   2. an account: without a session, /app sends you to /signin.
 * Every matched request also refreshes the Supabase session cookie.
 */
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isApp = path === "/app" || path.startsWith("/app/");

  if (isApp && !(await cookieGrantsAccess(request.cookies.get(ACCESS_COOKIE)?.value))) {
    return redirectTo(request, "/access", path);
  }

  const { response, signedIn } = await updateSession(request);
  if (isApp && !signedIn) {
    const r = redirectTo(request, "/signin", path);
    response.cookies.getAll().forEach((c) => r.cookies.set(c));
    return r;
  }
  return response;
}

function redirectTo(request: NextRequest, where: string, next: string) {
  const url = new URL(where, request.url);
  url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/app", "/app/:path*", "/signin", "/auth/:path*"],
};
