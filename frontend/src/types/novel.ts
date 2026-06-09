export type NovelStatus = 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED';

export interface Novel {
  id: number;
  title: string;
  description: string;
  status: NovelStatus;
  chapterCount: number;
  characterCount: number;
  itemCount: number;
  worldBuildingCount: number;
  createdAt: string;
  updatedAt: string;
}
