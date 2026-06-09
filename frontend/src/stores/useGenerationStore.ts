import { create } from 'zustand';
import { streamGenerate } from '../lib/api-client';
import type { StreamCallbacks } from '../lib/api-client';

interface GenerationState {
  isGenerating: boolean;
  generatingChapterId: number | null;
  streamingContent: string;
  error: string | null;
  abortController: AbortController | null;

  startGeneration: (novelId: number, chapterId: number) => void;
  stopGeneration: () => void;
  reset: () => void;
  clearError: () => void;
}

export const useGenerationStore = create<GenerationState>((set, get) => ({
  isGenerating: false,
  generatingChapterId: null,
  streamingContent: '',
  error: null,
  abortController: null,

  startGeneration: (novelId: number, chapterId: number) => {
    // Stop any existing generation
    get().abortController?.abort();

    set({
      isGenerating: true,
      generatingChapterId: chapterId,
      streamingContent: '',
      error: null,
    });

    const callbacks: StreamCallbacks = {
      onToken: (data) => {
        set((s) => ({ streamingContent: s.streamingContent + data.token }));
      },
      onDone: () => {
        // Mark generation as done; ChapterEditor picks up streamingContent
        set({ isGenerating: false, generatingChapterId: null, abortController: null });
      },
      onError: (data) => {
        set({
          isGenerating: false,
          generatingChapterId: null,
          error: data.message,
          abortController: null,
        });
      },
    };

    const controller = streamGenerate(
      `/api/novels/${novelId}/chapters/${chapterId}/generate`,
      {},
      callbacks,
    );

    set({ abortController: controller });
  },

  stopGeneration: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }
    set({ isGenerating: false, generatingChapterId: null, abortController: null });
  },

  reset: () => set({
    isGenerating: false,
    generatingChapterId: null,
    streamingContent: '',
    error: null,
    abortController: null,
  }),

  clearError: () => set({ error: null }),
}));
