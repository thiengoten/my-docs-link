import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CustomerFormDialog } from "@/components/customer-form-dialog";
import { DeleteCustomerButton } from "@/components/delete-customer-button";
import { DealFormDialog } from "@/components/deal-form-dialog";
import { DealListItem } from "@/components/deal-list-item";
import { EmptyState } from "@/components/ui/empty-state";
import { Handshake } from "lucide-react";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (!customer) {
    notFound();
  }

  const [{ data: deals }, { data: projects }] = await Promise.all([
    supabase
      .from("deals")
      .select("*")
      .eq("customer_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("projects").select("id, name").order("name", { ascending: true }),
  ]);

  const projectById = new Map((projects ?? []).map((p) => [p.id, p]));
  const linkedProjectIds = new Set((deals ?? []).map((d) => d.project_id));
  const availableProjects = (projects ?? []).filter((p) => !linkedProjectIds.has(p.id));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/customers" className="text-caption text-slate hover:text-ink">
          ← Danh sách khách hàng
        </Link>
      </div>

      <div className="flex flex-col gap-4 rounded-md border border-line bg-paper-raised p-6 shadow-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-title font-bold text-ink">{customer.name}</h1>
          {customer.phone && (
            <p className="mt-1 font-data text-data text-slate">{customer.phone}</p>
          )}
          {customer.email && <p className="text-body text-slate">{customer.email}</p>}
          {customer.notes && <p className="mt-3 text-body text-ink-soft">{customer.notes}</p>}
        </div>
        <div className="flex gap-2">
          <CustomerFormDialog mode="edit" customer={customer} />
          <DeleteCustomerButton customerId={customer.id} dealCount={deals?.length ?? 0} />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-subtitle font-semibold text-ink">
            Dự án quan tâm
          </h2>
          <DealFormDialog customerId={customer.id} projects={availableProjects} />
        </div>

        {!deals?.length && (
          <EmptyState
            icon={Handshake}
            title="Chưa có dự án quan tâm"
            description="Liên kết khách hàng này với một dự án để bắt đầu theo dõi giai đoạn."
          />
        )}

        <div className="space-y-3">
          {deals?.map((deal) => {
            const project = projectById.get(deal.project_id);
            if (!project) return null;
            return <DealListItem key={deal.id} deal={deal} project={project} />;
          })}
        </div>
      </div>
    </div>
  );
}
