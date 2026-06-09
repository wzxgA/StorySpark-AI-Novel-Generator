import { create } from 'zustand';
import { apiClient } from '../lib/api-client';
import type { ChapterPlan } from '../types';

interface ChapterPlanState {
  plans: ChapterPlan[];
  loading: boolean;
  error: string | null;

  fetchAll: (novelId: number) => Promise<void>;
  fetchById: (novelId: number, id: number) => Promise<ChapterPlan>;
  create: (novelId: number, data: Partial<ChapterPlan>) => Promise<ChapterPlan>;
  update: (novelId: number, id: number, data: Partial<ChapterPlan>) => Promise<ChapterPlan>;
  remove: (novelId: number, id: number) => Promise<void>;
  clearError: () => void;
}

export const useChapterPlanStore = create<ChapterPlanState>((set) => ({
  plans: [],
  loading: false,
  error: null,

  fetchAll: async (novelId: number) => {
    set({ loading: true, error: null });
    try {
      const plans = await apiClient.get<ChapterPlan[]>(`/api/novels/${novelId}/chapter-plans`);
      set({ plans, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  fetchById: async (novelId: number, id: number) => {
    return apiClient.get<ChapterPlan>(`/api/novels/${novelId}/chapter-plans/${id}`);
  },

  create: async (novelId, data) => {
    const plan = await apiClient.post<ChapterPlan>(`/api/novels/${novelId}/chapter-plans`, data);
    set((s) => ({ plans: [...s.plans, plan] }));
    return plan;
  },

  update: async (novelId, id, data) => {
    const plan = await apiClient.put<ChapterPlan>(`/api/novels/${novelId}/chapter-plans/${id}`, data);
    set((s) => ({ plans: s.plans.map((p) => (p.id === id ? plan : p)) }));
    return plan;
  },

  remove: async (novelId, id) => {
    await apiClient.delete(`/api/novels/${novelId}/chapter-plans/${id}`);
    set((s) => ({ plans: s.plans.filter((p) => p.id !== id) }));
  },

  clearError: () => set({ error: null }),
}));
