"use client";

import { useState, useTransition } from "react";
import { deleteProject } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DeleteProjectButton({
  projectId,
  documentCount = 0,
  shareLinkCount = 0,
}: {
  projectId: string;
  documentCount?: number;
  shareLinkCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await deleteProject(projectId);
      setOpen(false);
    });
  }

  const details = [
    `${documentCount} tài liệu sẽ bị gỡ liên kết`,
    `${shareLinkCount} link chia sẻ sẽ bị thu hồi`,
    "Toàn bộ lịch sử pháp lý liên quan sẽ bị xóa",
  ];

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        Xóa dự án
      </Button>
      <ConfirmDialog
        open={open}
        title="Xóa dự án này?"
        description="Hành động này không thể hoàn tác. Khi xóa, những dữ liệu sau cũng mất theo:"
        details={details}
        confirmLabel="Xóa dự án"
        pending={pending}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
