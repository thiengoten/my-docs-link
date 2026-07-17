"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Users, SearchX } from "lucide-react";
import { SearchBar } from "@/components/ui/search-bar";
import { EmptyState } from "@/components/ui/empty-state";

type CustomerRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  dealCount: number;
};

// Chỉ giữ chữ số để so khớp số điện thoại bất kể khoảng trắng, dấu chấm, +84...
function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function CustomerList({ customers }: { customers: CustomerRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    const qDigits = digitsOnly(q);
    return customers.filter((c) => {
      const byName = c.name.toLowerCase().includes(q);
      const byPhone =
        qDigits.length > 0 && c.phone
          ? digitsOnly(c.phone).includes(qDigits)
          : false;
      return byName || byPhone;
    });
  }, [customers, query]);

  if (!customers.length) {
    return (
      <EmptyState
        icon={Users}
        title="Chưa có khách hàng nào"
        description="Thêm khách hàng đầu tiên để bắt đầu quản lý mối quan hệ."
      />
    );
  }

  return (
    <div className="space-y-4">
      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Tìm theo tên hoặc số điện thoại..."
      />

      {!filtered.length && (
        <EmptyState
          icon={SearchX}
          title="Không tìm thấy khách hàng phù hợp"
          description="Thử từ khóa khác — tìm theo tên hoặc số điện thoại."
        />
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((customer) => (
          <Link
            key={customer.id}
            href={`/dashboard/customers/${customer.id}`}
            className="block rounded-md border border-line bg-paper-raised p-4 shadow-1 transition hover:border-ink-soft"
          >
            <h2 className="font-display text-title font-bold text-ink">{customer.name}</h2>
            {customer.phone && (
              <p className="mt-1 font-data text-data text-slate">{customer.phone}</p>
            )}
            {customer.email && <p className="text-caption text-slate">{customer.email}</p>}
            <p className="mt-3 font-data text-data text-slate">
              {customer.dealCount
                ? `${customer.dealCount} dự án quan tâm`
                : "Chưa có dự án quan tâm"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
