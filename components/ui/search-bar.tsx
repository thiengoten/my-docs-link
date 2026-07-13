"use client";

import { Search, X } from "lucide-react";

export function SearchBar({
  value,
  onChange,
  placeholder = "Tìm theo tên file, ghi chú, nội dung PDF...",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative flex h-11 items-center rounded-md border border-line bg-paper-raised px-3 focus-within:border-ink">
      <Search size={18} strokeWidth={1.75} className="shrink-0 text-slate" aria-hidden />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="ml-2 h-full w-full bg-transparent text-body text-ink placeholder:text-slate focus:outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Xóa từ khóa"
          className="flex h-6 w-6 shrink-0 items-center justify-center text-slate hover:text-ink"
        >
          <X size={16} strokeWidth={1.75} />
        </button>
      )}
    </div>
  );
}
