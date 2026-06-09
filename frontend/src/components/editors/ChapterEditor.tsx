import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { Sparkles, StopCircle } from 'lucide-react';
import EntityFormWrapper from '../shared/EntityFormWrapper';
import { useChapterStore } from '../../stores/useChapterStore';
import { useLayoutStore } from '../../stores/useLayoutStore';
import { useGenerationStore } from '../../stores/useGenerationStore';
import type { ChapterStatus } from '../../types';

interface Props {
  novelId: number;
  entityId: number | null;
}

const STATUS_OPTIONS: ChapterStatus[] = ['DRAFT', 'IN_PROGRESS', 'COMPLETED'];

export default function ChapterEditor({ novelId, entityId }: Props) {
  const { t } = useTranslation();
  const { chapters, fetchById, create, update, remove } = useChapterStore();
  const { closeTab, updateTabTitle, replaceTabId } = useLayoutStore();
  const {
    isGenerating,
    generatingChapterId,
    streamingContent,
    error: genError,
    startGeneration,
    stopGeneration,
    clearError: clearGenError,
  } = useGenerationStore();

  const [form, setForm] = useState({
    chapterNumber: 0,
    title: '',
    content: '',
    status: 'DRAFT' as ChapterStatus,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const isCurrentChapterGenerating = isGenerating && generatingChapterId === entityId;

  useEffect(() => {
    if (entityId) {
      const cached = chapters.find((c) => c.id === entityId);
      if (cached) {
        setForm({
          chapterNumber: cached.chapterNumber,
          title: cached.title,
          content: cached.content || '',
          status: cached.status,
        });
      } else {
        fetchById(novelId, entityId).then((ch) => {
          setForm({
            chapterNumber: ch.chapterNumber,
            title: ch.title,
            content: ch.content || '',
            status: ch.status,
          });
        });
      }
    }
  }, [entityId, chapters, novelId, fetchById]);

  const computeWordCount = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    // Count CJK characters individually, plus whitespace-separated words for the rest
    let count = 0;
    let nonCjk = '';
    for (const ch of trimmed) {
      if (/[一-鿿㐀-䶿豈-﫿]/.test(ch)) {
        if (nonCjk) { count += nonCjk.trim().split(/\s+/).filter(Boolean).length; nonCjk = ''; }
        count++;
      } else {
        nonCjk += ch;
      }
    }
    if (nonCjk) count += nonCjk.trim().split(/\s+/).filter(Boolean).length;
    return count;
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = { ...form, wordCount: computeWordCount(form.content) };
      if (entityId) {
        const updated = await update(novelId, entityId, data);
        updateTabTitle(`chapter-${entityId}`, `Ch.${updated.chapterNumber} ${updated.title}`);
      } else {
        const created = await create(novelId, data);
        replaceTabId('chapter', `chapter-${created.id}`, created.id);
        updateTabTitle(`chapter-${created.id}`, `Ch.${created.chapterNumber} ${created.title}`);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!entityId || !confirm(t('chapter.deleteConfirm'))) return;
    try {
      await remove(novelId, entityId);
      closeTab(`chapter-${entityId}`);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleGenerate = () => {
    if (!entityId) return;
    if (form.content && !confirm(t('chapter.overwriteConfirm'))) return;
    clearGenError();
    setShowPreview(true);
    startGeneration(novelId, entityId);
  };

  const handleStop = () => {
    stopGeneration();
    const content = useGenerationStore.getState().streamingContent;
    if (content) {
      setForm((f) => ({ ...f, content }));
    }
    setShowPreview(false);
  };

  // Ctrl+Enter to trigger generation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey && e.key === 'Enter') {
        e.preventDefault();
        if (!isGenerating && entityId) handleGenerate();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isGenerating, entityId, handleGenerate]);

  useEffect(() => {
    if (!isGenerating && generatingChapterId === null && streamingContent && showPreview && entityId) {
      const content = streamingContent;
      const wc = content.trim() ? content.trim().split(/\s+/).length : 0;
      setForm((f) => ({ ...f, content }));
      setShowPreview(false);
      update(novelId, entityId, { content, wordCount: wc }).catch(() => {});
    }
  }, [isGenerating, generatingChapterId, streamingContent, showPreview, entityId, novelId, update]);

  const wordCount = computeWordCount(form.content);

  return (
    <EntityFormWrapper
      title={entityId ? `Ch.${form.chapterNumber} ${form.title}` : t('chapter.new')}
      loading={loading}
      error={error || genError}
      onSave={handleSave}
      onDelete={entityId ? handleDelete : undefined}
      extraActions={
        entityId ? (
          isCurrentChapterGenerating ? (
            <button
              onClick={handleStop}
              className="flex items-center gap-1.5 px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            >
              <StopCircle className="w-4 h-4" />
              {t('chapter.stop')}
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded transition-colors"
              title={t('chapter.aiGenerateTitle')}
            >
              <Sparkles className="w-4 h-4" />
              {t('chapter.aiGenerate')}
            </button>
          )
        ) : null
      }
    >
      <div className="space-y-4 max-w-3xl">
        <div className="flex gap-4">
          <div className="w-24">
            <label className="block text-sm text-gray-400 mb-1">{t('chapter.number')}</label>
            <input
              type="number"
              value={form.chapterNumber || ''}
              onChange={(e) => setForm({ ...form, chapterNumber: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-blue-500"
              placeholder={t('chapter.autoPlaceholder')}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-1">{t('chapter.title')}</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-blue-500"
              placeholder={t('chapter.titlePlaceholder')}
            />
          </div>
          <div className="w-32">
            <label className="block text-sm text-gray-400 mb-1">{t('chapter.status')}</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as ChapterStatus })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-blue-500"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {isCurrentChapterGenerating ? (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-gray-400">{t('chapter.aiGenerating')}</label>
              <span className="text-xs text-blue-400 animate-pulse">
                {t('chapter.streaming')}
              </span>
            </div>
            <div className="w-full p-4 bg-gray-800 border border-blue-600 rounded min-h-[400px] max-h-[600px] overflow-y-auto">
              <div className="prose prose-invert prose-sm max-w-none text-gray-100">
                <ReactMarkdown>{streamingContent || `_${t('chapter.waitingAI')}_`}</ReactMarkdown>
              </div>
              <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-0.5" />
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-gray-400">{t('chapter.content')}</label>
              <span className="text-xs text-gray-500">{t('editor.words', { count: wordCount })}</span>
            </div>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={20}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm font-mono leading-relaxed focus:outline-none focus:border-blue-500 resize-y"
              placeholder={t('chapter.contentPlaceholder')}
            />
          </div>
        )}
      </div>
    </EntityFormWrapper>
  );
}
