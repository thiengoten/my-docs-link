"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProjectStatus } from "@/types/database";

export interface ProjectFormState {
  error: string | null;
}

function readProjectFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const developer = String(formData.get("developer") ?? "").trim() || null;
  const location = String(formData.get("location") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "active") as ProjectStatus;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const kuula_url = normalizeKuulaUrl(String(formData.get("kuula_url") ?? "").trim() || null);
  return { name, developer, location, status, notes, kuula_url };
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// Link dạng kuula.co/post/... là trang xem trên Kuula, bị chặn nhúng iframe.
// Chỉ kuula.co/share/... mới nhúng được, nên tự đổi path khi người dùng lỡ dán nhầm.
function normalizeKuulaUrl(value: string | null) {
  if (!value) return value;
  try {
    const url = new URL(value);
    if (url.hostname === "kuula.co" && url.pathname.startsWith("/post/")) {
      url.pathname = url.pathname.replace(/^\/post\//, "/share/");
      return url.toString();
    }
    return value;
  } catch {
    return value;
  }
}

export async function createProject(
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const fields = readProjectFields(formData);

  if (!fields.name) {
    return { error: "Tên dự án là bắt buộc." };
  }
  if (fields.kuula_url && !isValidHttpUrl(fields.kuula_url)) {
    return { error: "Link Kuula không hợp lệ." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("projects").insert(fields);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/projects");
  redirect("/dashboard/projects");
}

export async function updateProject(
  projectId: string,
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const fields = readProjectFields(formData);

  if (!fields.name) {
    return { error: "Tên dự án là bắt buộc." };
  }
  if (fields.kuula_url && !isValidHttpUrl(fields.kuula_url)) {
    return { error: "Link Kuula không hợp lệ." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update(fields)
    .eq("id", projectId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${projectId}`);
  redirect(`/dashboard/projects/${projectId}`);
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", projectId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/projects");
  redirect("/dashboard/projects");
}
