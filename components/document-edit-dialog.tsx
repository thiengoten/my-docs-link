"use client";

import { useActionState, useRef, useState } from "react";
import { updateDocument } from "@/lib/actions/documents";
import type { Document, DocType, DocumentStatus } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Label, Select, Input, Textarea, FieldError } from "@/components/ui/input";
import { sheetDialogClass, SheetHandle } from "@/components/ui/sheet";

const DOC_TYPE_OPTIONS: { value: DocType; label: string }[] = [
  { value: "legal", label: "Pháp lý" },
  { value: "pricing", label: "Bảng giá" },
  { value: "image", label: "Hình ảnh" },
  { value: "floor_plan", label: "Mặt bằng" },
  { value: "contract_template", label: "Hợp đồng mẫu" },
  { value: "other", label: "Khác" },
];

const STATUS_OPTIONS: { value: DocumentStatus; label: string }[] = [
  { value: "active", label: "Còn hiệu lực" },
  { value: "superseded", label: "Đã thay thế" },
  { value: "archived", label: "Lưu trữ" },
];

export function DocumentEditDialog({ document }: { document: Document }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const action = updateDocument.bind(null, document.id, document.project_id);
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
      <button
        type="button"
        onClick={openDialog}
        className="text-caption text-ink-soft hover:text-ink"
      >
        Sửa
      </button>

      <dialog ref={dialogRef} onClose={() => setOpen(false)} className={sheetDialogClass}>
        {open && (
          <>
            <SheetHandle />
            <form action={formAction} className="space-y-4 p-6">
              <div>
                <h2 className="font-display text-title font-bold text-ink">Sửa tài liệu</h2>
                <p className="text-caption text-slate">{document.file_name}</p>
              </div>

              <div className="space-y-1">
                <Label>Loại tài liệu</Label>
                <Select name="doc_type" defaultValue={document.doc_type}>
                  {DOC_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Trạng thái</Label>
                <Select name="status" defaultValue={document.status}>
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Ngày tài liệu</Label>
                <Input
                  type="date"
                  name="document_date"
                  defaultValue={document.document_date ?? ""}
                />
              </div>

              <div className="space-y-1">
                <Label>Ghi chú</Label>
                <Textarea name="note" rows={3} defaultValue={document.note ?? ""} />
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
