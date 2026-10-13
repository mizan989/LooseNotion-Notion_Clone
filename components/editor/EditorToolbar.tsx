"use client";

import type { Editor } from "@tiptap/react";
import { Bold, Italic, Strikethrough, Code2 } from "lucide-react";
import { cn } from "@/lib/client/utils";
import { useEditorStore } from "@/stores/editor-store";

export function EditorToolbar({ editor, onRetry }: { editor: Editor | null; onRetry: () => void }) {
  const saveStatus = useEditorStore((s) => s.saveStatusPageId === s.activePageId ? s.saveStatus : "idle");

  if (!editor) return null;

  const items = [
    { icon: Bold, label: "Bold (Ctrl+B)", isActive: editor.isActive("bold"), run: () => editor.chain().focus().toggleBold().run() },
    { icon: Italic, label: "Italic (Ctrl+I)", isActive: editor.isActive("italic"), run: () => editor.chain().focus().toggleItalic().run() },
    { icon: Strikethrough, label: "Strikethrough", isActive: editor.isActive("strike"), run: () => editor.chain().focus().toggleStrike().run() },
    { icon: Code2, label: "Inline code", isActive: editor.isActive("code"), run: () => editor.chain().focus().toggleCode().run() },
  ];

  return (
    <div className="flex items-center justify-between border-b px-4 py-2">
      <div className="flex items-center gap-1">
        {items.map(({ icon: Icon, label, isActive, run }) => (
          <button
            key={label}
            title={label}
            onClick={run}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent",
              isActive && "bg-accent"
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        {saveStatus === "saving" && "Saving..."}
        {saveStatus === "saved" && "✓ Saved"}
        {saveStatus === "error" && <><span role="alert">Save failed.</span> <button className="underline" onClick={onRetry}>Retry</button></>}
      </span>
    </div>
  );
}
