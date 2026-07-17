import Link from "next/link";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CustomerFormDialog } from "@/components/customer-form-dialog";
import { EmptyState } from "@/components/ui/empty-state";

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-title font-bold text-ink">Khách hàng</h1>
        <CustomerFormDialog mode="create" />
      </div>

      {!customers?.length && (
        <EmptyState
          icon={Users}
          title="Chưa có khách hàng nào"
          description="Thêm khách hàng đầu tiên để bắt đầu quản lý mối quan hệ."
        />
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {customers?.map((customer) => {
          const dealCount = dealCountByCustomer.get(customer.id) ?? 0;
          return (
            <Link
              key={customer.id}
              href={`/dashboard/customers/${customer.id}`}
              className="block rounded-md border border-line bg-paper-raised p-4 shadow-1 transition hover:border-ink-soft"
            >
              <h2 className="font-display text-title font-bold text-ink">{customer.name}</h2>
              {customer.phone && (
                <p className="mt-1 font-data text-data text-slate">{customer.phone}</p>
              )}
              {customer.email && <p className="text-caption text-slate">{customer.email}</p>}
              <p className="mt-3 font-data text-data text-slate">
                {dealCount ? `${dealCount} dự án quan tâm` : "Chưa có dự án quan tâm"}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
