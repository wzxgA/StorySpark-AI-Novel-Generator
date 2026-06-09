import { create } from 'zustand';
import { apiClient } from '../lib/api-client';
import type { AIConfig, TestConnectionResult } from '../types';

interface AIConfigState {
  config: AIConfig | null;
  loading: boolean;
  testing: boolean;
  testResult: TestConnectionResult | null;
  error: string | null;

  fetchConfig: () => Promise<void>;
  saveConfig: (data: Partial<AIConfig>) => Promise<AIConfig>;
  testConnection: (data: Partial<AIConfig>) => Promise<TestConnectionResult>;
  clearTestResult: () => void;
  clearError: () => void;
}

export const useAIConfigStore = create<AIConfigState>((set) => ({
  config: null,
  loading: false,
  testing: false,
  testResult: null,
  error: null,

  fetchConfig: async () => {
    set({ loading: true, error: null });
    try {
      const config = await apiClient.get<AIConfig>('/api/ai-config');
      set({ config, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  saveConfig: async (data) => {
    const config = await apiClient.put<AIConfig>('/api/ai-config', data);
    set({ config });
    return config;
  },

  testConnection: async (data) => {
    set({ testing: true, testResult: null });
    try {
      const result = await apiClient.post<TestConnectionResult>('/api/ai-config/test', data);
      set({ testing: false, testResult: result });
      return result;
    } catch (e: any) {
      const result = { success: false, message: e.message };
      set({ testing: false, testResult: result });
      return result;
    }
  },

  clearTestResult: () => set({ testResult: null }),
  clearError: () => set({ error: null }),
}));
