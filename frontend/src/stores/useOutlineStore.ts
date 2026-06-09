import { create } from 'zustand';
import { apiClient } from '../lib/api-client';
import type { Outline } from '../types';

interface OutlineState {
  outline: Outline | null;
  loading: boolean;
  error: string | null;

  fetchByNovelId: (novelId: number) => Promise<Outline>;
  update: (novelId: number, data: Partial<Outline>) => Promise<Outline>;
  clearError: () => void;
}

export const useOutlineStore = create<OutlineState>((set) => ({
  outline: null,
  loading: false,
  error: null,

  fetchByNovelId: async (novelId: number) => {
    set({ loading: true, error: null });
    try {
      const outline = await apiClient.get<Outline>(`/api/novels/${novelId}/outline`);
      set({ outline, loading: false });
      return outline;
    } catch (e: any) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },

  update: async (novelId, data) => {
    const outline = await apiClient.put<Outline>(`/api/novels/${novelId}/outline`, data);
    set({ outline });
    return outline;
  },

  clearError: () => set({ error: null }),
}));
