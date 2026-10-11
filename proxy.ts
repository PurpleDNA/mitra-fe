import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, cookieGrantsAccess } from "@/lib/access";

/** The app is early access: without the access cookie, /app sends you to /access. */
export async function proxy(request: NextRequest) {
  if (await cookieGrantsAccess(request.cookies.get(ACCESS_COOKIE)?.value)) return NextResponse.next();
  const url = new URL("/access", request.url);
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/app", "/app/:path*"],
};
