"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { MapShape } from "@/types/database";

export async function saveProjectMap(
  projectId: string,
  data: { centerLat: number; centerLng: number; zoom: number; shapes: MapShape[] }
) {
  const supabase = await createClient();
  const { error } = await supabase.from("project_maps").upsert(
    {
      project_id: projectId,
      center_lat: data.centerLat,
      center_lng: data.centerLng,
      zoom: data.zoom,
      shapes: data.shapes,
    },
    { onConflict: "project_id" }
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/dashboard/projects/${projectId}/map`);
}
