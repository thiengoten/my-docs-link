import { createClient } from "@/lib/supabase/server";
import { RelationshipGraph, type GraphEdge, type GraphNode } from "@/components/crm/relationship-graph";

export default async function GraphPage() {
  const supabase = await createClient();

  const [{ data: customers }, { data: projects }, { data: deals }, { data: documents }] =
    await Promise.all([
      supabase.from("customers").select("id, name"),
      supabase.from("projects").select("id, name"),
      supabase.from("deals").select("id, customer_id, project_id, stage"),
      supabase
        .from("documents")
        .select("id, project_id, file_name, drive_web_view_link, drive_file_id"),
    ]);

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Prefix ID theo loại để vừa tránh trùng vừa cho biết node thuộc lớp nào.
  for (const c of customers ?? []) {
    nodes.push({
      id: `c:${c.id}`,
      type: "customer",
      label: c.name,
      href: `/dashboard/customers/${c.id}`,
    });
  }
  for (const p of projects ?? []) {
    nodes.push({
      id: `p:${p.id}`,
      type: "project",
      label: p.name,
      href: `/dashboard/projects/${p.id}`,
    });
  }
  for (const d of documents ?? []) {
    nodes.push({
      id: `d:${d.id}`,
      type: "document",
      label: d.file_name,
      href:
        d.drive_web_view_link ??
        `https://drive.google.com/file/d/${d.drive_file_id}/view`,
      external: true,
    });
    edges.push({ source: `p:${d.project_id}`, target: `d:${d.id}`, kind: "doc" });
  }
  for (const deal of deals ?? []) {
    edges.push({
      source: `c:${deal.customer_id}`,
      target: `p:${deal.project_id}`,
      kind: "deal",
      stage: deal.stage,
    });
  }

  return (
    <div className="flex h-[calc(100dvh-8rem)] flex-col gap-4">
      <div>
        <h1 className="font-display text-title font-bold text-ink">Sơ đồ quan hệ</h1>
        <p className="text-caption text-slate">
          Khách hàng ↔ dự án (theo giai đoạn) và dự án ↔ tài liệu. Kéo để di chuyển, cuộn
          để phóng to, bấm vào một node để làm nổi các liên kết.
        </p>
      </div>
      <RelationshipGraph nodes={nodes} edges={edges} />
    </div>
  );
}
