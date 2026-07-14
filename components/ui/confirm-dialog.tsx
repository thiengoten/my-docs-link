"use client";

import { useEffect, useRef } from "react";
import { Button, type ButtonVariant } from "@/components/ui/button";
import { sheetDialogClass, SheetHandle } from "@/components/ui/sheet";

export function ConfirmDialog({
  open,
  title,
  description,
  details,
  confirmLabel,
  confirmVariant = "destructive",
  pending = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  details?: string[];
  confirmLabel: string;
  confirmVariant?: ButtonVariant;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={dialogRef} onClose={onCancel} className={sheetDialogClass}>
      {open && (
        <>
          <SheetHandle />
          <div className="space-y-4 p-6">
            <h2 className="font-display text-title font-bold text-ink">{title}</h2>
            <p className="text-body text-ink-soft">{description}</p>
            {!!details?.length && (
              <ul className="list-disc space-y-1 pl-5 text-caption text-ink-soft">
                {details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={onCancel} disabled={pending}>
                Hủy
              </Button>
              <Button
                type="button"
                variant={confirmVariant}
                loading={pending}
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
            </div>
          </div>
        </>
      )}
    </dialog>
  );
}
