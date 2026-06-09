import { create } from 'zustand';
import { apiClient } from '../lib/api-client';
import type { Item } from '../types';

interface ItemState {
  items: Item[];
  loading: boolean;
  error: string | null;

  fetchAll: (novelId: number) => Promise<void>;
  fetchById: (novelId: number, id: number) => Promise<Item>;
  create: (novelId: number, data: Partial<Item>) => Promise<Item>;
  update: (novelId: number, id: number, data: Partial<Item>) => Promise<Item>;
  remove: (novelId: number, id: number) => Promise<void>;
  clearError: () => void;
}

export const useItemStore = create<ItemState>((set) => ({
  items: [],
  loading: false,
  error: null,

  fetchAll: async (novelId: number) => {
    set({ loading: true, error: null });
    try {
      const items = await apiClient.get<Item[]>(`/api/novels/${novelId}/items`);
      set({ items, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  fetchById: async (novelId: number, id: number) => {
    return apiClient.get<Item>(`/api/novels/${novelId}/items/${id}`);
  },

  create: async (novelId, data) => {
    const item = await apiClient.post<Item>(`/api/novels/${novelId}/items`, data);
    set((s) => ({ items: [...s.items, item] }));
    return item;
  },

  update: async (novelId, id, data) => {
    const item = await apiClient.put<Item>(`/api/novels/${novelId}/items/${id}`, data);
    set((s) => ({ items: s.items.map((i) => (i.id === id ? item : i)) }));
    return item;
  },

  remove: async (novelId, id) => {
    await apiClient.delete(`/api/novels/${novelId}/items/${id}`);
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
  },

  clearError: () => set({ error: null }),
}));
