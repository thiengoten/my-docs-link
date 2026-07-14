import Link from "next/link";
import { FileText } from "lucide-react";
import type { Document } from "@/types/database";
import { DocumentEditDialog } from "@/components/document-edit-dialog";
import { DeleteDocumentButton } from "@/components/delete-document-button";
import { DocTypeBadge, StatusBadge } from "@/components/ui/badge";
import { VerificationStamp } from "@/components/ui/verification-stamp";
import { EmptyState } from "@/components/ui/empty-state";

export function DocumentList({ documents }: { documents: Document[] }) {
  if (documents.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Chưa có tài liệu nào"
        description={'Bấm "+ Thêm tài liệu từ Drive" để bắt đầu.'}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {documents.map((doc) => {
        const isVerifiedLegal = doc.doc_type === "legal" && doc.status === "active";
        return (
          <div
            key={doc.id}
            className="relative min-h-11 rounded-md border border-line bg-paper-raised p-4 shadow-1"
          >
            <div className="flex items-start justify-between">
              <FileText size={20} strokeWidth={1.75} className="text-ink-soft" aria-hidden />
              {isVerifiedLegal && <VerificationStamp documentId={doc.id} />}
            </div>

            <Link
              href={`/dashboard/projects/${doc.project_id}/documents/${doc.id}`}
              className="static after:absolute after:inset-0"
            >
              <p className="mt-2 truncate font-display text-subtitle font-semibold text-ink">
                {doc.file_name}
              </p>
            </Link>

            <div className="mt-1 flex flex-wrap items-center gap-2">
              <DocTypeBadge type={doc.doc_type} />
              {!isVerifiedLegal && <StatusBadge status={doc.status} />}
            </div>

            {doc.note && <p className="mt-2 truncate text-body text-ink-soft">{doc.note}</p>}

            <p className="mt-2 font-data text-data text-slate">
              {doc.document_date && `${doc.document_date} · `}
              {doc.file_name}
            </p>

            <div className="relative z-10 mt-3 flex items-center gap-3">
              <DocumentEditDialog document={doc} />
              <DeleteDocumentButton
                documentId={doc.id}
                projectId={doc.project_id}
                fileName={doc.file_name}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
