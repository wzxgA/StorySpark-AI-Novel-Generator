import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useLayoutStore } from '../../stores/useLayoutStore';
import { useNovelStore } from '../../stores/useNovelStore';
import { useChapterStore } from '../../stores/useChapterStore';
import { getBaseUrl } from '../../lib/api-client';

interface Props {
  open: boolean;
  anchorRect: DOMRect | null;
  onClose: () => void;
}

export default function ExportDropdown({ open, anchorRect, onClose }: Props) {
  const { t } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);
  const activeTabId = useLayoutStore((s) => s.activeTabId);
  const openTabs = useLayoutStore((s) => s.openTabs);
  const selectedNovelId = useNovelStore((s) => s.selectedNovelId);
  const chapters = useChapterStore((s) => s.chapters);

  const activeTab = openTabs.find((t) => t.id === activeTabId);
  const isChapterTab = activeTab?.type === 'chapter' && activeTab?.entityId != null;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('click', handler);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handler);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open || !anchorRect || !selectedNovelId) return null;

  const downloadFile = async (url: string, filename: string) => {
    try {
      const base = await getBaseUrl();
      const res = await fetch(`${base}${url}`);
      if (!res.ok) throw new Error(`Export failed: ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      onClose();
    } catch (e: any) {
      console.error('Export failed:', e);
    }
  };

  const formats = [
    { key: 'markdown' as const, ext: '.md', i18nKey: 'formatMarkdown' },
    { key: 'txt' as const, ext: '.txt', i18nKey: 'formatTxt' },
    { key: 'pdf' as const, ext: '.pdf', i18nKey: 'formatPdf' },
  ];

  const getChapterFileName = (format: string, ext: string) => {
    const ch = chapters.find((c) => c.id === activeTab?.entityId);
    const num = ch?.chapterNumber ?? '?';
    const title = ch?.title ?? 'chapter';
    return `chapter${num}_${title}${ext}`;
  };

  const novelTitle = useNovelStore.getState().novels.find((n) => n.id === selectedNovelId)?.title ?? 'novel';

  const novelFileName = (ext: string) => `${novelTitle}${ext}`;

  const menuWidth = 200;
  const left = Math.min(anchorRect.right, window.innerWidth - menuWidth - 8);
  const top = anchorRect.bottom + 4;

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[100] bg-gray-800 border border-gray-600 rounded-md shadow-2xl py-1 min-w-[190px]"
      style={{ left, top }}
    >
      {isChapterTab && (
        <>
          <div className="px-3 py-1 text-xs text-gray-500 uppercase tracking-wide">
            {t('export.currentChapter')}
          </div>
          {formats.map((f) => (
            <button
              key={`ch-${f.key}`}
              onClick={() => {
                const url = `/api/novels/${selectedNovelId}/export/${f.key}?chapterId=${activeTab!.entityId}`;
                downloadFile(url, getChapterFileName(f.key, f.ext));
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left text-gray-200 hover:bg-gray-700 transition-colors"
            >
              {t(`export.${f.i18nKey}`)}
            </button>
          ))}
          <div className="my-1 border-t border-gray-700" />
        </>
      )}
      <div className="px-3 py-1 text-xs text-gray-500 uppercase tracking-wide">
        {t('export.allChapters')}
      </div>
      {formats.map((f) => (
        <button
          key={`all-${f.key}`}
          onClick={() => {
            downloadFile(`/api/novels/${selectedNovelId}/export/${f.key}`, novelFileName(f.ext));
          }}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left text-gray-200 hover:bg-gray-700 transition-colors"
        >
          {t(`export.${f.i18nKey}`)}
        </button>
      ))}
    </div>,
    document.body,
  );
}
