"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDocument } from "@/lib/actions/documents";
import type { DocType } from "@/types/database";
import { Button, buttonClasses } from "@/components/ui/button";
import { Select, Input, FieldError } from "@/components/ui/input";

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

const DOC_TYPE_OPTIONS: { value: DocType; label: string }[] = [
  { value: "legal", label: "Pháp lý" },
  { value: "pricing", label: "Bảng giá" },
  { value: "image", label: "Hình ảnh" },
  { value: "floor_plan", label: "Mặt bằng" },
  { value: "contract_template", label: "Mẫu hợp đồng" },
  { value: "other", label: "Khác" },
];

type PickedFile = { id: string; name: string; webViewLink?: string };

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

export function GooglePickerButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "not_connected" | "ready" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pickedFile, setPickedFile] = useState<PickedFile | null>(null);
  const [docType, setDocType] = useState<DocType>("other");
  const [documentDate, setDocumentDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function openPicker() {
    setStatus("loading");
    setErrorMessage(null);

    const tokenRes = await fetch("/api/google/token");
    if (tokenRes.status === 404) {
      setStatus("not_connected");
      return;
    }
    if (!tokenRes.ok) {
      setStatus("error");
      setErrorMessage("Không lấy được quyền truy cập Google Drive.");
      return;
    }
    const { accessToken } = await tokenRes.json();

    try {
      await loadScript("https://apis.google.com/js/api.js");
      await new Promise<void>((resolve) => window.gapi.load("picker", () => resolve()));

      const picker = new window.google.picker.PickerBuilder()
        .addView(window.google.picker.ViewId.DOCS)
        .setOAuthToken(accessToken)
        .setDeveloperKey(process.env.NEXT_PUBLIC_GOOGLE_API_KEY)
        .setCallback((data: any) => {
          if (data.action === window.google.picker.Action.PICKED) {
            const doc = data.docs[0];
            setPickedFile({ id: doc.id, name: doc.name, webViewLink: doc.url });
          }
          setStatus("ready");
        })
        .build();
      picker.setVisible(true);
      setStatus("ready");
    } catch {
      setStatus("error");
      setErrorMessage("Không tải được Google Picker.");
    }
  }

  async function confirmSave() {
    if (!pickedFile) return;
    setSaving(true);
    const { error } = await createDocument(
      projectId,
      pickedFile,
      docType,
      docType === "legal" ? documentDate : null
    );
    setSaving(false);
    if (error) {
      setErrorMessage(error);
      return;
    }
    setPickedFile(null);
    setDocType("other");
    setDocumentDate("");
    router.refresh();
  }

  if (status === "not_connected") {
    return (
      <div className="flex items-center gap-2">
        <a
          href={`/api/google/oauth/start?returnTo=/dashboard/projects/${projectId}`}
          className={buttonClasses("primary", "sm")}
        >
          Kết nối Google Drive
        </a>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="text-caption text-slate hover:text-ink"
        >
          Hủy
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Button size="sm" onClick={openPicker} loading={status === "loading"}>
        {status === "loading" ? "Đang mở Drive..." : "+ Thêm tài liệu từ Drive"}
      </Button>

      {errorMessage && <FieldError>{errorMessage}</FieldError>}

      {pickedFile && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-line bg-paper p-3">
          <span className="text-body text-ink">{pickedFile.name}</span>
          <Select
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocType)}
            className="h-9 w-auto"
          >
            {DOC_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          {docType === "legal" && (
            <Input
              type="date"
              value={documentDate}
              onChange={(e) => setDocumentDate(e.target.value)}
              className="h-9 w-auto"
            />
          )}
          <Button size="sm" onClick={confirmSave} loading={saving}>
            {saving ? "Đang lưu..." : "Lưu vào dự án"}
          </Button>
          <button
            type="button"
            onClick={() => setPickedFile(null)}
            className="text-caption text-slate hover:text-ink"
          >
            Hủy
          </button>
        </div>
      )}
    </div>
  );
}
