import { useState, useEffect } from 'react';
import EntityFormWrapper from '../shared/EntityFormWrapper';
import { useSynopsisStore } from '../../stores/useSynopsisStore';
import { useLayoutStore } from '../../stores/useLayoutStore';
import type { SynopsisType } from '../../types';

interface Props {
  novelId: number;
  entityId: number | null;
}

const TYPE_OPTIONS: SynopsisType[] = ['MANUAL', 'AUTO'];

export default function SynopsisEditor({ novelId, entityId }: Props) {
  const { synopses, fetchById, create, update, remove } = useSynopsisStore();
  const { closeTab, updateTabTitle, replaceTabId } = useLayoutStore();
  const [form, setForm] = useState({
    title: '',
    chapterRangeStart: 1,
    chapterRangeEnd: 1,
    content: '',
    summaryType: 'MANUAL' as SynopsisType,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (entityId) {
      const cached = synopses.find((s) => s.id === entityId);
      if (cached) {
        setForm({
          title: cached.title,
          chapterRangeStart: cached.chapterRangeStart,
          chapterRangeEnd: cached.chapterRangeEnd,
          content: cached.content || '',
          summaryType: cached.summaryType,
        });
      } else {
        fetchById(novelId, entityId).then((s) => {
          setForm({
            title: s.title,
            chapterRangeStart: s.chapterRangeStart,
            chapterRangeEnd: s.chapterRangeEnd,
            content: s.content || '',
            summaryType: s.summaryType,
          });
        });
      }
    }
  }, [entityId, synopses, novelId, fetchById]);

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setLoading(true);
    setError(null);
    try {
      if (entityId) {
        await update(novelId, entityId, form);
        updateTabTitle(`synopsis-${entityId}`, form.title);
      } else {
        const created = await create(novelId, form);
        replaceTabId('synopsis', `synopsis-${created.id}`, created.id);
        updateTabTitle(`synopsis-${created.id}`, created.title);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!entityId || !confirm('Delete this synopsis?')) return;
    try {
      await remove(novelId, entityId);
      closeTab(`synopsis-${entityId}`);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <EntityFormWrapper
      title={entityId ? form.title || 'Synopsis' : 'New Synopsis'}
      loading={loading}
      error={error}
      onSave={handleSave}
      onDelete={entityId ? handleDelete : undefined}
    >
      <div className="space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-blue-500"
            placeholder="Synopsis title"
          />
        </div>
        <div className="flex gap-4">
          <div className="w-32">
            <label className="block text-sm text-gray-400 mb-1">Range Start</label>
            <input
              type="number"
              min={1}
              value={form.chapterRangeStart}
              onChange={(e) => setForm({ ...form, chapterRangeStart: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="w-32">
            <label className="block text-sm text-gray-400 mb-1">Range End</label>
            <input
              type="number"
              min={1}
              value={form.chapterRangeEnd}
              onChange={(e) => setForm({ ...form, chapterRangeEnd: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="w-32">
            <label className="block text-sm text-gray-400 mb-1">Type</label>
            <select
              value={form.summaryType}
              onChange={(e) => setForm({ ...form, summaryType: e.target.value as SynopsisType })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-blue-500"
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Content</label>
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={12}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-blue-500 resize-y"
            placeholder="Summarize the key events, character development, and plot points..."
          />
        </div>
      </div>
    </EntityFormWrapper>
  );
}
