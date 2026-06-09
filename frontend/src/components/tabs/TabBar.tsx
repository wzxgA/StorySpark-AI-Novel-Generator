import { useState } from 'react';
import { X, BookOpen, Users, Package, Globe, FileText, List, ScrollText, Map, Settings, GripVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useLayoutStore } from '../../stores/useLayoutStore';
import type { EntityType, Tab } from '../../types';

const typeIcons: Record<EntityType, typeof BookOpen> = {
  novel: BookOpen,
  chapter: FileText,
  character: Users,
  item: Package,
  worldbuilding: Globe,
  outline: Map,
  synopsis: List,
  'chapter-plan': ScrollText,
  'settings': Settings,
  'batch-gen': BookOpen,
};

function SortableTab({ tab, isActive }: { tab: Tab; isActive: boolean }) {
  const { setActiveTab, closeTab } = useLayoutStore();
  const Icon = typeIcons[tab.type] || FileText;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border-r border-gray-700 whitespace-nowrap transition-colors shrink-0 ${
        isDragging ? 'opacity-40 z-50' : ''
      } ${
        isActive
          ? 'bg-gray-900 text-blue-400 border-t-2 border-t-blue-400 border-b-transparent'
          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
      }`}
    >
      <span
        {...attributes}
        {...listeners}
        className="flex items-center gap-1.5 flex-1 min-w-0 cursor-pointer"
        onClick={() => setActiveTab(tab.id)}
      >
        <GripVertical className="w-3 h-3 shrink-0 text-gray-500 hover:text-gray-300" />
        <Icon className="w-3 h-3 shrink-0" />
        <span className="max-w-40 truncate">{tab.title}</span>
      </span>
      <button
        onPointerDown={(e) => {
          e.stopPropagation();
          closeTab(tab.id);
        }}
        className="ml-1 p-0.5 hover:bg-gray-600 rounded transition-colors shrink-0"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

export default function TabBar() {
  const { t } = useTranslation();
  const { openTabs, activeTabId, reorderTab } = useLayoutStore();
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  if (openTabs.length === 0) {
    return (
      <div className="flex items-center px-3 py-1.5 border-b border-gray-700 text-xs text-gray-500 select-none">
        {t('tabs.noTabs')}
      </div>
    );
  }

  const activeDragTab = openTabs.find((t) => t.id === activeDragId);

  return (
    <div className="flex items-center border-b border-gray-700 bg-gray-850 overflow-x-auto shrink-0 select-none">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(event) => {
          setActiveDragId(event.active.id as string);
        }}
        onDragEnd={(event) => {
          setActiveDragId(null);
          const { active, over } = event;
          if (over && active.id !== over.id) {
            const oldIndex = openTabs.findIndex((t) => t.id === active.id);
            const newIndex = openTabs.findIndex((t) => t.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
              reorderTab(oldIndex, newIndex);
            }
          }
        }}
        onDragCancel={() => setActiveDragId(null)}
      >
        <SortableContext items={openTabs.map((t) => t.id)} strategy={horizontalListSortingStrategy}>
          {openTabs.map((tab) => (
            <SortableTab
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeTabId}
            />
          ))}
        </SortableContext>

        <DragOverlay>
          {activeDragTab ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-800 border border-blue-500 rounded shadow-lg text-blue-400 whitespace-nowrap">
              {(() => {
                const Icon = typeIcons[activeDragTab.type] || FileText;
                return <Icon className="w-3 h-3 shrink-0" />;
              })()}
              <span className="max-w-40 truncate">{activeDragTab.title}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
