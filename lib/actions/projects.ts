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
  return { name, developer, location, status, notes };
}

export async function createProject(
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const fields = readProjectFields(formData);

  if (!fields.name) {
    return { error: "Tên dự án là bắt buộc." };
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
