import { create } from 'zustand';
import { apiClient } from '../lib/api-client';
import type { Character } from '../types';

interface CharacterState {
  characters: Character[];
  loading: boolean;
  error: string | null;

  fetchAll: (novelId: number) => Promise<void>;
  fetchById: (novelId: number, id: number) => Promise<Character>;
  create: (novelId: number, data: Partial<Character>) => Promise<Character>;
  update: (novelId: number, id: number, data: Partial<Character>) => Promise<Character>;
  remove: (novelId: number, id: number) => Promise<void>;
  clearError: () => void;
}

export const useCharacterStore = create<CharacterState>((set) => ({
  characters: [],
  loading: false,
  error: null,

  fetchAll: async (novelId: number) => {
    set({ loading: true, error: null });
    try {
      const characters = await apiClient.get<Character[]>(`/api/novels/${novelId}/characters`);
      set({ characters, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  fetchById: async (novelId: number, id: number) => {
    return apiClient.get<Character>(`/api/novels/${novelId}/characters/${id}`);
  },

  create: async (novelId, data) => {
    const character = await apiClient.post<Character>(`/api/novels/${novelId}/characters`, data);
    set((s) => ({ characters: [...s.characters, character] }));
    return character;
  },

  update: async (novelId, id, data) => {
    const character = await apiClient.put<Character>(`/api/novels/${novelId}/characters/${id}`, data);
    set((s) => ({
      characters: s.characters.map((c) => (c.id === id ? character : c)),
    }));
    return character;
  },

  remove: async (novelId, id) => {
    await apiClient.delete(`/api/novels/${novelId}/characters/${id}`);
    set((s) => ({ characters: s.characters.filter((c) => c.id !== id) }));
  },

  clearError: () => set({ error: null }),
}));
