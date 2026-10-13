import { create } from "zustand";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface EditorState {
  activePageId: string | null;
  saveStatus: SaveStatus;
  saveStatusPageId: string | null;
  setActivePage: (pageId: string | null) => void;
  setSaveStatus: (pageId: string, status: SaveStatus) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  activePageId: null,
  saveStatus: "idle",
  saveStatusPageId: null,
  setActivePage: (pageId) => set({ activePageId: pageId }),
  setSaveStatus: (pageId, status) => set({ saveStatus: status, saveStatusPageId: pageId }),
}));
