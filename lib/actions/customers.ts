"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface CustomerFormState {
  error: string | null;
}

function readCustomerFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  return { name, phone, email, notes };
}

export async function createCustomer(
  _prevState: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  const fields = readCustomerFields(formData);

  if (!fields.name) {
    return { error: "Tên khách hàng là bắt buộc." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("customers").insert(fields);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/customers");
  redirect("/dashboard/customers");
}

export async function updateCustomer(
  customerId: string,
  _prevState: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  const fields = readCustomerFields(formData);

  if (!fields.name) {
    return { error: "Tên khách hàng là bắt buộc." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("customers")
    .update(fields)
    .eq("id", customerId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/customers");
  revalidatePath(`/dashboard/customers/${customerId}`);
  redirect(`/dashboard/customers/${customerId}`);
}

export async function deleteCustomer(customerId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("customers").delete().eq("id", customerId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard/graph");
  redirect("/dashboard/customers");
}
