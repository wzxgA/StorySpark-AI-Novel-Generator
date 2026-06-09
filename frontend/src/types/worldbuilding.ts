export type WorldBuildingCategory = 'GEOGRAPHY' | 'HISTORY' | 'MAGIC_SYSTEM' | 'POLITICS' | 'CULTURE' | 'RACES' | 'OTHER';

export interface WorldBuilding {
  id: number;
  novelId?: number;
  category: WorldBuildingCategory;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
