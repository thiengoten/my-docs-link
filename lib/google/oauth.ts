import { google } from "googleapis";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { decryptToken, encryptToken } from "./crypto";

export const GOOGLE_DRIVE_SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/drive.file",
];

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getGoogleAuthUrl(state: string) {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // ensure a refresh_token is issued even on repeat consent
    scope: GOOGLE_DRIVE_SCOPES,
    state,
  });
}

export async function exchangeCodeForTokens(code: string) {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
    throw new Error(
      "Google did not return a refresh token. Revoke app access at https://myaccount.google.com/permissions and try connecting again."
    );
  }
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: new Date(tokens.expiry_date).toISOString(),
  };
}

export async function saveGoogleTokens(
  supabase: SupabaseClient<Database>,
  userId: string,
  tokens: { accessToken: string; refreshToken: string; expiresAt: string }
) {
  const { error } = await supabase.from("google_auth_tokens").upsert(
    {
      user_id: userId,
      encrypted_access_token: encryptToken(tokens.accessToken),
      encrypted_refresh_token: encryptToken(tokens.refreshToken),
      expires_at: tokens.expiresAt,
    },
    { onConflict: "user_id" }
  );
  if (error) throw new Error(error.message);
}

// Returns a valid (unencrypted) access token, refreshing via Google if the
// stored one is expired or about to expire. Persists the refreshed token.
export async function getValidAccessToken(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<string | null> {
  const { data: row } = await supabase
    .from("google_auth_tokens")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!row) return null;

  const expiresAt = new Date(row.expires_at).getTime();
  const isExpiringSoon = expiresAt - Date.now() < 60_000;

  if (!isExpiringSoon) {
    return decryptToken(row.encrypted_access_token);
  }

  const client = getOAuthClient();
  client.setCredentials({ refresh_token: decryptToken(row.encrypted_refresh_token) });
  const { credentials } = await client.refreshAccessToken();

  if (!credentials.access_token || !credentials.expiry_date) {
    throw new Error("Failed to refresh Google access token");
  }

  const newAccessToken = credentials.access_token;
  const newExpiresAt = new Date(credentials.expiry_date).toISOString();

  await supabase
    .from("google_auth_tokens")
    .update({
      encrypted_access_token: encryptToken(newAccessToken),
      expires_at: newExpiresAt,
    })
    .eq("user_id", userId);

  return newAccessToken;
}
