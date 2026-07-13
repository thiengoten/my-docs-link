"use client";

import { useState } from "react";
import { VerificationStamp } from "@/components/ui/verification-stamp";
import { Button } from "@/components/ui/button";

export default function StampDemoPage() {
  const [key, setKey] = useState(0);

  function replay() {
    sessionStorage.removeItem(`stamp-seen-demo-${key}`);
    setKey((k) => k + 1);
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-paper p-8">
      <div className="rounded-md border border-line bg-paper-raised p-8 shadow-1">
        <div className="flex items-center gap-3">
          <span className="font-display text-subtitle font-semibold text-ink">
            legal-2026-08.pdf
          </span>
          <VerificationStamp key={key} documentId={`demo-${key}`} />
        </div>
      </div>
      <Button onClick={replay}>Xem lại animation đóng dấu</Button>
    </div>
  );
}
