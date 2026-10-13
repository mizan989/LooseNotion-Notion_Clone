"use server";

import { createClient } from "@/lib/server/supabase";
import { requireUser } from "@/lib/server/auth";
import { z } from "zod";

/** Autosave endpoint: persists the whole Tiptap JSON document for a page. */
export async function savePageBlocks(pageId: string, content: unknown) {
  await requireUser();
  if (!z.string().uuid().safeParse(pageId).success) throw new Error("Invalid page.");
  const validated = z.object({ type: z.literal("doc"), content: z.array(z.unknown()).max(10000).optional() }).passthrough().safeParse(content);
  if (!validated.success || JSON.stringify(content).length > 1_000_000) throw new Error("Invalid page content.");
  const supabase = createClient();
  const { data: page, error: pageError } = await supabase.from("pages").select("id").eq("id", pageId).eq("is_deleted", false).maybeSingle();
  if (pageError || !page) throw new Error("Page not found or access denied.");
  const { error } = await supabase
    .from("blocks")
    .upsert(
      { page_id: pageId, content: validated.data, updated_at: new Date().toISOString() },
      { onConflict: "page_id" }
    );
  if (error) throw error;
  return { savedAt: new Date().toISOString() };
}
