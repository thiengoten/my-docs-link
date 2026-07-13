import Link from "next/link";
import { Stamp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";

export default async function LegalOverviewPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .order("name", { ascending: true });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-title font-bold text-ink">Pháp lý</h1>

      {!projects?.length ? (
        <EmptyState
          icon={Stamp}
          title="Chưa có dự án nào"
          description="Tạo dự án để bắt đầu theo dõi timeline pháp lý."
        />
      ) : (
        <div className="divide-y divide-line rounded-md border border-line bg-paper-raised shadow-1">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}/legal-timeline`}
              className="flex h-11 items-center justify-between px-4 text-body text-ink hover:bg-paper"
            >
              {project.name}
              <span className="text-caption text-slate">Xem timeline →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
