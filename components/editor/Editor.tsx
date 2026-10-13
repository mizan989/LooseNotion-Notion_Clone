"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { EditorContent } from "@tiptap/react";
import { usePageEditor } from "@/hooks/useEditor";
import { useAutosave } from "@/hooks/useAutosave";
import { savePageBlocks } from "@/actions/blocks";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { useEditorStore } from "@/stores/editor-store";

export function Editor({ pageId, userId, initialContent }: { pageId: string; userId: string; initialContent: unknown }) {
  const [doc, setDoc] = useState<unknown>(initialContent);
  const [recovery, setRecovery] = useState<unknown>(null);
  const [recoveryChecked, setRecoveryChecked] = useState(false);
  const [localDraftUnavailable, setLocalDraftUnavailable] = useState(false);
  const setActivePage = useEditorStore((s) => s.setActivePage);

  const docRef = useRef(doc);
  docRef.current = doc;
  const confirmedDocRef = useRef(JSON.stringify(initialContent));
  const draftKey = `loosenotion:draft:${userId}:${pageId}`;
  const handleUpdate = useCallback((json: unknown) => {
    docRef.current = json;
    if (JSON.stringify(json) === confirmedDocRef.current) {
      try { localStorage.removeItem(draftKey); setLocalDraftUnavailable(false); } catch { setLocalDraftUnavailable(true); }
    } else {
      try { localStorage.setItem(draftKey, JSON.stringify({ content: json, updatedAt: Date.now() })); setLocalDraftUnavailable(false); } catch { setLocalDraftUnavailable(true); }
    }
    setDoc(json);
  }, [draftKey]);
  const editor = usePageEditor(initialContent, handleUpdate);

  useEffect(() => {
    setActivePage(pageId);
    return () => setActivePage(null);
  }, [pageId, setActivePage]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(draftKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.content && JSON.stringify(parsed.content) !== JSON.stringify(initialContent)) {
          setRecovery(parsed.content);
        }
      }
    } catch {
      try { localStorage.removeItem(draftKey); } catch { /* storage may be unavailable */ }
    }
    setRecoveryChecked(true);
  }, [draftKey, initialContent]);

  const persist = useAutosave(pageId, doc, async (value) => {
    await savePageBlocks(pageId, value);
    confirmedDocRef.current = JSON.stringify(value);
    if (JSON.stringify(value) === JSON.stringify(docRef.current)) {
      try { localStorage.removeItem(draftKey); } catch { /* confirmed server content remains safe */ }
      setLocalDraftUnavailable(false);
    }
  });

  useEffect(() => {
    if (!localDraftUnavailable) return;
    const warnBeforeLeave = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warnBeforeLeave);
    return () => window.removeEventListener("beforeunload", warnBeforeLeave);
  }, [localDraftUnavailable]);

  function restoreDraft() {
    if (!recovery) return;
    setDoc(recovery);
    editor?.commands.setContent(recovery as any);
    setRecovery(null);
  }

  function discardDraft() {
    try { localStorage.removeItem(draftKey); } catch { /* storage may be unavailable */ }
    setRecovery(null);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="flex flex-1 flex-col"
    >
      <EditorToolbar editor={editor} onRetry={() => void persist()} />
      {recoveryChecked && recovery !== null && (
        <div role="status" className="flex items-center gap-3 border-b px-4 py-2 text-xs text-muted-foreground">
          <span>A newer local draft is available.</span>
          <button className="underline" onClick={restoreDraft}>Restore draft</button>
          <button className="underline" onClick={discardDraft}>Use saved version</button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-8 py-6 md:px-16">
        <EditorContent editor={editor} />
      </div>
    </motion.div>
  );
}
