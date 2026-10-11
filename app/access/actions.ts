"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE, ACCESS_MAX_AGE, accessToken, codeIsCorrect, safeNext } from "@/lib/access";

export async function unlock(formData: FormData) {
  const next = safeNext(String(formData.get("next") ?? ""));
  const code = String(formData.get("code") ?? "");
  if (!(await codeIsCorrect(code))) {
    redirect(`/access?error=1&next=${encodeURIComponent(next)}`);
  }
  const token = await accessToken();
  (await cookies()).set(ACCESS_COOKIE, token!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_MAX_AGE,
  });
  redirect(next);
}
