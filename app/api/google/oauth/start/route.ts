import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { getGoogleAuthUrl } from "@/lib/google/oauth";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const returnTo = request.nextUrl.searchParams.get("returnTo") ?? "/dashboard/projects";
  const csrf = randomBytes(16).toString("hex");
  const state = `${csrf}:${returnTo}`;

  const response = NextResponse.redirect(getGoogleAuthUrl(state));
  response.cookies.set("google_oauth_csrf", csrf, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
