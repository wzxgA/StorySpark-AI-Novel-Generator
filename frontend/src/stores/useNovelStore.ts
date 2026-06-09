import { create } from 'zustand';
import { apiClient } from '../lib/api-client';
import type { Novel } from '../types';

interface NovelState {
  novels: Novel[];
  selectedNovelId: number | null;
  loading: boolean;
  error: string | null;

  fetchAll: () => Promise<void>;
  fetchById: (id: number) => Promise<Novel>;
  create: (data: Partial<Novel>) => Promise<Novel>;
  update: (id: number, data: Partial<Novel>) => Promise<Novel>;
  remove: (id: number) => Promise<void>;
  selectNovel: (id: number | null) => void;
  clearError: () => void;
}

export const useNovelStore = create<NovelState>((set) => ({
  novels: [],
  selectedNovelId: null,
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const novels = await apiClient.get<Novel[]>('/api/novels');
      set((s) => ({
        novels,
        loading: false,
        selectedNovelId: s.selectedNovelId ?? (novels.length > 0 ? novels[0].id : null),
      }));
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  fetchById: async (id: number) => {
    const novel = await apiClient.get<Novel>(`/api/novels/${id}`);
    return novel;
  },

  create: async (data) => {
    const novel = await apiClient.post<Novel>('/api/novels', data);
    set((s) => ({ novels: [novel, ...s.novels], selectedNovelId: novel.id }));
    return novel;
  },

  update: async (id, data) => {
    const novel = await apiClient.put<Novel>(`/api/novels/${id}`, data);
    set((s) => ({
      novels: s.novels.map((n) => (n.id === id ? { ...n, ...novel } : n)),
    }));
    return novel;
  },

  remove: async (id) => {
    await apiClient.delete(`/api/novels/${id}`);
    set((s) => ({
      novels: s.novels.filter((n) => n.id !== id),
      selectedNovelId: s.selectedNovelId === id ? null : s.selectedNovelId,
    }));
  },

  selectNovel: (id) => set({ selectedNovelId: id }),
  clearError: () => set({ error: null }),
}));
