import { Plus, Settings, FileDown, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLayoutStore } from '../../stores/useLayoutStore';
import { useNovelStore } from '../../stores/useNovelStore';

export default function Toolbar() {
  const { t } = useTranslation();
  const selectedNovelId = useNovelStore((s) => s.selectedNovelId);
  const openTab = useLayoutStore((s) => s.openTab);

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 border-b border-gray-700 select-none shrink-0">
      <span className="text-sm font-semibold text-blue-400 mr-2">StorySpark</span>

      <button
        onClick={() => selectedNovelId && openTab('chapter', null, t('chapter.new'))}
        disabled={!selectedNovelId}
        className="flex items-center gap-1.5 px-3 py-1 text-sm text-gray-300 hover:text-gray-100 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed rounded transition-colors"
        title={t('toolbar.newChapterTitle')}
      >
        <Plus className="w-4 h-4" />
        {t('toolbar.newChapter')}
      </button>

      <button
        onClick={() => openTab('settings', null, t('settings.title'))}
        className="flex items-center gap-1.5 px-3 py-1 text-sm text-gray-300 hover:text-gray-100 hover:bg-gray-700 rounded transition-colors"
        title={t('toolbar.settingsTitle')}
      >
        <Settings className="w-4 h-4" />
        {t('toolbar.settings')}
      </button>

      <div className="flex-1" />

      <button
        disabled
        className="flex items-center gap-1.5 px-3 py-1 text-sm text-gray-500 cursor-not-allowed rounded"
        title={t('toolbar.exportTitle')}
      >
        <FileDown className="w-4 h-4" />
        {t('toolbar.export')}
      </button>

      <button
        onClick={() => selectedNovelId && openTab('batch-gen', null, t('toolbar.batchGen'))}
        disabled={!selectedNovelId}
        className="flex items-center gap-1.5 px-3 py-1 text-sm text-gray-300 hover:text-gray-100 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed rounded transition-colors"
        title={t('toolbar.batchGenTitle')}
      >
        <BookOpen className="w-4 h-4" />
        {t('toolbar.batchGen')}
      </button>
    </div>
  );
}
