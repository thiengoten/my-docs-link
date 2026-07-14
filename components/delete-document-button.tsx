"use client";

import { useState, useTransition } from "react";
import { deleteDocument } from "@/lib/actions/documents";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DeleteDocumentButton({
  documentId,
  projectId,
  fileName,
}: {
  documentId: string;
  projectId: string;
  fileName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await deleteDocument(documentId, projectId);
      setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-caption text-stamp hover:text-stamp/80"
      >
        Xóa
      </button>
      <ConfirmDialog
        open={open}
        title="Gỡ tài liệu này?"
        description={
          fileName
            ? `"${fileName}" sẽ bị gỡ khỏi dự án. Link chia sẻ có chứa tài liệu này sẽ không còn hiển thị nó nữa.`
            : "Tài liệu sẽ bị gỡ khỏi dự án. Link chia sẻ có chứa tài liệu này sẽ không còn hiển thị nó nữa."
        }
        confirmLabel="Xóa tài liệu"
        pending={pending}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
