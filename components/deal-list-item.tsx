"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteDeal } from "@/lib/actions/deals";
import type { Deal } from "@/types/database";
import { DealStageBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DealFormDialog } from "@/components/deal-form-dialog";

export function DealListItem({
  deal,
  project,
}: {
  deal: Deal;
  project: { id: string; name: string };
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteDeal(deal.id);
      setConfirmOpen(false);
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-line bg-paper-raised p-4 shadow-1 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/dashboard/projects/${project.id}`}
            className="truncate font-display text-subtitle font-semibold text-ink hover:underline"
          >
            {project.name}
          </Link>
          <DealStageBadge stage={deal.stage} />
        </div>
        {deal.note && <p className="mt-1 text-caption text-ink-soft">{deal.note}</p>}
      </div>

      <div className="flex shrink-0 gap-2">
        <DealFormDialog
          customerId={deal.customer_id}
          projects={[project]}
          deal={deal}
          triggerVariant="secondary"
        />
        <Button variant="destructive" size="sm" onClick={() => setConfirmOpen(true)}>
          Xóa
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Xóa liên kết dự án?"
        description={`Gỡ liên kết giữa khách hàng và dự án "${project.name}". Hành động này không xóa dự án.`}
        confirmLabel="Xóa liên kết"
        pending={pending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
