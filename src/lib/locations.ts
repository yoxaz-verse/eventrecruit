import "server-only";
import { createClient } from "@/lib/supabase/server";

export type LocationOption = { id: string; name: string; state_name: string; country_name: string };

export async function activeLocations(): Promise<LocationOption[]> {
  const db = await createClient();
  if (!db) return [];
  const { data, error } = await db.from("locations").select("id,name,state_name,country_name").eq("is_active", true).order("display_order");
  if (error) throw new Error("Unable to load locations. Apply the latest migration.");
  return data ?? [];
}

export async function resolveActiveLocations(ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))];
  const db = await createClient();
  if (!db || !unique.length) return null;
  const { data, error } = await db.from("locations").select("id,name").eq("is_active", true).in("id", unique);
  return error || data?.length !== unique.length ? null : data;
}
