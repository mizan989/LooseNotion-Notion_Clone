"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/server/supabase";
import type { ColumnType, SelectOption } from "@/types/database";
import { requireUser } from "@/lib/server/auth";
import { z } from "zod";

const uuid = z.string().uuid();
const columnType = z.enum(["text", "number", "select", "checkbox", "date"]);
const safeId = (id: string) => { if (!uuid.safeParse(id).success) throw new Error("Invalid database record."); };

export async function addDatabaseColumn(databaseId: string, name: string, type: ColumnType) {
  await requireUser(); safeId(databaseId);
  const cleanName = z.string().trim().min(1).max(100).parse(name);
  const cleanType = columnType.parse(type);
  const supabase = createClient();
  const { count } = await supabase
    .from("database_columns")
    .select("id", { count: "exact", head: true })
    .eq("database_id", databaseId);

  const { data, error } = await supabase
    .from("database_columns")
    .insert({ database_id: databaseId, name: cleanName, type: cleanType, position: count ?? 0 })
    .select()
    .single();
  if (error) throw error;
  revalidatePath("/workspace");
  return data;
}

export async function updateDatabaseColumn(
  columnId: string,
  updates: Partial<{ name: string; options: SelectOption[] }>
) {
  await requireUser(); safeId(columnId);
  const cleanUpdates = z.object({ name: z.string().trim().min(1).max(100).optional(), options: z.array(z.object({ id: z.string().min(1).max(100), label: z.string().min(1).max(100), color: z.string().max(32) })).max(100).optional() }).strict().parse(updates);
  if (Object.keys(cleanUpdates).length === 0) throw new Error("No valid column changes provided.");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("database_columns")
    .update(cleanUpdates)
    .eq("id", columnId).select("id").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Column not found or access denied.");
  revalidatePath("/workspace");
}

export async function deleteDatabaseColumn(columnId: string) {
  await requireUser(); safeId(columnId);
  const supabase = createClient();
  const { data, error } = await supabase.from("database_columns").delete().eq("id", columnId).select("id").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Column not found or access denied.");
  revalidatePath("/workspace");
}

export async function addDatabaseRow(databaseId: string) {
  await requireUser(); safeId(databaseId);
  const supabase = createClient();
  const { data, error } = await supabase
    .from("database_rows")
    .insert({ database_id: databaseId, position: Date.now(), values: {} })
    .select()
    .single();
  if (error) throw error;
  revalidatePath("/workspace");
  return data;
}

export async function updateDatabaseRow(
  rowId: string,
  values: Record<string, string | number | boolean | null>
) {
  await requireUser(); safeId(rowId);
  const validatedValues = z.record(z.string().uuid(), z.union([z.string().max(10000), z.number().finite(), z.boolean(), z.null()])).parse(values);
  if (Object.keys(validatedValues).length === 0) throw new Error("No cell changes provided.");
  const supabase = createClient();
  const { data: current, error: readError } = await supabase
    .from("database_rows")
    .select("values, database_id")
    .eq("id", rowId)
    .single();
  if (readError) throw readError;

  const { data: columns, error: columnsError } = await supabase.from("database_columns").select("id, type, options").eq("database_id", current.database_id);
  if (columnsError) throw columnsError;
  const columnsById = new Map((columns ?? []).map((column) => [column.id, column]));
  for (const [columnId, value] of Object.entries(validatedValues)) {
    const column = columnsById.get(columnId);
    if (!column) throw new Error("Cell references an unavailable database property.");
    if (value === null) continue;
    if (column.type === "number" && typeof value !== "number") throw new Error("A number property requires a number value.");
    if (column.type === "checkbox" && typeof value !== "boolean") throw new Error("A checkbox property requires a boolean value.");
    if (["text", "date", "select"].includes(column.type) && typeof value !== "string") throw new Error("This property requires text.");
    if (column.type === "select" && !(column.options ?? []).some((option: SelectOption) => option.id === value)) throw new Error("Choose a valid select option.");
  }

  const { data: updated, error } = await supabase
    .from("database_rows")
    .update({ values: { ...current.values, ...validatedValues } })
    .eq("id", rowId).select("id").maybeSingle();
  if (error) throw error;
  if (!updated) throw new Error("Row not found or access denied.");
  revalidatePath("/workspace");
}

export async function deleteDatabaseRow(rowId: string) {
  await requireUser(); safeId(rowId);
  const supabase = createClient();
  const { data, error } = await supabase.from("database_rows").delete().eq("id", rowId).select("id").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Row not found or access denied.");
  revalidatePath("/workspace");
}
