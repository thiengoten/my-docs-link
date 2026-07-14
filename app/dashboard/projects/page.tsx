import Link from "next/link";
import { Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProjectFormDialog } from "@/components/project-form-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { DOC_TYPE_LABEL } from "@/components/ui/badge";
import type { DocType, ProjectStatus } from "@/types/database";

const STATUS_LABEL: Record<ProjectStatus, string> = {
  active: "Đang hoạt động",
  completed: "Hoàn thành",
  on_hold: "Tạm dừng",
};

const STATUS_CLASS: Record<ProjectStatus, string> = {
  active: "bg-jade-soft text-jade",
  on_hold: "bg-amber-soft text-amber",
  completed: "bg-line text-slate",
};

export default async function ProjectsPage() {
  const supabase = await createClient();

  const [{ data: projects }, { data: documents }] = await Promise.all([
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase.from("documents").select("project_id, doc_type"),
  ]);

  const countsByProject = new Map<string, Map<DocType, number>>();
  for (const doc of documents ?? []) {
    const byType = countsByProject.get(doc.project_id) ?? new Map();
    byType.set(doc.doc_type, (byType.get(doc.doc_type) ?? 0) + 1);
    countsByProject.set(doc.project_id, byType);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-title font-bold text-ink">Dự án</h1>
        <ProjectFormDialog mode="create" />
      </div>

      {!projects?.length && (
        <EmptyState
          icon={Building2}
          title="Chưa có dự án nào"
          description="Tạo dự án đầu tiên để bắt đầu sắp xếp tài liệu."
        />
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {projects?.map((project) => {
          const byType = countsByProject.get(project.id);
          const countLine = byType?.size
            ? [...byType.entries()]
                .map(([type, count]) => `${count} ${DOC_TYPE_LABEL[type].toLowerCase()}`)
                .join(" · ")
            : "Chưa có tài liệu";

          return (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="block rounded-md border border-line bg-paper-raised p-4 shadow-1 transition hover:border-ink-soft"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-display text-title font-bold text-ink">{project.name}</h2>
                <span
                  className={`shrink-0 rounded-sm px-2 py-0.5 text-label font-display uppercase tracking-wide ${STATUS_CLASS[project.status]}`}
                >
                  {STATUS_LABEL[project.status] ?? project.status}
                </span>
              </div>
              {project.developer && (
                <p className="mt-1 text-caption text-slate">{project.developer}</p>
              )}
              {project.location && <p className="text-caption text-slate">{project.location}</p>}
              <p className="mt-3 font-data text-data text-slate">{countLine}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
