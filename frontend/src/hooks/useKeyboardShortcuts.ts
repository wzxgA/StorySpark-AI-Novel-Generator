import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNovelStore } from '../stores/useNovelStore';
import { useLayoutStore } from '../stores/useLayoutStore';

export function useKeyboardShortcuts() {
  const { t } = useTranslation();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (!e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) return;

      switch (e.key.toLowerCase()) {
        case 'n': {
          e.preventDefault();
          const selectedNovelId = useNovelStore.getState().selectedNovelId;
          if (selectedNovelId) {
            useLayoutStore.getState().openTab('chapter', null, t('sidebar.newChapter'));
          }
          break;
        }
        case 'g': {
          e.preventDefault();
          const selectedNovelId = useNovelStore.getState().selectedNovelId;
          if (selectedNovelId) {
            useLayoutStore.getState().openTab('batch-gen', null, t('toolbar.batchGen'));
          }
          break;
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [t]);
}
