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
  expandedIds: Set<string>;

  setWorkspace: (workspace: Workspace | null) => void;
  setPages: (pages: PageTreeItem[]) => void;
  addPage: (page: PageTreeItem) => void;
  updatePage: (id: string, updates: Partial<PageTreeItem>) => void;
  removePage: (id: string) => void;
  setActivePageId: (id: string | null) => void;
  toggleExpanded: (id: string) => void;
  expandPage: (id: string) => void;
}

export const usePageStore = create<PageState>((set) => ({
  workspace: null,
  pages: [],
  activePageId: null,
  expandedIds: new Set<string>(),

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

  toggleExpanded: (id) =>
    set((state) => {
      const next = new Set(state.expandedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { expandedIds: next };
    }),

  expandPage: (id) =>
    set((state) => {
      const next = new Set(state.expandedIds);
      next.add(id);
      return { expandedIds: next };
    }),
}));
