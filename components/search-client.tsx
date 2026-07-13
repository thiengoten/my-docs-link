"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { SearchBar } from "@/components/ui/search-bar";
import { FilterChip } from "@/components/ui/filter-chip";
import { DocTypeBadge, StatusBadge, DOC_TYPE_LABEL } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Label } from "@/components/ui/input";
import type { DocType, Project, SearchResult } from "@/types/database";

const DOC_TYPE_OPTIONS: DocType[] = [
  "legal",
  "pricing",
  "image",
  "floor_plan",
  "contract_template",
  "other",
];

function Snippet({ text }: { text: string | null }) {
  if (!text) return null;
  const parts = text.split("§§");
  return (
    <p className="truncate text-body text-ink-soft">
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-ink">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}

export function SearchClient({ projects }: { projects: Pick<Project, "id" | "name">[] }) {
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [docType, setDocType] = useState<DocType | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);

  const hasFilters = Boolean(query || projectId || docType || dateFrom || dateTo);
  const hasDateFilter = Boolean(dateFrom || dateTo);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    if (projectId) p.set("project", projectId);
    if (docType) p.set("type", docType);
    if (dateFrom) p.set("from", dateFrom);
    if (dateTo) p.set("to", dateTo);
    return p;
  }, [query, projectId, docType, dateFrom, dateTo]);

  useEffect(() => {
    if (!hasFilters) {
      setResults([]);
      setSearched(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setResults(data.results ?? []);
      } catch {
        // aborted or network error — ignore, next keystroke will retry
      } finally {
        setLoading(false);
        setSearched(true);
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [params, hasFilters]);

  function clearFilters() {
    setQuery("");
    setProjectId(null);
    setDocType(null);
    setDateFrom("");
    setDateTo("");
    setShowDateFilter(false);
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 -mx-4 space-y-3 bg-paper px-4 pb-3 pt-1 lg:static lg:mx-0 lg:px-0">
        <SearchBar value={query} onChange={setQuery} />

        <div className="relative -mr-4">
          <div className="flex gap-2 overflow-x-auto pb-1 pr-8">
            {projects.map((p) => (
              <FilterChip
                key={p.id}
                label={p.name}
                active={projectId === p.id}
                onClick={() => setProjectId(projectId === p.id ? null : p.id)}
              />
            ))}
            {DOC_TYPE_OPTIONS.map((t) => (
              <FilterChip
                key={t}
                label={DOC_TYPE_LABEL[t]}
                active={docType === t}
                onClick={() => setDocType(docType === t ? null : t)}
              />
            ))}
            <FilterChip
              label={hasDateFilter ? "Khoảng thời gian ●" : "Khoảng thời gian"}
              active={showDateFilter || hasDateFilter}
              onClick={() => setShowDateFilter((v) => !v)}
            />
            {hasFilters && <FilterChip label="Xóa lọc" active={false} onClick={clearFilters} />}
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute right-0 top-0 h-9 w-8 bg-gradient-to-l from-paper to-transparent lg:hidden"
          />
        </div>
      </div>

      {showDateFilter && (
        <div className="flex flex-col gap-3 rounded-md border border-line bg-paper-raised p-3 sm:flex-row">
          <div className="flex-1 space-y-1">
            <Label>Từ ngày</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="flex-1 space-y-1">
            <Label>Đến ngày</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>
      )}

      {!hasFilters && (
        <EmptyState
          icon={SearchX}
          title="Bắt đầu tìm kiếm"
          description="Nhập từ khóa hoặc chọn bộ lọc để tìm tài liệu."
        />
      )}

      {hasFilters && !loading && searched && results.length === 0 && (
        <EmptyState
          icon={SearchX}
          title="Không tìm thấy tài liệu phù hợp"
          description="Thử từ khóa khác hoặc bỏ bớt bộ lọc."
        />
      )}

      {loading && (
        <div className="flex items-center gap-2 text-caption text-slate">
          <span
            aria-hidden
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
          Đang tìm kiếm...
        </div>
      )}

      <div className="space-y-3">
        {results.map((r) => {
          const isVerifiedLegal = r.doc_type === "legal" && r.status === "active";
          return (
            <Link
              key={r.id}
              href={`/dashboard/projects/${r.project_id}/documents/${r.id}`}
              className="block rounded-md border border-line bg-paper-raised p-4 shadow-1 hover:border-ink-soft"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-display text-subtitle font-semibold text-ink">
                  {r.file_name}
                </p>
                <span className="shrink-0 font-data text-data text-slate">{r.project_name}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <DocTypeBadge type={r.doc_type} />
                {!isVerifiedLegal && <StatusBadge status={r.status} />}
                {r.document_date && (
                  <span className="font-data text-data text-slate">{r.document_date}</span>
                )}
              </div>
              <div className="mt-2">
                <Snippet text={r.snippet} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
