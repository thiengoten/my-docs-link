"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { upsertDeal } from "@/lib/actions/deals";
import type { Deal, DealStage } from "@/types/database";
import { DEAL_STAGE_LABEL } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label, Select, Textarea, FieldError } from "@/components/ui/input";
import { sheetDialogClass, SheetHandle } from "@/components/ui/sheet";

const STAGE_ORDER: DealStage[] = [
  "lead",
  "viewing",
  "deposit",
  "contract",
  "closed",
  "lost",
];

export function DealFormDialog({
  customerId,
  projects,
  deal,
  triggerLabel,
  triggerVariant = "primary",
  triggerSize = "sm",
}: {
  customerId: string;
  // Danh sách dự án có thể chọn. Ở chế độ sửa, dự án đã cố định nên chỉ cần
  // 1 phần tử (dự án hiện tại) để hiển thị tên.
  projects: { id: string; name: string }[];
  deal?: Deal;
  triggerLabel?: string;
  triggerVariant?: "primary" | "secondary";
  triggerSize?: "sm" | "md";
}) {
  const mode = deal ? "edit" : "add";
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const boundAction = upsertDeal.bind(null, customerId);
  const [state, formAction, pending] = useActionState(boundAction, { error: null });

  function openDialog() {
    setOpen(true);
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    setOpen(false);
    dialogRef.current?.close();
  }

  // upsertDeal không redirect (ở lại trang), nên tự đóng dialog khi 1 lần
  // submit hoàn tất mà không có lỗi.
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      closeDialog();
    }
    wasPending.current = pending;
  }, [pending, state.error]);

  const currentProject = deal
    ? projects.find((p) => p.id === deal.project_id)
    : undefined;

  return (
    <>
      <Button variant={triggerVariant} size={triggerSize} onClick={openDialog}>
        {triggerLabel ?? (mode === "edit" ? "Sửa" : "Thêm dự án quan tâm")}
      </Button>

      <dialog ref={dialogRef} onClose={() => setOpen(false)} className={sheetDialogClass}>
        {open && (
          <>
            <SheetHandle />
            <form action={formAction} className="space-y-4 p-6">
              <h2 className="font-display text-title font-bold text-ink">
                {mode === "edit" ? "Cập nhật liên kết dự án" : "Thêm dự án quan tâm"}
              </h2>

              <div className="space-y-1">
                <Label>Dự án</Label>
                {mode === "edit" ? (
                  <>
                    <input type="hidden" name="project_id" value={deal!.project_id} />
                    <p className="text-body text-ink">
                      {currentProject?.name ?? "Dự án"}
                    </p>
                  </>
                ) : projects.length ? (
                  <Select name="project_id" required defaultValue="">
                    <option value="" disabled>
                      Chọn dự án...
                    </option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <p className="text-caption text-slate">
                    Khách này đã được liên kết với tất cả dự án hiện có.
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label>Giai đoạn</Label>
                <Select name="stage" defaultValue={deal?.stage ?? "lead"}>
                  {STAGE_ORDER.map((stage) => (
                    <option key={stage} value={stage}>
                      {DEAL_STAGE_LABEL[stage]}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Ghi chú</Label>
                <Textarea name="note" rows={3} defaultValue={deal?.note ?? ""} />
              </div>

              {state.error && <FieldError>{state.error}</FieldError>}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={closeDialog}>
                  Hủy
                </Button>
                <Button
                  type="submit"
                  loading={pending}
                  disabled={mode === "add" && projects.length === 0}
                >
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
