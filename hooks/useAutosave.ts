"use client";

import { useCallback, useEffect, useRef } from "react";
import { useEditorStore } from "@/stores/editor-store";

/**
 * Debounces calls to `save` and drives the "Saving... / Saved" indicator
 * in the editor toolbar via the editor store.
 */
export function useAutosave<T>(pageId: string, value: T, save: (value: T) => Promise<void>, delayMs = 800) {
  const setSaveStatus = useEditorStore((s) => s.setSaveStatus);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const isFirstRun = useRef(true);
  const saveRef = useRef(save);
  const latestRef = useRef(value);
  const savedRef = useRef("");
  const inFlightRef = useRef(false);
  const mountedRef = useRef(true);
  saveRef.current = save;
  latestRef.current = value;
  const serialized = JSON.stringify(value);

  const persistLatest = useCallback(async () => {
    if (inFlightRef.current) return;
    if (JSON.stringify(latestRef.current) === savedRef.current) return;
    inFlightRef.current = true;
    setSaveStatus(pageId, "saving");
    try {
      let content = latestRef.current;
      let snapshot = JSON.stringify(content);
      while (snapshot !== savedRef.current) {
        await saveRef.current(content);
        savedRef.current = snapshot;
        content = latestRef.current;
        snapshot = JSON.stringify(content);
      }
      if (mountedRef.current) setSaveStatus(pageId, "saved");
    } catch {
      if (mountedRef.current) setSaveStatus(pageId, "error");
    } finally {
      inFlightRef.current = false;
    }
  }, [pageId, setSaveStatus]);

  useEffect(() => {
    mountedRef.current = true;
    if (savedRef.current === "") savedRef.current = serialized;
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    if (serialized === savedRef.current) {
      setSaveStatus(pageId, "saved");
      return;
    }

    setSaveStatus(pageId, "saving");
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => { void persistLatest(); }, delayMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [pageId, serialized, delayMs, persistLatest, setSaveStatus]);

  useEffect(() => () => { mountedRef.current = false; }, []);
  return persistLatest;
}
