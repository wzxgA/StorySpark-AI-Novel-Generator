export type ItemType = 'WEAPON' | 'ARTIFACT' | 'CONSUMABLE' | 'KEY_ITEM' | 'OTHER';

export interface Item {
  id: number;
  novelId?: number;
  name: string;
  description: string;
  significance: string;
  type: ItemType;
  createdAt: string;
  updatedAt: string;
}
