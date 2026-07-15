"use client";

import { useActionState, useRef, useState } from "react";
import { createProject, updateProject } from "@/lib/actions/projects";
import type { Project, ProjectStatus } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/input";
import { sheetDialogClass, SheetHandle } from "@/components/ui/sheet";

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "planning", label: "Đang triển khai" },
  { value: "construction", label: "Đang thi công" },
  { value: "active", label: "Đang mở bán" },
  { value: "handover", label: "Đang bàn giao" },
  { value: "completed", label: "Hoàn thành" },
  { value: "on_hold", label: "Tạm dừng" },
];

export function ProjectFormDialog({
  mode,
  project,
}: {
  mode: "create" | "edit";
  project?: Project;
}) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const action = mode === "create" ? createProject : updateProject.bind(null, project!.id);
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
        {mode === "create" ? "Tạo dự án" : "Sửa dự án"}
      </Button>

      <dialog ref={dialogRef} onClose={() => setOpen(false)} className={sheetDialogClass}>
        {open && (
          <>
            <SheetHandle />
            <form action={formAction} className="space-y-4 p-6">
              <h2 className="font-display text-title font-bold text-ink">
                {mode === "create" ? "Tạo dự án mới" : "Sửa thông tin dự án"}
              </h2>

              <div className="space-y-1">
                <Label>Tên dự án</Label>
                <Input name="name" required defaultValue={project?.name} />
              </div>

              <div className="space-y-1">
                <Label>Chủ đầu tư</Label>
                <Input name="developer" defaultValue={project?.developer ?? ""} />
              </div>

              <div className="space-y-1">
                <Label>Địa điểm</Label>
                <Input name="location" defaultValue={project?.location ?? ""} />
              </div>

              <div className="space-y-1">
                <Label>Trạng thái</Label>
                <Select name="status" defaultValue={project?.status ?? "active"}>
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Ghi chú</Label>
                <Textarea name="notes" rows={3} defaultValue={project?.notes ?? ""} />
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
