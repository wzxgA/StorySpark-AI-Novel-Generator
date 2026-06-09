import { X, BookOpen, Users, Package, Globe, FileText, List, ScrollText, Map, Settings } from 'lucide-react';
import { useLayoutStore } from '../../stores/useLayoutStore';
import type { EntityType } from '../../types';

const typeIcons: Record<EntityType, typeof BookOpen> = {
  novel: BookOpen,
  chapter: FileText,
  character: Users,
  item: Package,
  worldbuilding: Globe,
  outline: Map,
  synopsis: List,
  'chapter-plan': ScrollText,
  'ai-config': Settings,
};

export default function TabBar() {
  const { openTabs, activeTabId, setActiveTab, closeTab } = useLayoutStore();

  if (openTabs.length === 0) {
    return (
      <div className="flex items-center px-3 py-1.5 border-b border-gray-700 text-xs text-gray-500 select-none">
        No tabs open — select an item from the project tree
      </div>
    );
  }

  return (
    <div className="flex items-center border-b border-gray-700 bg-gray-850 overflow-x-auto shrink-0 select-none">
      {openTabs.map((tab) => {
        const Icon = typeIcons[tab.type] || FileText;
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer border-r border-gray-700 whitespace-nowrap transition-colors ${
              isActive
                ? 'bg-gray-900 text-blue-400 border-t-2 border-t-blue-400 border-b-transparent'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            <Icon className="w-3 h-3 shrink-0" />
            <span className="max-w-40 truncate">{tab.title}</span>
            <button
              onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
              className="ml-1 p-0.5 hover:bg-gray-600 rounded transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
