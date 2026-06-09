export type ChapterStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED';

export interface Chapter {
  id: number;
  novelId: number;
  chapterNumber: number;
  title: string;
  content: string;
  wordCount: number;
  status: ChapterStatus;
  createdAt: string;
  updatedAt: string;
}

export type ChapterSummary = Omit<Chapter, 'content'>;
