import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { X } from 'lucide-react';
import type { GeneratedChapter } from '../../stores/useBatchGenerationStore';

interface Props {
  open: boolean;
  chapter: GeneratedChapter | null;
  onClose: () => void;
}

export default function ChapterPreviewModal({ open, chapter, onClose }: Props) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open || !chapter) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-[800px] max-h-[85vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 shrink-0">
          <h2 className="text-lg font-semibold text-gray-100">
            {t('batchPanel.previewTitle', { num: chapter.chapterNumber, title: chapter.title })}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="prose prose-invert prose-sm max-w-none text-gray-100">
            <ReactMarkdown>{chapter.content}</ReactMarkdown>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-700 shrink-0">
          <span className="text-sm text-gray-400">
            {t('editor.words', { count: chapter.wordCount })}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm rounded transition-colors"
          >
            {t('batchPanel.close')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
