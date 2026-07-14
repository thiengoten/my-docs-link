"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ShareLinkFormState {
  error: string | null;
  success?: boolean;
}

export async function createShareLink(
  _prevState: ShareLinkFormState,
  formData: FormData
): Promise<ShareLinkFormState> {
  const projectId = String(formData.get("project_id") ?? "").trim();
  if (!projectId) {
    return { error: "Vui lòng chọn dự án." };
  }

  const documentIds = formData.getAll("document_ids").map(String).filter(Boolean);
  const expiresAtRaw = String(formData.get("expires_at") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase.from("share_links").insert({
    project_id: projectId,
    token: randomBytes(16).toString("hex"),
    document_ids: documentIds.length > 0 ? documentIds : null,
    expires_at: expiresAtRaw ? new Date(expiresAtRaw).toISOString() : null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/share-links");
  return { error: null, success: true };
}

export async function revokeShareLink(linkId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("share_links")
    .update({ revoked: true })
    .eq("id", linkId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/share-links");
}
