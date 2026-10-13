import "server-only";
import { createClient } from "@/lib/server/supabase";
import type { DatabaseColumn, DatabaseRow } from "@/types/database";

function mapColumn(row: any): DatabaseColumn {
  return {
    id: row.id,
    databaseId: row.database_id,
    name: row.name,
    type: row.type,
    options: row.options,
    position: row.position,
  };
}

function mapRow(row: any): DatabaseRow {
  return {
    id: row.id,
    databaseId: row.database_id,
    position: row.position,
    values: row.values ?? {},
    createdAt: row.created_at,
  };
}

export async function getDatabaseByPageId(pageId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("databases")
    .select("*")
    .eq("page_id", pageId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getDatabaseColumns(databaseId: string): Promise<DatabaseColumn[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("database_columns")
    .select("*")
    .eq("database_id", databaseId)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapColumn);
}

export async function getDatabaseRows(databaseId: string): Promise<DatabaseRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("database_rows")
    .select("*")
    .eq("database_id", databaseId)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}
