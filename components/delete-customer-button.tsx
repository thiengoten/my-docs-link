"use client";

import { useState, useTransition } from "react";
import { deleteCustomer } from "@/lib/actions/customers";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DeleteCustomerButton({
  customerId,
  dealCount = 0,
}: {
  customerId: string;
  dealCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await deleteCustomer(customerId);
      setOpen(false);
    });
  }

  const details = [
    `${dealCount} liên kết dự án của khách này sẽ bị xóa`,
    "Thông tin liên hệ và ghi chú sẽ bị xóa vĩnh viễn",
  ];

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        Xóa khách hàng
      </Button>
      <ConfirmDialog
        open={open}
        title="Xóa khách hàng này?"
        description="Hành động này không thể hoàn tác. Khi xóa, những dữ liệu sau cũng mất theo:"
        details={details}
        confirmLabel="Xóa khách hàng"
        pending={pending}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
