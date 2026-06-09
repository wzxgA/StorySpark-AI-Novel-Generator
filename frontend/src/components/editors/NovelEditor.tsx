import { useState, useEffect } from 'react';
import EntityFormWrapper from '../shared/EntityFormWrapper';
import { useNovelStore } from '../../stores/useNovelStore';
import { useLayoutStore } from '../../stores/useLayoutStore';
import type { Novel, NovelStatus } from '../../types';

interface Props {
  entityId: number | null;
}

const STATUS_OPTIONS: NovelStatus[] = ['PLANNING', 'IN_PROGRESS', 'COMPLETED'];

export default function NovelEditor({ entityId }: Props) {
  const { novels, fetchById, update, remove, selectNovel } = useNovelStore();
  const { closeTab, updateTabTitle } = useLayoutStore();
  const [form, setForm] = useState({ title: '', description: '', status: 'PLANNING' as NovelStatus });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCreate = entityId === null;

  useEffect(() => {
    if (entityId) {
      const cached = novels.find((n) => n.id === entityId);
      if (cached) {
        setForm({ title: cached.title, description: cached.description || '', status: cached.status });
      } else {
        fetchById(entityId).then((n) => {
          setForm({ title: n.title, description: n.description || '', status: n.status });
        });
      }
    }
  }, [entityId, novels, fetchById]);

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setLoading(true);
    setError(null);
    try {
      if (entityId) {
        const updated = await update(entityId, form);
        updateTabTitle(`novel-${entityId}`, updated.title);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!entityId || !confirm('Delete this novel and all related data?')) return;
    try {
      await remove(entityId);
      closeTab(`novel-${entityId}`);
      selectNovel(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <EntityFormWrapper title="Novel Settings" loading={loading} error={error} onSave={handleSave} onDelete={entityId ? handleDelete : undefined}>
      <div className="space-y-4 max-w-xl">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-blue-500"
            placeholder="Novel title"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-blue-500 resize-none"
            placeholder="Brief description of your novel"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as NovelStatus })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-blue-500"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
    </EntityFormWrapper>
  );
}
