import { create } from 'zustand';
import { apiClient } from '../lib/api-client';
import type { Synopsis } from '../types';

interface SynopsisState {
  synopses: Synopsis[];
  loading: boolean;
  error: string | null;

  fetchAll: (novelId: number) => Promise<void>;
  fetchById: (novelId: number, id: number) => Promise<Synopsis>;
  create: (novelId: number, data: Partial<Synopsis>) => Promise<Synopsis>;
  update: (novelId: number, id: number, data: Partial<Synopsis>) => Promise<Synopsis>;
  remove: (novelId: number, id: number) => Promise<void>;
  clearError: () => void;
}

export const useSynopsisStore = create<SynopsisState>((set) => ({
  synopses: [],
  loading: false,
  error: null,

  fetchAll: async (novelId: number) => {
    set({ loading: true, error: null });
    try {
      const synopses = await apiClient.get<Synopsis[]>(`/api/novels/${novelId}/synopses`);
      set({ synopses, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  fetchById: async (novelId: number, id: number) => {
    return apiClient.get<Synopsis>(`/api/novels/${novelId}/synopses/${id}`);
  },

  create: async (novelId, data) => {
    const synopsis = await apiClient.post<Synopsis>(`/api/novels/${novelId}/synopses`, data);
    set((s) => ({ synopses: [...s.synopses, synopsis] }));
    return synopsis;
  },

  update: async (novelId, id, data) => {
    const synopsis = await apiClient.put<Synopsis>(`/api/novels/${novelId}/synopses/${id}`, data);
    set((s) => ({ synopses: s.synopses.map((sp) => (sp.id === id ? synopsis : sp)) }));
    return synopsis;
  },

  remove: async (novelId, id) => {
    await apiClient.delete(`/api/novels/${novelId}/synopses/${id}`);
    set((s) => ({ synopses: s.synopses.filter((sp) => sp.id !== id) }));
  },

  clearError: () => set({ error: null }),
}));
