import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getValidAccessToken } from "@/lib/google/oauth";

// Returns a short-lived Google access token for the Picker UI. Never exposes
// the refresh token to the client.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  try {
    const accessToken = await getValidAccessToken(supabase, user.id);

    if (!accessToken) {
      return NextResponse.json({ error: "not_connected" }, { status: 404 });
    }

    return NextResponse.json({ accessToken });
  } catch {
    // Refresh token was revoked on Google's side (or otherwise invalid) —
    // drop the stale row so the user gets a clean "connect" prompt instead
    // of a dead-end 500 on every picker open.
    await supabase.from("google_auth_tokens").delete().eq("user_id", user.id);
    return NextResponse.json({ error: "not_connected" }, { status: 404 });
  }
}
