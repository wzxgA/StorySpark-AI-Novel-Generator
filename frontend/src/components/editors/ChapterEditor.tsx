import { useState, useEffect } from 'react';
import EntityFormWrapper from '../shared/EntityFormWrapper';
import { useChapterStore } from '../../stores/useChapterStore';
import { useLayoutStore } from '../../stores/useLayoutStore';
import type { ChapterStatus } from '../../types';

interface Props {
  novelId: number;
  entityId: number | null;
}

const STATUS_OPTIONS: ChapterStatus[] = ['DRAFT', 'IN_PROGRESS', 'COMPLETED'];

export default function ChapterEditor({ novelId, entityId }: Props) {
  const { chapters, fetchById, create, update, remove } = useChapterStore();
  const { closeTab, updateTabTitle, replaceTabId } = useLayoutStore();
  const [form, setForm] = useState({
    chapterNumber: 0,
    title: '',
    content: '',
    status: 'DRAFT' as ChapterStatus,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    return trimmed ? trimmed.split(/\s+/).length : 0;
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
    if (!entityId || !confirm('Delete this chapter?')) return;
    try {
      await remove(novelId, entityId);
      closeTab(`chapter-${entityId}`);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const wordCount = computeWordCount(form.content);

  return (
    <EntityFormWrapper
      title={entityId ? `Ch.${form.chapterNumber} ${form.title}` : 'New Chapter'}
      loading={loading}
      error={error}
      onSave={handleSave}
      onDelete={entityId ? handleDelete : undefined}
    >
      <div className="space-y-4 max-w-3xl">
        <div className="flex gap-4">
          <div className="w-24">
            <label className="block text-sm text-gray-400 mb-1">Number</label>
            <input
              type="number"
              value={form.chapterNumber || ''}
              onChange={(e) => setForm({ ...form, chapterNumber: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-blue-500"
              placeholder="Auto"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-1">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-blue-500"
              placeholder="Chapter title"
            />
          </div>
          <div className="w-32">
            <label className="block text-sm text-gray-400 mb-1">Status</label>
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

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm text-gray-400">Content</label>
            <span className="text-xs text-gray-500">{wordCount} words</span>
          </div>
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={20}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm font-mono leading-relaxed focus:outline-none focus:border-blue-500 resize-y"
            placeholder="Write your chapter content here..."
          />
        </div>
      </div>
    </EntityFormWrapper>
  );
}
