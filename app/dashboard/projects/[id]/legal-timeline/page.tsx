import Link from "next/link";
import { Stamp } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { VerificationStamp } from "@/components/ui/verification-stamp";
import { SupersedeDocumentDialog } from "@/components/supersede-document-dialog";

export default async function LegalTimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!project) {
    notFound();
  }

  const { data: legalDocs } = await supabase
    .from("documents")
    .select("*")
    .eq("project_id", id)
    .eq("doc_type", "legal")
    .order("document_date", { ascending: false });

  return (
    <div className="space-y-6">
      <Link href={`/dashboard/projects/${id}`} className="text-caption text-slate hover:text-ink">
        ← {project.name}
      </Link>

      <h1 className="font-display text-title font-bold text-ink">
        Timeline pháp lý — {project.name}
      </h1>

      {!legalDocs?.length && (
        <EmptyState
          icon={Stamp}
          title="Chưa có tài liệu pháp lý nào"
          description="Gắn tài liệu loại pháp lý cho dự án này để theo dõi timeline hiệu lực."
        />
      )}

      {!!legalDocs?.length && (
        <ol className="space-y-5 border-l border-line pl-6">
          {legalDocs.map((doc) => {
            const active = doc.status === "active";
            const replacement = doc.superseded_by
              ? legalDocs.find((d) => d.id === doc.superseded_by)
              : null;
            const candidates = legalDocs.filter((d) => d.id !== doc.id);
            return (
              <li key={doc.id} className="relative">
                <span
                  aria-hidden
                  className={`absolute -left-[29px] top-1.5 h-2.5 w-2.5 rounded-full ${
                    active ? "bg-stamp" : "border border-slate bg-transparent"
                  }`}
                />
                <p className="font-data text-data text-slate">
                  {doc.document_date ?? "Chưa có ngày"}
                </p>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/projects/${id}/documents/${doc.id}`}
                    className="font-display text-subtitle font-semibold text-ink hover:underline"
                  >
                    {doc.file_name}
                  </Link>
                  {active && <VerificationStamp documentId={doc.id} />}
                </div>
                <p className="text-caption text-slate">
                  {active ? "Còn hiệu lực" : "Đã thay thế"}
                  {replacement && (
                    <>
                      {" · thay thế bởi "}
                      <Link
                        href={`/dashboard/projects/${id}/documents/${replacement.id}`}
                        className="text-ink underline"
                      >
                        {replacement.file_name}
                      </Link>
                    </>
                  )}
                </p>
                {active && (
                  <div className="mt-1">
                    <SupersedeDocumentDialog document={doc} candidates={candidates} />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
