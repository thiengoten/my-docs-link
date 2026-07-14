"use client";

import { useState, useTransition } from "react";
import { revokeShareLink } from "@/lib/actions/share-links";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function RevokeShareLinkButton({ linkId }: { linkId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await revokeShareLink(linkId);
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
        Thu hồi
      </button>
      <ConfirmDialog
        open={open}
        title="Thu hồi link chia sẻ?"
        description="Link cũ sẽ ngừng hoạt động ngay lập tức và không thể khôi phục. Bất kỳ ai đang giữ link này sẽ không truy cập được nữa."
        confirmLabel="Thu hồi"
        pending={pending}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
