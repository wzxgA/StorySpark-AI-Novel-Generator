import { useState, useRef } from 'react';
import { Plus, Settings, FileDown, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLayoutStore } from '../../stores/useLayoutStore';
import { useNovelStore } from '../../stores/useNovelStore';
import ExportDropdown from '../export/ExportDropdown';

export default function Toolbar() {
  const { t } = useTranslation();
  const selectedNovelId = useNovelStore((s) => s.selectedNovelId);
  const createNovel = useNovelStore((s) => s.create);
  const openTab = useLayoutStore((s) => s.openTab);
  const [exportOpen, setExportOpen] = useState(false);
  const exportBtnRef = useRef<HTMLButtonElement>(null);

  const handleCreateNovel = async () => {
    const title = prompt(`${t('sidebar.novelTitle')}:`);
    if (!title?.trim()) return;
    await createNovel({ title: title.trim(), description: '' });
  };

  const handleExportClick = () => {
    setExportOpen((prev) => !prev);
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 border-b border-gray-700 select-none shrink-0">
      <span className="text-sm font-semibold text-blue-400 mr-2">StorySpark</span>

      <button
        onClick={handleCreateNovel}
        className="flex items-center gap-1.5 px-3 py-1 text-sm text-gray-300 hover:text-gray-100 hover:bg-gray-700 rounded transition-colors"
        title={t('toolbar.newNovelTitle')}
      >
        <Plus className="w-4 h-4" />
        {t('toolbar.newNovel')}
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
        ref={exportBtnRef}
        onClick={handleExportClick}
        disabled={!selectedNovelId}
        className="flex items-center gap-1.5 px-3 py-1 text-sm text-gray-300 hover:text-gray-100 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed rounded transition-colors"
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

      <ExportDropdown
        open={exportOpen}
        anchorRect={exportBtnRef.current?.getBoundingClientRect() ?? null}
        onClose={() => setExportOpen(false)}
      />
    </div>
  );
}
