export * from './novel';
export * from './chapter';
export * from './character';
export * from './item';
export * from './worldbuilding';
export * from './outline';
export * from './synopsis';
export * from './chapter-plan';
export * from './ai-config';

export type EntityType = 'novel' | 'chapter' | 'character' | 'item' | 'worldbuilding' | 'outline' | 'synopsis' | 'chapter-plan' | 'ai-config';

export interface Tab {
  id: string;
  type: EntityType;
  entityId: number | null;
  title: string;
}
