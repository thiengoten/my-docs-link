"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createShareLink } from "@/lib/actions/share-links";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, FieldError } from "@/components/ui/input";
import { sheetDialogClass, SheetHandle } from "@/components/ui/sheet";

type ProjectOption = {
  id: string;
  name: string;
  documents: { id: string; file_name: string }[];
};

export function ShareLinkFormDialog({ projects }: { projects: ProjectOption[] }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [projectId, setProjectId] = useState("");
  const [state, formAction, pending] = useActionState(createShareLink, { error: null });

  const selectedProject = projects.find((p) => p.id === projectId);

  function openDialog() {
    setOpen(true);
    setProjectId("");
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    setOpen(false);
    dialogRef.current?.close();
  }

  useEffect(() => {
    if (state.success) {
      closeDialog();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  if (projects.length === 0) return null;

  return (
    <>
      <Button size="sm" onClick={openDialog}>
        Tạo link chia sẻ
      </Button>

      <dialog ref={dialogRef} onClose={() => setOpen(false)} className={sheetDialogClass}>
        {open && (
          <>
            <SheetHandle />
            <form action={formAction} className="space-y-4 p-6">
              <h2 className="font-display text-title font-bold text-ink">Tạo link chia sẻ</h2>

              <div className="space-y-1">
                <Label>Dự án</Label>
                <Select
                  name="project_id"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Chọn dự án
                  </option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </div>

              {selectedProject && selectedProject.documents.length > 0 && (
                <div className="space-y-1">
                  <Label>Tài liệu (bỏ trống = chia sẻ toàn bộ dự án)</Label>
                  <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-md border border-line p-2">
                    {selectedProject.documents.map((doc) => (
                      <label key={doc.id} className="flex items-center gap-2 text-body text-ink">
                        <input type="checkbox" name="document_ids" value={doc.id} />
                        {doc.file_name}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <Label>Hết hạn (tùy chọn)</Label>
                <Input type="date" name="expires_at" />
              </div>

              {state.error && <FieldError>{state.error}</FieldError>}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={closeDialog}>
                  Hủy
                </Button>
                <Button type="submit" loading={pending}>
                  {pending ? "Đang tạo..." : "Tạo link"}
                </Button>
              </div>
            </form>
          </>
        )}
      </dialog>
    </>
  );
}
