export interface ChapterPlan {
  id: number;
  novelId: number;
  chapterRangeStart: number;
  chapterRangeEnd: number;
  outline: string;
  characterIds: string;
  itemIds: string;
  worldBuildingIds: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
