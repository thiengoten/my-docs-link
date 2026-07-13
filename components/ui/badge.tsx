import type { DocType, DocumentStatus } from "@/types/database";

export const DOC_TYPE_LABEL: Record<DocType, string> = {
  legal: "Pháp lý",
  pricing: "Bảng giá",
  image: "Hình ảnh",
  floor_plan: "Mặt bằng",
  contract_template: "Hợp đồng mẫu",
  other: "Khác",
};

const DOC_TYPE_CLASS: Record<DocType, string> = {
  legal: "bg-stamp-soft text-stamp",
  pricing: "bg-amber-soft text-amber",
  image: "bg-line text-ink-soft",
  floor_plan: "bg-line text-ink-soft",
  contract_template: "bg-jade-soft text-jade",
  other: "bg-line text-slate",
};

export function DocTypeBadge({ type }: { type: DocType }) {
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2 py-0.5 text-label font-display uppercase tracking-wide ${DOC_TYPE_CLASS[type]}`}
    >
      {DOC_TYPE_LABEL[type]}
    </span>
  );
}

export const STATUS_LABEL: Record<DocumentStatus, string> = {
  active: "Còn hiệu lực",
  superseded: "Đã thay thế",
  archived: "Lưu trữ",
};

const STATUS_DOT: Record<DocumentStatus, string> = {
  active: "bg-jade",
  superseded: "bg-slate",
  archived: "border border-line bg-transparent",
};

export function StatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-label font-display uppercase tracking-wide text-ink-soft ${
        status === "superseded" ? "line-through decoration-slate" : ""
      }`}
    >
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}
