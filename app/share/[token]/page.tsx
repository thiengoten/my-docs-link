import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { DocTypeBadge, StatusBadge } from "@/components/ui/badge";
import { VerificationStamp } from "@/components/ui/verification-stamp";

const STATUS_LABEL: Record<string, string> = {
  planning: "Đang triển khai",
  construction: "Đang thi công",
  active: "Đang mở bán",
  handover: "Đang bàn giao",
  completed: "Hoàn thành",
  on_hold: "Tạm dừng",
};

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: linkRows } = await supabase.rpc("get_share_link_by_token", { p_token: token });
  const link = linkRows?.[0];

  if (!link) {
    return (
      <div className="flex flex-1 items-center justify-center bg-paper px-4">
        <div className="max-w-md text-center text-body text-slate">
          Link chia sẻ không hợp lệ, đã bị thu hồi, hoặc đã hết hạn.
        </div>
      </div>
    );
  }

  const [{ data: projectRows }, { data: documents }] = await Promise.all([
    supabase.rpc("get_shared_project", { p_token: token }),
    supabase.rpc("get_shared_documents", { p_token: token }),
  ]);
  const project = projectRows?.[0];

  if (!project) {
    return (
      <div className="flex flex-1 items-center justify-center bg-paper px-4">
        <div className="max-w-md text-center text-body text-slate">
          Không tìm thấy dự án được chia sẻ.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8 lg:py-12">
      <div className="rounded-md border border-line bg-paper-raised p-6 shadow-1">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-title font-bold text-ink">{project.name}</h1>
          <span className="rounded-sm bg-line px-2 py-0.5 text-label font-display uppercase tracking-wide text-slate">
            {STATUS_LABEL[project.status] ?? project.status}
          </span>
        </div>
        {project.developer && (
          <p className="mt-1 text-body text-slate">Chủ đầu tư: {project.developer}</p>
        )}
        {project.location && <p className="text-body text-slate">Địa điểm: {project.location}</p>}
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-subtitle font-semibold text-ink">Tài liệu</h2>

        {!documents?.length && (
          <EmptyState
            icon={FileText}
            title="Chưa có tài liệu nào"
            description="Dự án này chưa có tài liệu để hiển thị."
          />
        )}

        {!!documents?.length && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {documents.map((doc) => {
              const isVerifiedLegal = doc.doc_type === "legal" && doc.status === "active";
              return (
                <a
                  key={doc.id}
                  href={
                    doc.drive_web_view_link ??
                    `https://drive.google.com/file/d/${doc.drive_file_id}/view`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-md border border-line bg-paper-raised p-4 shadow-1 hover:bg-paper"
                >
                  <div className="flex items-start justify-between">
                    <FileText size={20} strokeWidth={1.75} className="text-ink-soft" aria-hidden />
                    {isVerifiedLegal && <VerificationStamp documentId={doc.id} />}
                  </div>

                  <p className="mt-2 truncate font-display text-subtitle font-semibold text-ink">
                    {doc.file_name}
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <DocTypeBadge type={doc.doc_type} />
                    {!isVerifiedLegal && <StatusBadge status={doc.status} />}
                  </div>

                  {doc.note && <p className="mt-2 truncate text-body text-ink-soft">{doc.note}</p>}

                  {doc.document_date && (
                    <p className="mt-2 font-data text-data text-slate">{doc.document_date}</p>
                  )}
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
