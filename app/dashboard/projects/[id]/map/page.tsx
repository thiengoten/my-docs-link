import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MapEditor } from "@/components/map/map-editor";

export default async function ProjectMapPage({
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

  const { data: projectMap } = await supabase
    .from("project_maps")
    .select("*")
    .eq("project_id", id)
    .maybeSingle();

  return (
    <div className="space-y-4">
      <div>
        <Link href={`/dashboard/projects/${id}`} className="text-caption text-slate hover:text-ink">
          ← {project.name}
        </Link>
      </div>
      <h1 className="font-display text-title font-bold text-ink">Bản đồ vùng đất</h1>
      <MapEditor projectId={id} projectName={project.name} initialMap={projectMap ?? null} />
    </div>
  );
}
