"use client";

import { useActionState, useRef, useState } from "react";
import { createCustomer, updateCustomer } from "@/lib/actions/customers";
import type { Customer } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, FieldError } from "@/components/ui/input";
import { sheetDialogClass, SheetHandle } from "@/components/ui/sheet";

export function CustomerFormDialog({
  mode,
  customer,
}: {
  mode: "create" | "edit";
  customer?: Customer;
}) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const action =
    mode === "create" ? createCustomer : updateCustomer.bind(null, customer!.id);
  const [state, formAction, pending] = useActionState(action, { error: null });

  function openDialog() {
    setOpen(true);
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    setOpen(false);
    dialogRef.current?.close();
  }

  return (
    <>
      <Button size="sm" onClick={openDialog}>
        {mode === "create" ? "Tạo khách hàng" : "Sửa khách hàng"}
      </Button>

      <dialog ref={dialogRef} onClose={() => setOpen(false)} className={sheetDialogClass}>
        {open && (
          <>
            <SheetHandle />
            <form action={formAction} className="space-y-4 p-6">
              <h2 className="font-display text-title font-bold text-ink">
                {mode === "create" ? "Tạo khách hàng mới" : "Sửa thông tin khách hàng"}
              </h2>

              <div className="space-y-1">
                <Label>Tên khách hàng</Label>
                <Input name="name" required defaultValue={customer?.name} />
              </div>

              <div className="space-y-1">
                <Label>Số điện thoại</Label>
                <Input name="phone" type="tel" defaultValue={customer?.phone ?? ""} />
              </div>

              <div className="space-y-1">
                <Label>Email</Label>
                <Input name="email" type="email" defaultValue={customer?.email ?? ""} />
              </div>

              <div className="space-y-1">
                <Label>Ghi chú</Label>
                <Textarea name="notes" rows={3} defaultValue={customer?.notes ?? ""} />
              </div>

              {state.error && <FieldError>{state.error}</FieldError>}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={closeDialog}>
                  Hủy
                </Button>
                <Button type="submit" loading={pending}>
                  {pending ? "Đang lưu..." : "Lưu"}
                </Button>
              </div>
            </form>
          </>
        )}
      </dialog>
    </>
  );
}
