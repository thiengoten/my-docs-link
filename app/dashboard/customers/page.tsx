import { createClient } from "@/lib/supabase/server";
import { CustomerFormDialog } from "@/components/customer-form-dialog";
import { CustomerList } from "@/components/customer-list";

export default async function CustomersPage() {
  const supabase = await createClient();

  const [{ data: customers }, { data: deals }] = await Promise.all([
    supabase.from("customers").select("*").order("created_at", { ascending: false }),
    supabase.from("deals").select("customer_id"),
  ]);

  const dealCountByCustomer = new Map<string, number>();
  for (const deal of deals ?? []) {
    dealCountByCustomer.set(
      deal.customer_id,
      (dealCountByCustomer.get(deal.customer_id) ?? 0) + 1
    );
  }

  const rows = (customers ?? []).map((customer) => ({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    dealCount: dealCountByCustomer.get(customer.id) ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-title font-bold text-ink">Khách hàng</h1>
        <CustomerFormDialog mode="create" />
      </div>

      <CustomerList customers={rows} />
    </div>
  );
}
