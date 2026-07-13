"use client";

import { useTransition } from "react";
import { deleteProject } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const confirmed = window.confirm(
      "Xóa dự án này sẽ xóa toàn bộ liên kết tài liệu, link chia sẻ và lịch sử pháp lý liên quan. Bạn có chắc chắn muốn xóa?"
    );
    if (!confirmed) return;
    startTransition(() => deleteProject(projectId));
  }

  return (
    <Button variant="destructive" size="sm" loading={pending} onClick={handleClick}>
      {pending ? "Đang xóa..." : "Xóa dự án"}
    </Button>
  );
}
