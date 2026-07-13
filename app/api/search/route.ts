import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { DocType } from "@/types/database";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const q = params.get("q")?.trim() || null;
  const project = params.get("project") || null;
  const type = (params.get("type") as DocType | null) || null;
  const from = params.get("from") || null;
  const to = params.get("to") || null;

  const { data, error } = await supabase.rpc("search_documents", {
    p_query: q,
    p_project_id: project,
    p_doc_type: type,
    p_date_from: from,
    p_date_to: to,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ results: data ?? [] });
}
