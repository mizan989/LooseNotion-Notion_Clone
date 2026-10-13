import "server-only";
import { createClient, createAdminClient } from "@/lib/server/supabase";
import type { Page, PageTreeNode } from "@/types/page";

function mapPage(row: any): Page {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    parentId: row.parent_id,
    title: row.title,
    icon: row.icon,
    cover: row.cover,
    isDatabase: row.is_database,
    isFavorite: row.is_favorite,
    isDeleted: row.is_deleted,
    position: row.position,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getWorkspacePages(workspaceId: string): Promise<Page[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("is_deleted", false)
    .order("position", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapPage);
}

export function buildPageTree(pages: Page[]): PageTreeNode[] {
  const byId = new Map<string, PageTreeNode>();
  pages.forEach((p) => byId.set(p.id, { ...p, children: [] }));

  const roots: PageTreeNode[] = [];
  byId.forEach((node) => {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export async function getPage(pageId: string): Promise<Page | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("id", pageId)
    .single();

  if (error) return null;
  return mapPage(data);
}

export async function getFavoritePages(userId: string): Promise<Page[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("favorites")
    .select("pages(*)")
    .eq("user_id", userId);

  if (error) throw error;
  return (data ?? [])
    .map((row: any) => row.pages)
    .filter((p: any) => Boolean(p) && !p.is_deleted)
    .map(mapPage);
}

export async function getOrCreateDefaultWorkspace(userId: string) {
  const admin = createAdminClient();

  const { data: membership } = await admin
    .from("workspace_members")
    .select("workspace_id, workspaces(*)")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (membership?.workspaces) {
    return membership.workspaces as any;
  }

  // Check if an existing workspace was created by this user
  const { data: ownedWs } = await admin
    .from("workspaces")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (ownedWs) {
    // Ensure membership row exists
    await admin
      .from("workspace_members")
      .upsert(
        { workspace_id: ownedWs.id, user_id: userId, role: "owner" },
        { onConflict: "workspace_id,user_id" }
      );
    return ownedWs;
  }

  const { data: workspace, error: wsError } = await admin
    .from("workspaces")
    .insert({ name: "My Workspace", owner_id: userId })
    .select()
    .single();
  if (wsError) throw wsError;

  const { error: memberError } = await admin
    .from("workspace_members")
    .insert({ workspace_id: workspace.id, user_id: userId, role: "owner" });
  if (memberError) throw memberError;

  return workspace;
}
