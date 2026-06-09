import { create } from 'zustand';
import { apiClient } from '../lib/api-client';
import type { WorldBuilding } from '../types';

interface WorldBuildingState {
  items: WorldBuilding[];
  loading: boolean;
  error: string | null;

  fetchAll: (novelId: number) => Promise<void>;
  fetchById: (novelId: number, id: number) => Promise<WorldBuilding>;
  create: (novelId: number, data: Partial<WorldBuilding>) => Promise<WorldBuilding>;
  update: (novelId: number, id: number, data: Partial<WorldBuilding>) => Promise<WorldBuilding>;
  remove: (novelId: number, id: number) => Promise<void>;
  clearError: () => void;
}

export const useWorldBuildingStore = create<WorldBuildingState>((set) => ({
  items: [],
  loading: false,
  error: null,

  fetchAll: async (novelId: number) => {
    set({ loading: true, error: null });
    try {
      const items = await apiClient.get<WorldBuilding[]>(`/api/novels/${novelId}/worldbuilding`);
      set({ items, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  fetchById: async (novelId: number, id: number) => {
    return apiClient.get<WorldBuilding>(`/api/novels/${novelId}/worldbuilding/${id}`);
  },

  create: async (novelId, data) => {
    const item = await apiClient.post<WorldBuilding>(`/api/novels/${novelId}/worldbuilding`, data);
    set((s) => ({ items: [...s.items, item] }));
    return item;
  },

  update: async (novelId, id, data) => {
    const item = await apiClient.put<WorldBuilding>(`/api/novels/${novelId}/worldbuilding/${id}`, data);
    set((s) => ({ items: s.items.map((i) => (i.id === id ? item : i)) }));
    return item;
  },

  remove: async (novelId, id) => {
    await apiClient.delete(`/api/novels/${novelId}/worldbuilding/${id}`);
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
  },

  clearError: () => set({ error: null }),
}));
