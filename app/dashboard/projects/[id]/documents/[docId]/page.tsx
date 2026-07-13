import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DocumentEditDialog } from "@/components/document-edit-dialog";
import { DeleteDocumentButton } from "@/components/delete-document-button";
import { DocTypeBadge, StatusBadge } from "@/components/ui/badge";
import { VerificationStamp } from "@/components/ui/verification-stamp";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string; docId: string }>;
}) {
  const { id, docId } = await params;
  const supabase = await createClient();

  const { data: document } = await supabase
    .from("documents")
    .select("*")
    .eq("id", docId)
    .eq("project_id", id)
    .single();

  if (!document) {
    notFound();
  }

  const isVerifiedLegal = document.doc_type === "legal" && document.status === "active";

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/dashboard/projects/${id}`}
          className="text-caption text-slate hover:text-ink"
        >
          ← Quay lại dự án
        </Link>
      </div>

      <div className="flex flex-col gap-4 rounded-md border border-line bg-paper-raised p-6 shadow-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-title font-bold text-ink">{document.file_name}</h1>
            {isVerifiedLegal && <VerificationStamp documentId={document.id} />}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <DocTypeBadge type={document.doc_type} />
            {!isVerifiedLegal && <StatusBadge status={document.status} />}
            {document.document_date && (
              <span className="font-data text-data text-slate">{document.document_date}</span>
            )}
          </div>
          {document.note && <p className="mt-3 text-body text-ink-soft">{document.note}</p>}
        </div>
        <div className="flex items-center gap-3">
          <DocumentEditDialog document={document} />
          <DeleteDocumentButton documentId={document.id} projectId={id} />
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-line bg-paper-raised shadow-1">
        <iframe
          src={`https://drive.google.com/file/d/${document.drive_file_id}/preview`}
          className="h-[70vh] w-full"
          allow="autoplay"
        />
      </div>
    </div>
  );
}
