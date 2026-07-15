import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectFormDialog } from "@/components/project-form-dialog";
import { DeleteProjectButton } from "@/components/delete-project-button";
import { GooglePickerButton } from "@/components/google-picker-button";
import { DocumentList } from "@/components/document-list";
import { FieldError } from "@/components/ui/input";
import type { ProjectStatus } from "@/types/database";

const GOOGLE_ERROR_LABEL: Record<string, string> = {
  invalid_state: "Phiên kết nối Google không hợp lệ, vui lòng thử lại.",
  access_denied: "Bạn đã từ chối cấp quyền truy cập Google Drive.",
};

const STATUS_LABEL: Record<ProjectStatus, string> = {
  planning: "Đang triển khai",
  construction: "Đang thi công",
  active: "Đang mở bán",
  handover: "Đang bàn giao",
  completed: "Hoàn thành",
  on_hold: "Tạm dừng",
};

const STATUS_CLASS: Record<ProjectStatus, string> = {
  planning: "border border-line bg-paper text-ink-soft",
  construction: "bg-amber-soft text-amber",
  active: "bg-jade-soft text-jade",
  handover: "bg-ink text-paper-raised",
  completed: "bg-line text-slate",
  on_hold: "bg-stamp-soft text-stamp",
};

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ google_error?: string }>;
}) {
  const { id } = await params;
  const { google_error } = await searchParams;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (!project) {
    notFound();
  }

  const [{ data: documents }, { count: shareLinkCount }] = await Promise.all([
    supabase
      .from("documents")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("share_links")
      .select("id", { count: "exact", head: true })
      .eq("project_id", id)
      .eq("revoked", false),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/projects" className="text-caption text-slate hover:text-ink">
          ← Danh sách dự án
        </Link>
      </div>

      <div className="flex flex-col gap-4 rounded-md border border-line bg-paper-raised p-6 shadow-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-title font-bold text-ink">{project.name}</h1>
            <span
              className={`rounded-sm px-2 py-0.5 text-label font-display uppercase tracking-wide ${STATUS_CLASS[project.status]}`}
            >
              {STATUS_LABEL[project.status] ?? project.status}
            </span>
          </div>
          {project.developer && (
            <p className="mt-1 text-body text-slate">Chủ đầu tư: {project.developer}</p>
          )}
          {project.location && <p className="text-body text-slate">Địa điểm: {project.location}</p>}
          {project.notes && <p className="mt-3 text-body text-ink-soft">{project.notes}</p>}
        </div>
        <div className="flex gap-2">
          <ProjectFormDialog mode="edit" project={project} />
          <DeleteProjectButton
            projectId={project.id}
            documentCount={documents?.length ?? 0}
            shareLinkCount={shareLinkCount ?? 0}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Link
          href={`/dashboard/projects/${project.id}/legal-timeline`}
          className="flex h-11 items-center rounded-md border border-line px-4 text-body text-ink hover:bg-paper-raised"
        >
          Xem timeline pháp lý
        </Link>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-subtitle font-semibold text-ink">Tài liệu</h2>
          <GooglePickerButton projectId={project.id} />
        </div>

        {google_error && (
          <FieldError>
            {GOOGLE_ERROR_LABEL[google_error] ?? "Kết nối Google Drive thất bại, vui lòng thử lại."}
          </FieldError>
        )}

        <DocumentList documents={documents ?? []} />
      </div>
    </div>
  );
}
