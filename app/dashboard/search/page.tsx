import { createClient } from "@/lib/supabase/server";
import { SearchClient } from "@/components/search-client";

export default async function SearchPage() {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .order("name", { ascending: true });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-title font-bold text-ink">Tìm kiếm tài liệu</h1>
      <SearchClient projects={projects ?? []} />
    </div>
  );
}
