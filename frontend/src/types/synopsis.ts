export type SynopsisType = 'AUTO' | 'MANUAL';

export interface Synopsis {
  id: number;
  novelId?: number;
  title: string;
  chapterRangeStart: number;
  chapterRangeEnd: number;
  content: string;
  summaryType: SynopsisType;
  createdAt: string;
}
