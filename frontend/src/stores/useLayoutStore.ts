import { create } from 'zustand';
import type { Tab, EntityType } from '../types';

interface LayoutState {
  sidebarWidth: number;
  openTabs: Tab[];
  activeTabId: string | null;

  openTab: (type: EntityType, entityId: number | null, title: string) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  setSidebarWidth: (width: number) => void;
  closeAllTabs: () => void;
  replaceTabId: (oldId: string, newId: string, newEntityId: number) => void;
  updateTabTitle: (tabId: string, title: string) => void;
  reorderTab: (fromIndex: number, toIndex: number) => void;
}

function makeTabId(type: EntityType, entityId: number | null): string {
  return entityId != null ? `${type}-${entityId}` : type;
}

export const useLayoutStore = create<LayoutState>((set, get) => ({
  sidebarWidth: 300,
  openTabs: [],
  activeTabId: null,

  openTab: (type, entityId, title) => {
    const tabId = makeTabId(type, entityId);
    const { openTabs } = get();
    const existing = openTabs.find((t) => t.id === tabId);
    if (existing) {
      set({ activeTabId: tabId });
    } else {
      const newTab: Tab = { id: tabId, type, entityId, title };
      set({
        openTabs: [...openTabs, newTab],
        activeTabId: tabId,
      });
    }
  },

  closeTab: (tabId) => {
    const { openTabs, activeTabId } = get();
    const idx = openTabs.findIndex((t) => t.id === tabId);
    if (idx === -1) return;

    const newTabs = openTabs.filter((t) => t.id !== tabId);
    let newActive = activeTabId;
    if (activeTabId === tabId) {
      if (newTabs.length > 0) {
        // Activate the nearest tab
        const nextIdx = Math.min(idx, newTabs.length - 1);
        newActive = newTabs[nextIdx].id;
      } else {
        newActive = null;
      }
    }
    set({ openTabs: newTabs, activeTabId: newActive });
  },

  setActiveTab: (tabId) => set({ activeTabId: tabId }),

  setSidebarWidth: (width) => set({ sidebarWidth: width }),

  closeAllTabs: () => set({ openTabs: [], activeTabId: null }),

  replaceTabId: (oldId, newId, newEntityId) => {
    set((s) => ({
      openTabs: s.openTabs.map((t) =>
        t.id === oldId ? { ...t, id: newId, entityId: newEntityId } : t
      ),
      activeTabId: s.activeTabId === oldId ? newId : s.activeTabId,
    }));
  },

  updateTabTitle: (tabId, title) => {
    set((s) => ({
      openTabs: s.openTabs.map((t) => (t.id === tabId ? { ...t, title } : t)),
    }));
  },

  reorderTab: (fromIndex, toIndex) => {
    set((s) => {
      const newTabs = [...s.openTabs];
      const [moved] = newTabs.splice(fromIndex, 1);
      newTabs.splice(toIndex, 0, moved);
      return { openTabs: newTabs };
    });
  },
}));
