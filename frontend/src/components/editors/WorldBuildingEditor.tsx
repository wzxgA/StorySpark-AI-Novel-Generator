import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import EntityFormWrapper from '../shared/EntityFormWrapper';
import { useWorldBuildingStore } from '../../stores/useWorldBuildingStore';
import { useLayoutStore } from '../../stores/useLayoutStore';
import type { WorldBuildingCategory } from '../../types';

interface Props {
  novelId: number;
  entityId: number | null;
}

const CATEGORY_OPTIONS: WorldBuildingCategory[] = ['GEOGRAPHY', 'HISTORY', 'MAGIC_SYSTEM', 'POLITICS', 'CULTURE', 'RACES', 'OTHER'];

export default function WorldBuildingEditor({ novelId, entityId }: Props) {
  const { t } = useTranslation();
  const { items, fetchById, create, update, remove } = useWorldBuildingStore();
  const { closeTab, updateTabTitle, replaceTabId } = useLayoutStore();
  const [form, setForm] = useState({ title: '', content: '', category: 'OTHER' as WorldBuildingCategory });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (entityId) {
      const cached = items.find((w) => w.id === entityId);
      if (cached) {
        setForm({ title: cached.title, content: cached.content || '', category: cached.category });
      } else {
        fetchById(novelId, entityId).then((wb) => {
          setForm({ title: wb.title, content: wb.content || '', category: wb.category });
        });
      }
    }
  }, [entityId, items, novelId, fetchById]);

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setLoading(true);
    setError(null);
    try {
      if (entityId) {
        await update(novelId, entityId, form);
        updateTabTitle(`worldbuilding-${entityId}`, form.title);
      } else {
        const created = await create(novelId, form);
        replaceTabId('worldbuilding', `worldbuilding-${created.id}`, created.id);
        updateTabTitle(`worldbuilding-${created.id}`, created.title);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!entityId || !confirm(t('worldbuilding.deleteConfirm'))) return;
    try {
      await remove(novelId, entityId);
      closeTab(`worldbuilding-${entityId}`);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <EntityFormWrapper
      title={entityId ? form.title || t('worldbuilding.fallback') : t('worldbuilding.new')}
      loading={loading}
      error={error}
      onSave={handleSave}
      onDelete={entityId ? handleDelete : undefined}
    >
      <div className="space-y-4 max-w-2xl">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-1">{t('worldbuilding.title')}</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-blue-500"
              placeholder={t('worldbuilding.titlePlaceholder')}
            />
          </div>
          <div className="w-44">
            <label className="block text-sm text-gray-400 mb-1">{t('worldbuilding.category')}</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as WorldBuildingCategory })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-blue-500"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">{t('worldbuilding.content')}</label>
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={12}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-blue-500 resize-y"
            placeholder={t('worldbuilding.contentPlaceholder')}
          />
        </div>
      </div>
    </EntityFormWrapper>
  );
}
