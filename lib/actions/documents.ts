"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getValidAccessToken } from "@/lib/google/oauth";
import { getDriveFileMetadata, downloadDriveFile } from "@/lib/google/drive";
import { extractPdfText } from "@/lib/pdf";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, DocType, DocumentStatus } from "@/types/database";

export interface DocumentFormState {
  error: string | null;
}

// Best-effort: PDF text extraction failing (unsupported file type, quota,
// missing Drive connection) must never block the document from being saved.
async function extractAndStoreText(
  supabase: SupabaseClient<Database>,
  userId: string,
  documentId: string,
  driveFileId: string
) {
  try {
    const accessToken = await getValidAccessToken(supabase, userId);
    if (!accessToken) return;

    const { mimeType } = await getDriveFileMetadata(accessToken, driveFileId);
    if (mimeType !== "application/pdf") return;

    const buffer = await downloadDriveFile(accessToken, driveFileId);
    const text = await extractPdfText(buffer);

    await supabase.from("documents").update({ extracted_text_raw: text }).eq("id", documentId);
  } catch {
    // ignore — document search still works via file_name/note
  }
}

export async function createDocument(
  projectId: string,
  file: { id: string; name: string; webViewLink?: string },
  docType: DocType,
  documentDate?: string | null
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .insert({
      project_id: projectId,
      drive_file_id: file.id,
      drive_web_view_link: file.webViewLink ?? null,
      file_name: file.name,
      doc_type: docType,
      document_date: documentDate?.trim() || null,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await extractAndStoreText(supabase, user.id, data.id, file.id);
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { error: null };
}

export async function updateDocument(
  documentId: string,
  projectId: string,
  _prevState: DocumentFormState,
  formData: FormData
): Promise<DocumentFormState> {
  const doc_type = String(formData.get("doc_type") ?? "other") as DocType;
  const status = String(formData.get("status") ?? "active") as DocumentStatus;
  const note = String(formData.get("note") ?? "").trim() || null;
  const document_date = String(formData.get("document_date") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("documents")
    .update({ doc_type, status, note, document_date })
    .eq("id", documentId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { error: null };
}

export async function supersedeDocument(
  documentId: string,
  projectId: string,
  _prevState: DocumentFormState,
  formData: FormData
): Promise<DocumentFormState> {
  const supersededBy = String(formData.get("superseded_by") ?? "").trim();
  if (!supersededBy) {
    return { error: "Vui lòng chọn tài liệu thay thế." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("documents")
    .update({ status: "superseded", superseded_by: supersededBy })
    .eq("id", documentId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/projects/${projectId}/legal-timeline`);
  revalidatePath(`/dashboard/projects/${projectId}`);
  return { error: null };
}

export async function deleteDocument(documentId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("documents").delete().eq("id", documentId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
}
