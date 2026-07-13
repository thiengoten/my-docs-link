"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";

/**
 * "Con dấu xác thực" — chỉ dùng cho tài liệu pháp lý còn hiệu lực (DESIGN_SYSTEM.md mục 4).
 * Animation "đóng dấu" chỉ chạy một lần khi lần đầu người dùng thấy con dấu này trên thiết bị,
 * dùng sessionStorage để tránh lặp lại animation mỗi lần render/điều hướng qua lại.
 */
export function VerificationStamp({ documentId }: { documentId: string }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const key = `stamp-seen-${documentId}`;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      setAnimate(true);
    }
  }, [documentId]);

  return (
    <span
      role="img"
      aria-label="Còn hiệu lực"
      title="Còn hiệu lực"
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-dashed border-stamp text-stamp ${
        animate ? "animate-stamp-in" : ""
      }`}
    >
      <Check size={12} strokeWidth={2.5} aria-hidden />
    </span>
  );
}
