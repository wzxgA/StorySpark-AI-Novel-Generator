import { create } from 'zustand';
import { streamGenerate } from '../lib/api-client';
import type { StreamCallbacks } from '../lib/api-client';

export interface ChapterStatus {
  chapterNumber: number;
  status: 'pending' | 'generating' | 'done' | 'error';
  wordCount: number;
  error?: string;
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
  error: string | null;
  abortController: AbortController | null;

  startBatchGeneration: (novelId: number, startChapter: number, endChapter: number) => void;
  stopBatchGeneration: () => void;
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
          const updated = s.chapterStatuses.map((cs) =>
            cs.chapterNumber === s.currentChapterNumber
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
    error: null,
    abortController: null,
  }),
}));
