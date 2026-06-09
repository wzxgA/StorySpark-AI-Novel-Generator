import { Plus, Settings, FileDown, BookOpen } from 'lucide-react';
import { useLayoutStore } from '../../stores/useLayoutStore';
import { useNovelStore } from '../../stores/useNovelStore';

export default function Toolbar() {
  const selectedNovelId = useNovelStore((s) => s.selectedNovelId);
  const openTab = useLayoutStore((s) => s.openTab);

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 border-b border-gray-700 select-none shrink-0">
      <span className="text-sm font-semibold text-blue-400 mr-2">StorySpark</span>

      <button
        onClick={() => selectedNovelId && openTab('chapter', null, 'New Chapter')}
        disabled={!selectedNovelId}
        className="flex items-center gap-1.5 px-3 py-1 text-sm text-gray-300 hover:text-gray-100 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed rounded transition-colors"
        title="New Chapter (Ctrl+N)"
      >
        <Plus className="w-4 h-4" />
        New Chapter
      </button>

      <button
        onClick={() => openTab('ai-config', null, 'AI Config')}
        className="flex items-center gap-1.5 px-3 py-1 text-sm text-gray-300 hover:text-gray-100 hover:bg-gray-700 rounded transition-colors"
        title="AI Settings"
      >
        <Settings className="w-4 h-4" />
        AI Config
      </button>

      <div className="flex-1" />

      <button
        disabled
        className="flex items-center gap-1.5 px-3 py-1 text-sm text-gray-500 cursor-not-allowed rounded"
        title="Export (Coming in Phase 7)"
      >
        <FileDown className="w-4 h-4" />
        Export
      </button>

      <button
        disabled
        className="flex items-center gap-1.5 px-3 py-1 text-sm text-gray-500 cursor-not-allowed rounded"
        title="Batch Generate (Coming in Phase 4)"
      >
        <BookOpen className="w-4 h-4" />
        Batch Gen
      </button>
    </div>
  );
}
