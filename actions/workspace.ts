"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/server/supabase";
import { requireUser } from "@/lib/server/auth";

export async function renameWorkspace(workspaceId: string, name: string) {
  await requireUser();
  if (!/^[0-9a-f-]{36}$/i.test(workspaceId) || !name.trim() || name.trim().length > 100) throw new Error("Invalid workspace details.");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspaces")
    .update({ name })
    .eq("id", workspaceId).select("id").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Workspace not found or owner access required.");
  revalidatePath("/workspace");
}

export async function exportWorkspace(workspaceId: string, format: "markdown" | "json") {
  await requireUser();
  if (!/^[0-9a-f-]{36}$/i.test(workspaceId)) throw new Error("Invalid workspace.");
  const supabase = await createClient();
  const { data: pages, error } = await supabase
    .from("pages")
    .select("id, title, parent_id, position, icon, cover, is_database, created_at, updated_at")
    .eq("workspace_id", workspaceId)
    .eq("is_deleted", false);
  if (error) throw error;
  const { data: workspace, error: workspaceError } = await supabase.from("workspaces").select("id, name, created_at").eq("id", workspaceId).maybeSingle();
  if (workspaceError || !workspace) throw new Error("Workspace not found or access denied.");

  const pageIds = (pages ?? []).map((p) => p.id);
  const { data: blocks, error: blocksError } = await supabase
    .from("blocks")
    .select("page_id, content")
    .in("page_id", pageIds.length ? pageIds : ["00000000-0000-0000-0000-000000000000"]);
  if (blocksError) throw blocksError;

  const { data: databases, error: databasesError } = await supabase.from("databases").select("id, page_id, name, created_at").in("page_id", pageIds.length ? pageIds : ["00000000-0000-0000-0000-000000000000"]);
  if (databasesError) throw databasesError;
  const databaseIds = (databases ?? []).map((db) => db.id);
  const [columnsResult, rowsResult] = await Promise.all([
    supabase.from("database_columns").select("id, database_id, name, type, options, position").in("database_id", databaseIds.length ? databaseIds : ["00000000-0000-0000-0000-000000000000"]),
    supabase.from("database_rows").select("id, database_id, position, values, created_at").in("database_id", databaseIds.length ? databaseIds : ["00000000-0000-0000-0000-000000000000"]),
  ]);
  if (columnsResult.error) throw columnsResult.error;
  if (rowsResult.error) throw rowsResult.error;

  const byPage = new Map((blocks ?? []).map((b) => [b.page_id, b.content]));

  if (format === "json") {
    return JSON.stringify({ schemaVersion: 1, workspace, pages: (pages ?? []).map((p) => ({ ...p, content: byPage.get(p.id) ?? null })), databases: (databases ?? []).map((db) => ({ ...db, columns: (columnsResult.data ?? []).filter((c) => c.database_id === db.id), rows: (rowsResult.data ?? []).filter((r) => r.database_id === db.id) })) }, null, 2);
  }

  // Minimal Tiptap JSON -> Markdown text extraction
  function toMarkdown(node: any): string {
    if (!node) return "";
    if (node.type === "text") {
      let text = String(node.text ?? "").replace(/([\\`*_{}\[\]<>])/g, "\\$1");
      for (const mark of node.marks ?? []) {
        if (mark.type === "bold") text = `**${text}**`;
        else if (mark.type === "italic") text = `*${text}*`;
        else if (mark.type === "strike") text = `~~${text}~~`;
        else if (mark.type === "code") text = `\`${text}\``;
        else if (mark.type === "link" && typeof mark.attrs?.href === "string") text = `[${text}](${mark.attrs.href.replace(/[\s()]/g, "")})`;
      }
      return text;
    }
    const children = (node.content ?? []).map(toMarkdown).join("");
    switch (node.type) {
      case "heading": return `${"#".repeat(Math.min(6, Math.max(1, node.attrs?.level ?? 1)))} ${children}\n\n`;
      case "paragraph": return `${children}\n\n`;
      case "bulletList": return `${children}\n`;
      case "orderedList": return `${children}\n`;
      case "listItem": return `- ${children.trim()}\n`;
      case "taskList": return `${children}\n`;
      case "taskItem": return `- [${node.attrs?.checked ? "x" : " "}] ${children.trim()}\n`;
      case "blockquote": return `${children.trim().split("\n").map((line: string) => `> ${line}`).join("\n")}\n\n`;
      case "codeBlock": return `\`\`\`${node.attrs?.language ?? ""}\n${(node.content ?? []).map((part: any) => part.text ?? "").join("")}\n\`\`\`\n\n`;
      case "hardBreak": return "  \n";
      case "horizontalRule": return "---\n\n";
      case "image": return `![${node.attrs?.alt ?? ""}](${node.attrs?.src ?? ""})\n\n`;
      case "doc": return children;
      default: return children || `<!-- Unsupported editor node: ${String(node.type)} -->\n`;
    }
  }

  const pageById = new Map((pages ?? []).map((p) => [p.id, p]));
  const depth = (page: any) => { let n = 0; let parentId = page.parent_id; const seen = new Set([page.id]); while (parentId && pageById.has(parentId) && !seen.has(parentId)) { seen.add(parentId); n++; parentId = pageById.get(parentId)?.parent_id; } return n; };
  const markdownDatabase = (pageId: string) => {
    const db = (databases ?? []).find((item) => item.page_id === pageId);
    if (!db) return "Database definition is unavailable.\n\n";
    const columns = (columnsResult.data ?? []).filter((column) => column.database_id === db.id).sort((a, b) => a.position - b.position);
    const rows = (rowsResult.data ?? []).filter((row) => row.database_id === db.id);
    if (columns.length === 0) return "Database has no columns.\n\n";
    const escapeCell = (value: unknown) => String(value ?? "").replace(/\|/g, "\\|").replace(/[\r\n]+/g, " ");
    const header = `| ${columns.map((column) => escapeCell(column.name)).join(" | ")} |`;
    const separator = `| ${columns.map(() => "---").join(" | ")} |`;
    const body = rows.map((row) => `| ${columns.map((column) => {
      const value = row.values?.[column.id];
      const display = column.type === "select" ? (column.options ?? []).find((option: any) => option.id === value)?.label ?? value : value;
      return escapeCell(display);
    }).join(" | ")} |`).join("\n");
    return `### ${db.name}\n\n${header}\n${separator}${body ? `\n${body}` : ""}\n\n`;
  };
  return `<!-- Workspace export: ${workspace.name} -->\n\n${(pages ?? []).map((p) => `${"#".repeat(Math.min(6, depth(p) + 1))} ${p.icon ? `${p.icon} ` : ""}${p.title}\n\n${p.is_database ? markdownDatabase(p.id) : toMarkdown(byPage.get(p.id))}`).join("\n---\n\n")}`;
}
