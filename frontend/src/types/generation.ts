export interface TokenEvent {
  token: string;
  chapterId: number;
}

export interface DoneEvent {
  chapterId: number;
  wordCount: number;
}

export interface ErrorEvent {
  message: string;
  chapterNumber?: number;
}

// Batch generation events
export interface BatchStartEvent {
  startChapter: number;
  endChapter: number;
  totalChapters: number;
}

export interface ChapterStartEvent {
  chapterId: number;
  chapterNumber: number;
}

export interface ChapterDoneEvent {
  chapterId: number;
  chapterNumber: number;
  title: string;
  content: string;
  wordCount: number;
  completedCount: number;
  totalCount: number;
}

export interface BatchDoneEvent {
  totalChapters: number;
  completedChapters: number;
}
