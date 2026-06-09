import { create } from 'zustand';
import { streamGenerate, apiClient } from '../lib/api-client';
import type { StreamCallbacks } from '../lib/api-client';
import { useChapterStore } from './useChapterStore';

export interface ChapterStatus {
  chapterNumber: number;
  status: 'pending' | 'generating' | 'done' | 'error';
  wordCount: number;
  error?: string;
}

export interface GeneratedChapter {
  chapterId: number;
  chapterNumber: number;
  title: string;
  content: string;
  wordCount: number;
  confirmed: boolean;
}

interface BatchGenerationState {
  isGenerating: boolean;
  startChapter: number;
  endChapter: number;
  totalChapters: number;
  completedChapters: number;
  currentChapterId: number | null;
  currentChapterNumber: number | null;
  streamingContent: string;
  chapterStatuses: ChapterStatus[];
  generatedChapters: GeneratedChapter[];
  error: string | null;
  abortController: AbortController | null;

  startBatchGeneration: (novelId: number, startChapter: number, endChapter: number) => void;
  stopBatchGeneration: () => void;
  confirmChapter: (novelId: number, chapterId: number) => Promise<void>;
  discardChapter: (novelId: number, chapterId: number) => Promise<void>;
  reset: () => void;
}

export const useBatchGenerationStore = create<BatchGenerationState>((set, get) => ({
  isGenerating: false,
  startChapter: 0,
  endChapter: 0,
  totalChapters: 0,
  completedChapters: 0,
  currentChapterId: null,
  currentChapterNumber: null,
  streamingContent: '',
  chapterStatuses: [],
  generatedChapters: [],
  error: null,
  abortController: null,

  startBatchGeneration: (novelId: number, startChapter: number, endChapter: number) => {
    get().abortController?.abort();

    const totalChapters = endChapter - startChapter + 1;
    const chapterStatuses: ChapterStatus[] = [];
    for (let i = startChapter; i <= endChapter; i++) {
      chapterStatuses.push({ chapterNumber: i, status: 'pending', wordCount: 0 });
    }

    set({
      isGenerating: true,
      startChapter,
      endChapter,
      totalChapters,
      completedChapters: 0,
      currentChapterId: null,
      currentChapterNumber: null,
      streamingContent: '',
      chapterStatuses,
      generatedChapters: [],
      error: null,
    });

    const callbacks: StreamCallbacks = {
      onToken: (data) => {
        set((s) => ({ streamingContent: s.streamingContent + data.token }));
      },
      onDone: () => {
        // Single-chapter done — handled by chapter-done in batch mode
      },
      onError: (data) => {
        set((s) => {
          const errorChapterNumber = data.chapterNumber ?? s.currentChapterNumber;
          const updated = s.chapterStatuses.map((cs) =>
            cs.chapterNumber === errorChapterNumber
              ? { ...cs, status: 'error' as const, error: data.message }
              : cs
          );
          return { chapterStatuses: updated };
        });
      },
      onBatchStart: (data) => {
        set({ totalChapters: data.totalChapters });
      },
      onChapterStart: (data) => {
        set((s) => {
          const updated = s.chapterStatuses.map((cs) =>
            cs.chapterNumber === data.chapterNumber
              ? { ...cs, status: 'generating' as const }
              : cs
          );
          return {
            currentChapterId: data.chapterId,
            currentChapterNumber: data.chapterNumber,
            streamingContent: '',
            chapterStatuses: updated,
          };
        });
      },
      onChapterDone: (data) => {
        set((s) => {
          const updated = s.chapterStatuses.map((cs) =>
            cs.chapterNumber === data.chapterNumber
              ? { ...cs, status: 'done' as const, wordCount: data.wordCount }
              : cs
          );
          return {
            completedChapters: data.completedCount,
            chapterStatuses: updated,
            generatedChapters: [
              ...s.generatedChapters,
              {
                chapterId: data.chapterId,
                chapterNumber: data.chapterNumber,
                title: data.title || '',
                content: data.content || '',
                wordCount: data.wordCount,
                confirmed: false,
              },
            ],
          };
        });
      },
      onBatchDone: () => {
        set({
          isGenerating: false,
          currentChapterId: null,
          currentChapterNumber: null,
          abortController: null,
        });
      },
    };

    const controller = streamGenerate(
      `/api/novels/${novelId}/chapters/batch-generate`,
      { startChapter, endChapter },
      callbacks,
    );

    set({ abortController: controller });
  },

  stopBatchGeneration: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }
    set({ isGenerating: false, abortController: null });
  },

  confirmChapter: async (novelId, chapterId) => {
    const gc = get().generatedChapters.find((g) => g.chapterId === chapterId);
    await apiClient.post(`/api/novels/${novelId}/chapters/${chapterId}/confirm`, {
      content: gc?.content || '',
      wordCount: gc?.wordCount || 0,
    });
    set((s) => ({
      generatedChapters: s.generatedChapters.map((gc) =>
        gc.chapterId === chapterId ? { ...gc, confirmed: true } : gc
      ),
    }));
    // Refresh sidebar chapter list so the confirmed chapter appears immediately
    useChapterStore.getState().fetchAll(novelId);
  },

  discardChapter: async (novelId, chapterId) => {
    await apiClient.delete(`/api/novels/${novelId}/chapters/${chapterId}/discard`);
    set((s) => {
      const discarded = s.generatedChapters.find((gc) => gc.chapterId === chapterId);
      return {
        generatedChapters: s.generatedChapters.filter((gc) => gc.chapterId !== chapterId),
        chapterStatuses: s.chapterStatuses.map((cs) =>
          cs.chapterNumber === discarded?.chapterNumber
            ? { ...cs, status: 'pending' as const, wordCount: 0 }
            : cs
        ),
        completedChapters: Math.max(0, s.completedChapters - 1),
      };
    });
  },

  reset: () => set({
    isGenerating: false,
    startChapter: 0,
    endChapter: 0,
    totalChapters: 0,
    completedChapters: 0,
    currentChapterId: null,
    currentChapterNumber: null,
    streamingContent: '',
    chapterStatuses: [],
    generatedChapters: [],
    error: null,
    abortController: null,
  }),
}));
