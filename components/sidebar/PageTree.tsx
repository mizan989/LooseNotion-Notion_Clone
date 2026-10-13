"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronRight, FileText, GripVertical, Plus, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/client/utils";
import { useSidebarStore } from "@/stores/sidebar-store";
import type { PageTreeNode } from "@/types/page";
import { createPage, deletePage, duplicatePage, movePage, renamePage } from "@/actions/pages";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

function SortableRow({
  node,
  depth,
  activePageId,
  workspaceId,
}: {
  node: PageTreeNode;
  depth: number;
  activePageId?: string;
  workspaceId: string;
}) {
  const router = useRouter();
  const expanded = useSidebarStore((s) => s.expandedIds.has(node.id));
  const toggleExpanded = useSidebarStore((s) => s.toggleExpanded);
  const markPageDeleted = useSidebarStore((s) => s.markPageDeleted);
  const unmarkPageDeleted = useSidebarStore((s) => s.unmarkPageDeleted);
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(node.title);
  const [pageActionError, setPageActionError] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: node.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  async function handleCreateChild(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const page = await createPage({ workspaceId, parentId: node.id, title: "Untitled" });
    router.push(`/workspace/${page.id}`);
  }

  async function commitRename() {
    setRenaming(false);
    if (title.trim() && title !== node.title) await renamePage(node.id, title.trim());
  }

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    // 1. Optimistic removal (0ms perceived latency)
    markPageDeleted(node.id);

    try {
      await deletePage(node.id);
      if (activePageId === node.id) router.push("/workspace");
    } catch {
      unmarkPageDeleted(node.id);
      setPageActionError(true);
    }
  }

  async function handleDuplicate() {
    setDuplicating(true);
    setPageActionError(false);
    try { await duplicatePage(node.id); }
    catch { setPageActionError(true); }
    finally { setDuplicating(false); }
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md px-2 py-1 text-sm hover:bg-accent",
          activePageId === node.id && "bg-accent font-medium"
        )}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
      >
        <button
          className="flex h-4 w-4 items-center justify-center text-muted-foreground"
          onClick={(e) => {
            e.preventDefault();
            toggleExpanded(node.id);
          }}
        >
          {node.children.length > 0 && (
            <ChevronRight className={cn("h-3 w-3 transition-transform", expanded && "rotate-90")} />
          )}
        </button>

        <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground opacity-0 group-hover:opacity-100">
          <GripVertical className="h-3 w-3" />
        </button>

        <span className="text-sm">{node.icon ?? <FileText className="h-3.5 w-3.5" />}</span>

        {renaming ? (
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => e.key === "Enter" && commitRename()}
            className="flex-1 truncate bg-transparent text-sm outline-none"
          />
        ) : (
          <Link
            href={`/workspace/${node.id}`}
            onDoubleClick={(e) => {
              e.preventDefault();
              setRenaming(true);
            }}
            className="flex-1 truncate"
          >
            {node.title || "Untitled"}
          </Link>
        )}

        <div className="ml-auto flex items-center opacity-0 group-hover:opacity-100">
          <button onClick={handleCreateChild} className="rounded p-0.5 hover:bg-background">
            <Plus className="h-3.5 w-3.5" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded p-0.5 hover:bg-background">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setRenaming(true)}>Rename</DropdownMenuItem>
              <DropdownMenuItem disabled={duplicating} onClick={() => void handleDuplicate()}>{duplicating ? "Duplicating..." : "Duplicate"}</DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {pageActionError && <p role="alert" className="px-3 py-1 text-xs text-destructive">Could not complete page action. Please try again.</p>}

      {expanded && node.children.length > 0 && (
        <PageTree
          nodes={node.children}
          depth={depth + 1}
          activePageId={activePageId}
          workspaceId={workspaceId}
          parentId={node.id}
        />
      )}
    </div>
  );
}

export function PageTree({
  nodes,
  depth = 0,
  activePageId,
  workspaceId,
  parentId = null,
}: {
  nodes: PageTreeNode[];
  depth?: number;
  activePageId?: string;
  workspaceId: string;
  parentId?: string | null;
}) {
  const deletedPageIds = useSidebarStore((s) => s.deletedPageIds);
  const visibleNodes = nodes.filter((n) => !deletedPageIds.has(n.id));
  const [items, setItems] = useState(visibleNodes);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  useEffect(() => {
    setItems(nodes.filter((n) => !deletedPageIds.has(n.id)));
  }, [nodes, deletedPageIds]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((n) => n.id === active.id);
    const newIndex = items.findIndex((n) => n.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);

    await movePage(active.id as string, parentId, newIndex);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((n) => n.id)} strategy={verticalListSortingStrategy}>
        {items.map((node) => (
          <SortableRow key={node.id} node={node} depth={depth} activePageId={activePageId} workspaceId={workspaceId} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
