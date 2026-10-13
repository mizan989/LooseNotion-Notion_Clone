"use client";

import { useState, useRef, useEffect } from "react";
import { setPageIcon } from "@/actions/pages";

const EMOJI_CHOICES = ["📄", "📝", "📚", "🎓", "💡", "🚀", "📌", "🗃", "✅", "📊", "🎯", "🔥"];

export function PageIcon({ pageId, icon }: { pageId: string; icon: string | null }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-md p-1 text-5xl hover:bg-accent transition-colors"
        title="Change icon"
      >
        {icon ?? "📄"}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border bg-popover p-2 text-popover-foreground shadow-lg">
          <div className="grid grid-cols-6 gap-1 place-items-center">
            {EMOJI_CHOICES.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={async () => {
                  await setPageIcon(pageId, emoji);
                  setOpen(false);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-md text-xl hover:bg-accent transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={async () => {
              await setPageIcon(pageId, null);
              setOpen(false);
            }}
            className="mt-2 w-full rounded-md p-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            Remove icon
          </button>
        </div>
      )}
    </div>
  );
}
