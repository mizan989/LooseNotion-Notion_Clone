"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Star, PanelLeftClose, PanelLeft, Database, Loader2, Trash2, Clock3 } from "lucide-react";
import { cn } from "@/lib/client/utils";
import { useSidebarStore } from "@/stores/sidebar-store";
import { WorkspaceSwitcher } from "@/components/sidebar/WorkspaceSwitcher";
import { PageTree } from "@/components/sidebar/PageTree";
import { SearchDialog } from "@/components/search/SearchDialog";
import { ExportMenu } from "@/components/sidebar/ExportMenu";
import { createPage, getTrashPages, restorePage } from "@/actions/pages";
import type { Page, PageTreeNode } from "@/types/page";

function filterTree(nodes: PageTreeNode[], deletedIds: Set<string>): PageTreeNode[] {
  return nodes
    .filter((n) => !deletedIds.has(n.id))
    .map((n) => ({
      ...n,
      children: filterTree(n.children, deletedIds),
    }));
}

export function Sidebar({
  workspaceId,
  workspaceName,
  userEmail,
  tree,
  favorites,
}: {
  workspaceId: string;
  workspaceName: string;
  userEmail: string;
  tree: PageTreeNode[];
  favorites: Page[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const activePageId = pathname?.split("/workspace/")[1];
  const isOpen = useSidebarStore((s) => s.isOpen);
  const toggle = useSidebarStore((s) => s.toggle);
  const deletedPageIds = useSidebarStore((s) => s.deletedPageIds);
  const [searchOpen, setSearchOpen] = useState(false);
  const [creatingPage, setCreatingPage] = useState(false);
  const [creatingDb, setCreatingDb] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [trashOpen, setTrashOpen] = useState(false);
  const [trashLoading, setTrashLoading] = useState(false);
  const [trashPages, setTrashPages] = useState<{ id: string; title: string; updated_at: string }[]>([]);
  const [trashError, setTrashError] = useState<string | null>(null);
  const [recentIds, setRecentIds] = useState<string[]>([]);

  const visibleFavorites = favorites.filter((p) => !deletedPageIds.has(p.id));
  const visibleTree = filterTree(tree, deletedPageIds);
  const recentStorageKey = `loosenotion:recent:${workspaceId}`;
  const allPages = flattenTree(visibleTree);
  useEffect(() => {
    let stored: string[] = [];
    try {
      const parsed = JSON.parse(localStorage.getItem(recentStorageKey) ?? "[]");
      if (Array.isArray(parsed)) stored = parsed.filter((id): id is string => typeof id === "string").slice(0, 8);
    } catch { localStorage.removeItem(recentStorageKey); }
    const next = activePageId && allPages.some((page) => page.id === activePageId)
      ? [activePageId, ...stored.filter((id) => id !== activePageId)].slice(0, 8)
      : stored.filter((id) => allPages.some((page) => page.id === id));
    setRecentIds(next);
    try { localStorage.setItem(recentStorageKey, JSON.stringify(next)); } catch { /* local storage may be unavailable */ }
  // `allPages` is derived from the server tree; state updates must not re-run this effect.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePageId, tree, deletedPageIds, recentStorageKey]);

  const recentPages = recentIds.map((id) => allPages.find((page) => page.id === id)).filter((page): page is Page => Boolean(page));

  async function handleNewPage() {
    try {
      setCreateError(null);
      setCreatingPage(true);
      const page = await createPage({ workspaceId, title: "Untitled" });
      router.push(`/workspace/${page.id}`);
    } catch {
      setCreateError("Could not create page. Please try again.");
    } finally {
      setCreatingPage(false);
    }
  }

  async function handleNewDatabase() {
    try {
      setCreateError(null);
      setCreatingDb(true);
      const page = await createPage({ workspaceId, title: "Untitled Database", isDatabase: true });
      router.push(`/workspace/${page.id}`);
    } catch {
      setCreateError("Could not create database. Please try again.");
    } finally {
      setCreatingDb(false);
    }
  }

  async function openTrash() {
    setTrashOpen((open) => !open);
    if (trashOpen) return;
    setTrashLoading(true);
    try { setTrashPages(await getTrashPages(workspaceId)); }
    catch { setTrashError("Could not load trash. Please try again."); }
    finally { setTrashLoading(false); }
  }

  async function handleRestore(pageId: string) {
    try {
      setTrashError(null);
      await restorePage(pageId);
      setTrashPages((items) => items.filter((item) => item.id !== pageId));
      router.refresh();
    } catch (error) {
      console.error("Could not restore page", error);
      setTrashError("Could not restore page. Please try again.");
    }
  }

  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={toggle}
        className="fixed left-2 top-2 z-40 rounded-md p-1.5 bg-[#161619] border border-white/10 hover:bg-white/10 text-zinc-300 shadow-md"
        title="Show sidebar"
      >
        <PanelLeft className="h-4 w-4" />
      </motion.button>
    );
  }

  return (
    <motion.aside
      initial={{ x: -16, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      className="flex h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-[#141416]/95 backdrop-blur-md"
    >
      <div className="flex items-center justify-between px-2 pt-2">
        <WorkspaceSwitcher workspaceName={workspaceName} userEmail={userEmail} />
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={toggle}
          className="rounded-md p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white"
          title="Hide sidebar"
        >
          <PanelLeftClose className="h-4 w-4" />
        </motion.button>
      </div>

      <div className="flex flex-col gap-0.5 px-2 pt-2">
        <motion.button
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
        >
          <Search className="h-3.5 w-3.5" /> Search
          <kbd className="ml-auto rounded border border-white/10 bg-black/40 px-1 py-0.5 text-[10px] font-mono text-zinc-400">
            Ctrl K
          </kbd>
        </motion.button>
        <ExportMenu workspaceId={workspaceId} />
      </div>

      {visibleFavorites.length > 0 && (
        <div className="mt-3 px-2">
          <div className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            <Star className="h-3 w-3" /> Favorites
          </div>
          <div className="space-y-0.5 mt-0.5">
            {visibleFavorites.map((page) => (
              <motion.div key={page.id} whileHover={{ x: 2 }} whileTap={{ scale: 0.99 }}>
                <Link
                  href={`/workspace/${page.id}`}
                  className={cn(
                    "flex items-center gap-2 truncate rounded-md px-2 py-1 text-xs text-zinc-400 hover:bg-white/5 hover:text-white transition-colors",
                    activePageId === page.id && "bg-white/10 text-white font-medium shadow-sm"
                  )}
                >
                  <span>{page.icon ?? "📄"}</span> {page.title || "Untitled"}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {recentPages.length > 0 && (
        <div className="mt-3 px-2">
          <div className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            <Clock3 className="h-3 w-3" /> Recent
            <button className="ml-auto normal-case font-normal tracking-normal hover:text-zinc-300" onClick={() => { setRecentIds([]); localStorage.removeItem(recentStorageKey); }}>Clear</button>
          </div>
          <div className="space-y-0.5 mt-0.5">
            {recentPages.map((page) => <Link key={page.id} href={`/workspace/${page.id}`} className="flex items-center gap-2 truncate rounded-md px-2 py-1 text-xs text-zinc-400 hover:bg-white/5 hover:text-white"><span>{page.icon ?? "📄"}</span>{page.title || "Untitled"}</Link>)}
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-1 flex-col overflow-y-auto px-2">
        <div className="flex items-center justify-between px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          <span>Workspace</span>
          <div className="flex items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleNewDatabase}
              disabled={creatingDb}
              title="New database"
              className="rounded p-0.5 text-zinc-400 hover:bg-white/10 hover:text-white"
            >
              {creatingDb ? <Loader2 className="h-3 w-3 animate-spin" /> : <Database className="h-3 w-3" />}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleNewPage}
              disabled={creatingPage}
              title="New page"
              className="rounded p-0.5 text-zinc-400 hover:bg-white/10 hover:text-white"
            >
              {creatingPage ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            </motion.button>
          </div>
        </div>
        {createError && <p role="alert" className="px-2 py-1 text-xs text-destructive">{createError}</p>}
        <PageTree nodes={visibleTree} activePageId={activePageId} workspaceId={workspaceId} />
        <div className="mt-3 border-t border-white/10 pt-2">
          <button onClick={openTrash} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-zinc-400 hover:bg-white/5 hover:text-white">
            <Trash2 className="h-3.5 w-3.5" /> Trash
          </button>
          {trashOpen && (
            <div className="space-y-1 px-2 py-1">
              {trashError && <p role="alert" className="text-xs text-destructive">{trashError}</p>}
              {trashLoading ? <p className="text-xs text-zinc-500">Loading trash...</p> : trashPages.length === 0 ? <p className="text-xs text-zinc-500">Trash is empty.</p> : trashPages.map((page) => (
                <div key={page.id} className="flex items-center gap-2 text-xs text-zinc-400">
                  <span className="flex-1 truncate">{page.title || "Untitled"}</span>
                  <button className="underline hover:text-white" onClick={() => void handleRestore(page.id)}>Restore</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} pages={flattenTree(visibleTree)} />
    </motion.aside>
  );
}

function flattenTree(nodes: PageTreeNode[]): Page[] {
  return nodes.flatMap((n) => [n, ...flattenTree(n.children)]);
}
