"use client";

import { useActionState, useRef, useState } from "react";
import { supersedeDocument } from "@/lib/actions/documents";
import type { Document } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Label, Select, FieldError } from "@/components/ui/input";
import { sheetDialogClass, SheetHandle } from "@/components/ui/sheet";

export function SupersedeDocumentDialog({
  document,
  candidates,
}: {
  document: Document;
  candidates: Pick<Document, "id" | "file_name" | "document_date">[];
}) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const action = supersedeDocument.bind(null, document.id, document.project_id);
  const [state, formAction, pending] = useActionState(action, { error: null });

  function openDialog() {
    setOpen(true);
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    setOpen(false);
    dialogRef.current?.close();
  }

  if (candidates.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="text-caption text-ink-soft hover:text-ink"
      >
        Đánh dấu hết hiệu lực
      </button>

      <dialog ref={dialogRef} onClose={() => setOpen(false)} className={sheetDialogClass}>
        {open && (
          <>
            <SheetHandle />
            <form action={formAction} className="space-y-4 p-6">
              <div>
                <h2 className="font-display text-title font-bold text-ink">
                  Đánh dấu tài liệu hết hiệu lực
                </h2>
                <p className="text-caption text-slate">{document.file_name}</p>
              </div>

              <div className="space-y-1">
                <Label>Thay thế bởi</Label>
                <Select name="superseded_by" defaultValue="">
                  <option value="" disabled>
                    Chọn tài liệu thay thế
                  </option>
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.file_name}
                      {c.document_date ? ` · ${c.document_date}` : ""}
                    </option>
                  ))}
                </Select>
              </div>

              {state.error && <FieldError>{state.error}</FieldError>}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={closeDialog}>
                  Hủy
                </Button>
                <Button type="submit" loading={pending}>
                  {pending ? "Đang lưu..." : "Xác nhận"}
                </Button>
              </div>
            </form>
          </>
        )}
      </dialog>
    </>
  );
}
