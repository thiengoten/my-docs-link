"use client";

import { useTransition } from "react";
import { deleteDocument } from "@/lib/actions/documents";

export function DeleteDocumentButton({
  documentId,
  projectId,
}: {
  documentId: string;
  projectId: string;
}) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const confirmed = window.confirm("Gỡ liên kết tài liệu này khỏi dự án?");
    if (!confirmed) return;
    startTransition(() => deleteDocument(documentId, projectId));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="text-caption text-stamp hover:text-stamp/80 disabled:opacity-40"
    >
      {pending ? "Đang xóa..." : "Xóa"}
    </button>
  );
}
