"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/server/supabase";
import { requireUser } from "@/lib/server/auth";
import { z } from "zod";

const uuid = z.string().uuid();
const pageTitle = z.string().trim().min(1).max(200);

async function assertWorkspaceAccess(workspaceId: string) {
  if (!uuid.safeParse(workspaceId).success) throw new Error("Invalid workspace.");
  const supabase = createClient();
  const { data, error } = await supabase.from("workspaces").select("id").eq("id", workspaceId).maybeSingle();
  if (error || !data) throw new Error("Workspace not found or access denied.");
}

async function getAccessiblePage(pageId: string) {
  if (!uuid.safeParse(pageId).success) throw new Error("Invalid page.");
  const supabase = createClient();
  const { data, error } = await supabase.from("pages").select("*").eq("id", pageId).maybeSingle();
  if (error || !data) throw new Error("Page not found or access denied.");
  return { supabase, page: data };
}

export async function createPage(input: {
  workspaceId: string;
  parentId?: string | null;
  title?: string;
  isDatabase?: boolean;
}) {
  const user = await requireUser();
  await assertWorkspaceAccess(input.workspaceId);
  const title = pageTitle.parse(input.title ?? "Untitled");
  if (input.parentId) {
    const { page: parent } = await getAccessiblePage(input.parentId);
    if (parent.workspace_id !== input.workspaceId || parent.is_deleted) throw new Error("Invalid parent page.");
  }
  const supabase = createClient();

  const { data: page, error } = await supabase
    .from("pages")
    .insert({
      workspace_id: input.workspaceId,
      parent_id: input.parentId ?? null,
      title,
      is_database: input.isDatabase ?? false,
      created_by: user.id,
      position: Date.now(),
    })
    .select()
    .single();
  if (error) throw error;

  if (input.isDatabase) {
    const { data: db, error: dbError } = await supabase
      .from("databases")
      .insert({ page_id: page.id, name: input.title ?? "Untitled Database" })
      .select()
      .single();
    if (dbError) { await supabase.from("pages").delete().eq("id", page.id); throw dbError; }

    // Seed with the three default columns from the blueprint (Task / Status / Priority style)
    const { error: columnsError } = await supabase.from("database_columns").insert([
      { database_id: db.id, name: "Name", type: "text", position: 0 },
      {
        database_id: db.id,
        name: "Status",
        type: "select",
        position: 1,
        options: [
          { id: "todo", label: "Todo", color: "#94a3b8" },
          { id: "doing", label: "Doing", color: "#3b82f6" },
          { id: "done", label: "Done", color: "#30a46c" },
        ],
      },
      {
        database_id: db.id,
        name: "Priority",
        type: "select",
        position: 2,
        options: [
          { id: "low", label: "Low", color: "#94a3b8" },
          { id: "medium", label: "Medium", color: "#f5a623" },
          { id: "high", label: "High", color: "#e5484d" },
        ],
      },
    ]);
    if (columnsError) {
      await supabase.from("pages").delete().eq("id", page.id);
      throw columnsError;
    }
  } else {
    const { error: blockError } = await supabase.from("blocks").insert({
      page_id: page.id,
      content: { type: "doc", content: [{ type: "paragraph" }] },
    });
    if (blockError) {
      await supabase.from("pages").delete().eq("id", page.id);
      throw blockError;
    }
  }

  revalidatePath("/workspace");
  return page;
}

export async function renamePage(pageId: string, title: string) {
  await requireUser();
  if (!uuid.safeParse(pageId).success) throw new Error("Invalid page.");
  const validatedTitle = pageTitle.parse(title);
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pages")
    .update({ title: validatedTitle, updated_at: new Date().toISOString() })
    .eq("id", pageId).select("id").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Page not found or access denied.");
  revalidatePath("/workspace");
}

export async function setPageIcon(pageId: string, icon: string | null) {
  await requireUser();
  if (!uuid.safeParse(pageId).success) throw new Error("Invalid page.");
  if (icon !== null && icon.length > 32) throw new Error("Invalid page icon.");
  const supabase = createClient();
  const { data, error } = await supabase.from("pages").update({ icon }).eq("id", pageId).select("id").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Page not found or access denied.");
  revalidatePath("/workspace");
}

export async function setPageCover(pageId: string, cover: string | null) {
  await requireUser();
  if (!uuid.safeParse(pageId).success) throw new Error("Invalid page.");
  if (cover !== null && (cover.length > 2048 || !/^https:\/\//i.test(cover))) throw new Error("Invalid page cover URL.");
  const supabase = createClient();
  const { data, error } = await supabase.from("pages").update({ cover }).eq("id", pageId).select("id").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Page not found or access denied.");
  revalidatePath("/workspace");
}

export async function movePage(pageId: string, parentId: string | null, position: number) {
  await requireUser();
  if (!Number.isFinite(position) || Math.abs(position) > 1e12) throw new Error("Invalid page position.");
  const supabase = createClient();
  const { data: page, error: pageError } = await supabase.from("pages").select("id, workspace_id, is_deleted").eq("id", pageId).maybeSingle();
  if (pageError || !page || page.is_deleted) throw new Error("Page not found or access denied.");
  if (parentId) {
    const { data: parent, error: parentError } = await supabase.from("pages").select("id, parent_id, workspace_id, is_deleted").eq("id", parentId).maybeSingle();
    if (parentError || !parent || parent.workspace_id !== page.workspace_id || parent.is_deleted) throw new Error("Invalid destination page.");
    const { data: allPages, error: treeError } = await supabase.from("pages").select("id, parent_id").eq("workspace_id", page.workspace_id).eq("is_deleted", false);
    if (treeError) throw treeError;
    const descendants = new Set<string>([pageId]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const item of allPages ?? []) if (item.parent_id && descendants.has(item.parent_id) && !descendants.has(item.id)) { descendants.add(item.id); changed = true; }
    }
    if (descendants.has(parentId)) throw new Error("A page cannot be moved inside itself or a descendant.");
  }
  const { data: moved, error } = await supabase
    .from("pages")
    .update({ parent_id: parentId, position })
    .eq("id", pageId).select("id").maybeSingle();
  if (error) throw error;
  if (!moved) throw new Error("Page not found or access denied.");
  revalidatePath("/workspace");
}

export async function deletePage(pageId: string) {
  await requireUser();
  const supabase = createClient();
  const { data: page, error: pageError } = await supabase.from("pages").select("id, workspace_id").eq("id", pageId).maybeSingle();
  if (pageError || !page) throw new Error("Page not found or access denied.");

  // Find all descendant pages recursively to delete them together
  const { data: allPages, error: hierarchyError } = await supabase
    .from("pages")
    .select("id, parent_id")
    .eq("workspace_id", page.workspace_id)
    .eq("is_deleted", false);
  if (hierarchyError || allPages === null) throw new Error("Could not load page hierarchy.");

  const pageIdsToDelete = new Set<string>([pageId]);
  let added = true;
  while (added) {
    added = false;
    (allPages ?? []).forEach((p) => {
      if (p.parent_id && pageIdsToDelete.has(p.parent_id) && !pageIdsToDelete.has(p.id)) {
        pageIdsToDelete.add(p.id);
        added = true;
      }
    });
  }

  const idsArray = Array.from(pageIdsToDelete);

  const { data: deleted, error } = await supabase
    .from("pages")
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .in("id", idsArray).select("id");
  if (error) throw error;
  if ((deleted ?? []).length !== idsArray.length) throw new Error("Could not delete every page in this hierarchy.");

  // Clean up favorites
  const { error: favoriteError } = await supabase.from("favorites").delete().in("page_id", idsArray);
  if (favoriteError) throw favoriteError;

  revalidatePath("/workspace");
}

export async function getTrashPages(workspaceId: string) {
  await requireUser();
  await assertWorkspaceAccess(workspaceId);
  const supabase = createClient();
  const { data, error } = await supabase.from("pages").select("id, title, parent_id, updated_at").eq("workspace_id", workspaceId).eq("is_deleted", true).order("updated_at", { ascending: false }).limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function restorePage(pageId: string) {
  await requireUser();
  const { supabase, page } = await getAccessiblePage(pageId);
  if (!page.is_deleted) return;
  const { data: pages, error: readError } = await supabase.from("pages").select("id, parent_id, is_deleted").eq("workspace_id", page.workspace_id);
  if (readError) throw readError;
  const restoreIds = new Set([pageId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const child of pages ?? []) if (child.is_deleted && child.parent_id && restoreIds.has(child.parent_id) && !restoreIds.has(child.id)) { restoreIds.add(child.id); changed = true; }
  }
  const parentStillDeleted = page.parent_id && (pages ?? []).some((p) => p.id === page.parent_id && p.is_deleted && !restoreIds.has(p.id));
  const { data: restored, error } = await supabase.from("pages").update({ is_deleted: false, updated_at: new Date().toISOString(), ...(parentStillDeleted ? { parent_id: null } : {}) }).in("id", [...restoreIds]).select("id");
  if (error) throw error;
  if ((restored ?? []).length !== restoreIds.size) throw new Error("Could not restore every page in this hierarchy.");
  revalidatePath("/workspace");
}

export async function duplicatePage(pageId: string) {
  const user = await requireUser();
  const supabase = createClient();
  const { data: original, error } = await supabase
    .from("pages")
    .select("*")
    .eq("id", pageId)
    .single();
  if (error) throw error;
  if (original.is_deleted) throw new Error("Deleted pages cannot be duplicated.");

  const { data: copy, error: copyError } = await supabase
    .from("pages")
    .insert({
      workspace_id: original.workspace_id,
      parent_id: original.parent_id,
      title: `${original.title} (Copy)`,
      icon: original.icon,
      cover: original.cover,
      is_database: original.is_database,
      created_by: user.id,
      position: Date.now(),
    })
    .select()
    .single();
  if (copyError) throw copyError;

  try {
    if (original.is_database) {
      const { data: origDb, error: origDbError } = await supabase
        .from("databases")
        .select("*")
        .eq("page_id", pageId)
        .maybeSingle();
      if (origDbError) throw origDbError;
      if (!origDb) throw new Error("Database definition is missing.");

      const { data: newDb, error: newDbError } = await supabase
        .from("databases")
        .insert({ page_id: copy.id, name: origDb.name })
        .select()
        .single();
      if (newDbError) { await supabase.from("pages").delete().eq("id", copy.id); throw newDbError; }
      if (!newDb) throw new Error("Could not create database copy.");

      const { data: origCols, error: origColsError } = await supabase
        .from("database_columns")
        .select("*")
        .eq("database_id", origDb.id);
      if (origColsError) throw origColsError;

      const colIdMap = new Map<string, string>();
      for (const col of origCols ?? []) {
        const { data: newCol, error: newColError } = await supabase
          .from("database_columns")
          .insert({
            database_id: newDb.id,
            name: col.name,
            type: col.type,
            options: col.options,
            position: col.position,
          })
          .select()
          .single();
        if (newColError) throw newColError;
        if (!newCol) throw new Error("Could not duplicate database columns.");
        colIdMap.set(col.id, newCol.id);
      }

      const { data: origRows, error: origRowsError } = await supabase
        .from("database_rows")
        .select("*")
        .eq("database_id", origDb.id);
      if (origRowsError) throw origRowsError;

      for (const row of origRows ?? []) {
        const newValues: Record<string, unknown> = {};
        for (const [colId, val] of Object.entries(row.values ?? {})) {
          const newColId = colIdMap.get(colId);
          if (!newColId) throw new Error("Database row contains an unknown property.");
          newValues[newColId] = val;
        }

        const { error: rowError } = await supabase.from("database_rows").insert({
          database_id: newDb.id,
          position: row.position,
          values: newValues,
        });
        if (rowError) throw rowError;
      }
    } else {
      const { data: blocks, error: blocksError } = await supabase
        .from("blocks")
        .select("content")
        .eq("page_id", pageId)
        .maybeSingle();
      if (blocksError) throw blocksError;
      if (blocks) {
        const { error: blockError } = await supabase.from("blocks").insert({ page_id: copy.id, content: blocks.content });
        if (blockError) throw blockError;
      }
    }
  } catch (error) {
    await supabase.from("pages").delete().eq("id", copy.id);
    throw error;
  }

  revalidatePath("/workspace");
  return copy;
}

export async function toggleFavorite(pageId: string) {
  const user = await requireUser();
  if (!uuid.safeParse(pageId).success) throw new Error("Invalid page.");
  const supabase = createClient();

  const { data: page, error: pageError } = await supabase.from("pages").select("id").eq("id", pageId).eq("is_deleted", false).maybeSingle();
  if (pageError || !page) throw new Error("Page not found or access denied.");

  const { data: existing, error: existingError } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("page_id", pageId)
    .maybeSingle();
  if (existingError) throw existingError;

  if (existing) {
    const { error } = await supabase.from("favorites").delete().eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("favorites").insert({ user_id: user.id, page_id: pageId });
    if (error) throw error;
  }

  revalidatePath("/workspace");
}
