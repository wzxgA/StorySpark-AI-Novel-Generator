import { useState, useEffect } from 'react';
import EntityFormWrapper from '../shared/EntityFormWrapper';
import { useChapterPlanStore } from '../../stores/useChapterPlanStore';
import { useLayoutStore } from '../../stores/useLayoutStore';

interface Props {
  novelId: number;
  entityId: number | null;
}

export default function ChapterPlanEditor({ novelId, entityId }: Props) {
  const { plans, fetchById, create, update, remove } = useChapterPlanStore();
  const { closeTab, updateTabTitle, replaceTabId } = useLayoutStore();
  const [form, setForm] = useState({
    chapterRangeStart: 1,
    chapterRangeEnd: 1,
    outline: '',
    characterIds: '',
    itemIds: '',
    worldBuildingIds: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (entityId) {
      const cached = plans.find((p) => p.id === entityId);
      if (cached) {
        setForm({
          chapterRangeStart: cached.chapterRangeStart,
          chapterRangeEnd: cached.chapterRangeEnd,
          outline: cached.outline || '',
          characterIds: cached.characterIds || '',
          itemIds: cached.itemIds || '',
          worldBuildingIds: cached.worldBuildingIds || '',
          notes: cached.notes || '',
        });
      } else {
        fetchById(novelId, entityId).then((p) => {
          setForm({
            chapterRangeStart: p.chapterRangeStart,
            chapterRangeEnd: p.chapterRangeEnd,
            outline: p.outline || '',
            characterIds: p.characterIds || '',
            itemIds: p.itemIds || '',
            worldBuildingIds: p.worldBuildingIds || '',
            notes: p.notes || '',
          });
        });
      }
    }
  }, [entityId, plans, novelId, fetchById]);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      if (entityId) {
        await update(novelId, entityId, form);
        updateTabTitle(`chapter-plan-${entityId}`, `Plan Ch.${form.chapterRangeStart}-${form.chapterRangeEnd}`);
      } else {
        const created = await create(novelId, form);
        replaceTabId('chapter-plan', `chapter-plan-${created.id}`, created.id);
        updateTabTitle(`chapter-plan-${created.id}`, `Plan Ch.${created.chapterRangeStart}-${created.chapterRangeEnd}`);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!entityId || !confirm('Delete this chapter plan?')) return;
    try {
      await remove(novelId, entityId);
      closeTab(`chapter-plan-${entityId}`);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <EntityFormWrapper
      title={entityId ? `Plan Ch.${form.chapterRangeStart}-${form.chapterRangeEnd}` : 'New Chapter Plan'}
      loading={loading}
      error={error}
      onSave={handleSave}
      onDelete={entityId ? handleDelete : undefined}
    >
      <div className="space-y-4 max-w-2xl">
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
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Outline</label>
          <textarea
            value={form.outline}
            onChange={(e) => setForm({ ...form, outline: e.target.value })}
            rows={6}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-blue-500 resize-none"
            placeholder="Outline for this chapter range..."
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Character IDs (JSON array)</label>
          <input
            type="text"
            value={form.characterIds}
            onChange={(e) => setForm({ ...form, characterIds: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm font-mono focus:outline-none focus:border-blue-500"
            placeholder='e.g. [1, 2, 5]'
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Item IDs (JSON array)</label>
          <input
            type="text"
            value={form.itemIds}
            onChange={(e) => setForm({ ...form, itemIds: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm font-mono focus:outline-none focus:border-blue-500"
            placeholder='e.g. [1, 3]'
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">World Building IDs (JSON array)</label>
          <input
            type="text"
            value={form.worldBuildingIds}
            onChange={(e) => setForm({ ...form, worldBuildingIds: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm font-mono focus:outline-none focus:border-blue-500"
            placeholder='e.g. [1, 2]'
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-blue-500 resize-none"
            placeholder="Any additional notes..."
          />
        </div>
      </div>
    </EntityFormWrapper>
  );
}
