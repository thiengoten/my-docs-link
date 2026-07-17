"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { DealStage } from "@/types/database";

export interface DealFormState {
  error: string | null;
}

const DEAL_STAGES: DealStage[] = [
  "lead",
  "viewing",
  "deposit",
  "contract",
  "closed",
  "lost",
];

// Thêm/sửa deal cho 1 khách: upsert theo cặp (customer_id, project_id).
export async function upsertDeal(
  customerId: string,
  _prevState: DealFormState,
  formData: FormData
): Promise<DealFormState> {
  const projectId = String(formData.get("project_id") ?? "").trim();
  const stage = String(formData.get("stage") ?? "lead") as DealStage;
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!projectId) {
    return { error: "Vui lòng chọn dự án." };
  }
  if (!DEAL_STAGES.includes(stage)) {
    return { error: "Giai đoạn không hợp lệ." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("deals")
    .upsert(
      { customer_id: customerId, project_id: projectId, stage, note },
      { onConflict: "customer_id,project_id" }
    );

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/customers/${customerId}`);
  revalidatePath("/dashboard/graph");
  return { error: null };
}

export async function updateDealStage(dealId: string, stage: DealStage) {
  if (!DEAL_STAGES.includes(stage)) {
    throw new Error("Giai đoạn không hợp lệ.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deals")
    .update({ stage })
    .eq("id", dealId)
    .select("customer_id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (data?.customer_id) {
    revalidatePath(`/dashboard/customers/${data.customer_id}`);
  }
  revalidatePath("/dashboard/graph");
}

export async function deleteDeal(dealId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deals")
    .delete()
    .eq("id", dealId)
    .select("customer_id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (data?.customer_id) {
    revalidatePath(`/dashboard/customers/${data.customer_id}`);
  }
  revalidatePath("/dashboard/graph");
}
