import { create } from 'zustand';
import type { PageTreeItem } from '../api/pages';

interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

interface PageState {
  workspace: Workspace | null;
  pages: PageTreeItem[];
  activePageId: string | null;

  setWorkspace: (workspace: Workspace | null) => void;
  setPages: (pages: PageTreeItem[]) => void;
  addPage: (page: PageTreeItem) => void;
  updatePage: (id: string, updates: Partial<PageTreeItem>) => void;
  removePage: (id: string) => void;
  setActivePageId: (id: string | null) => void;
}

export const usePageStore = create<PageState>((set) => ({
  workspace: null,
  pages: [],
  activePageId: null,

  setWorkspace: (workspace) => set({ workspace }),

  setPages: (pages) => set({ pages }),

  addPage: (page) =>
    set((state) => ({ pages: [...state.pages, page] })),

  updatePage: (id, updates) =>
    set((state) => ({
      pages: state.pages.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),

  removePage: (id) =>
    set((state) => ({
      pages: state.pages.filter((p) => p.id !== id),
      activePageId: state.activePageId === id ? null : state.activePageId,
    })),

  setActivePageId: (id) => set({ activePageId: id }),
}));
