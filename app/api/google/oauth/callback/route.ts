import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens, saveGoogleTokens } from "@/lib/google/oauth";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state") ?? "";
  const error = request.nextUrl.searchParams.get("error");
  const [csrf, returnTo = "/dashboard/projects"] = state.split(":");
  const expectedCsrf = request.cookies.get("google_oauth_csrf")?.value;

  const failureUrl = new URL(returnTo || "/dashboard/projects", request.url);

  if (error) {
    failureUrl.searchParams.set("google_error", error);
    return NextResponse.redirect(failureUrl);
  }

  if (!code || !csrf || csrf !== expectedCsrf) {
    failureUrl.searchParams.set("google_error", "invalid_state");
    return NextResponse.redirect(failureUrl);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    await saveGoogleTokens(supabase, user.id, tokens);
  } catch (err) {
    failureUrl.searchParams.set(
      "google_error",
      err instanceof Error ? err.message : "token_exchange_failed"
    );
    return NextResponse.redirect(failureUrl);
  }

  const response = NextResponse.redirect(new URL(returnTo || "/dashboard/projects", request.url));
  response.cookies.delete("google_oauth_csrf");
  return response;
}
