import { create } from 'zustand';
import { apiClient } from '../lib/api-client';
import type { Chapter } from '../types';

interface ChapterState {
  chapters: Chapter[];
  currentChapter: Chapter | null;
  loading: boolean;
  error: string | null;

  fetchAll: (novelId: number) => Promise<void>;
  fetchById: (novelId: number, id: number) => Promise<Chapter>;
  create: (novelId: number, data: Partial<Chapter>) => Promise<Chapter>;
  update: (novelId: number, id: number, data: Partial<Chapter>) => Promise<Chapter>;
  remove: (novelId: number, id: number) => Promise<void>;
  clearError: () => void;
}

export const useChapterStore = create<ChapterState>((set) => ({
  chapters: [],
  currentChapter: null,
  loading: false,
  error: null,

  fetchAll: async (novelId: number) => {
    set({ loading: true, error: null });
    try {
      const chapters = await apiClient.get<Chapter[]>(`/api/novels/${novelId}/chapters`);
      set({ chapters, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  fetchById: async (novelId: number, id: number) => {
    const chapter = await apiClient.get<Chapter>(`/api/novels/${novelId}/chapters/${id}`);
    set({ currentChapter: chapter });
    return chapter;
  },

  create: async (novelId, data) => {
    const chapter = await apiClient.post<Chapter>(`/api/novels/${novelId}/chapters`, data);
    set((s) => ({ chapters: [...s.chapters, chapter] }));
    return chapter;
  },

  update: async (novelId, id, data) => {
    const chapter = await apiClient.put<Chapter>(`/api/novels/${novelId}/chapters/${id}`, data);
    set((s) => ({
      chapters: s.chapters.map((c) => (c.id === id ? { ...c, ...chapter } : c)),
      currentChapter: s.currentChapter?.id === id ? chapter : s.currentChapter,
    }));
    return chapter;
  },

  remove: async (novelId, id) => {
    await apiClient.delete(`/api/novels/${novelId}/chapters/${id}`);
    set((s) => ({
      chapters: s.chapters.filter((c) => c.id !== id),
      currentChapter: s.currentChapter?.id === id ? null : s.currentChapter,
    }));
  },

  clearError: () => set({ error: null }),
}));
