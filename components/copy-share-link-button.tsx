"use client";

import { useState } from "react";

export function CopyShareLinkButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    const url = `${window.location.origin}/share/${token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-caption text-ink-soft hover:text-ink"
    >
      {copied ? "Đã sao chép!" : "Sao chép link"}
    </button>
  );
}
