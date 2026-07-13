"use client";

import { useTransition } from "react";
import { revokeShareLink } from "@/lib/actions/share-links";

export function RevokeShareLinkButton({ linkId }: { linkId: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const confirmed = window.confirm("Thu hồi link chia sẻ này? Link cũ sẽ không truy cập được nữa.");
    if (!confirmed) return;
    startTransition(() => revokeShareLink(linkId));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="text-caption text-stamp hover:text-stamp/80 disabled:opacity-40"
    >
      {pending ? "Đang thu hồi..." : "Thu hồi"}
    </button>
  );
}
