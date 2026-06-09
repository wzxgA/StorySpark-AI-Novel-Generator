import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import EntityFormWrapper from '../shared/EntityFormWrapper';
import { useItemStore } from '../../stores/useItemStore';
import { useLayoutStore } from '../../stores/useLayoutStore';
import type { ItemType } from '../../types';

interface Props {
  novelId: number;
  entityId: number | null;
}

const TYPE_OPTIONS: ItemType[] = ['WEAPON', 'ARTIFACT', 'CONSUMABLE', 'KEY_ITEM', 'OTHER'];

export default function ItemEditor({ novelId, entityId }: Props) {
  const { t } = useTranslation();
  const { items, fetchById, create, update, remove } = useItemStore();
  const { closeTab, updateTabTitle, replaceTabId } = useLayoutStore();
  const [form, setForm] = useState({ name: '', description: '', significance: '', type: 'OTHER' as ItemType });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (entityId) {
      const cached = items.find((i) => i.id === entityId);
      if (cached) {
        setForm({ name: cached.name, description: cached.description || '', significance: cached.significance || '', type: cached.type });
      } else {
        fetchById(novelId, entityId).then((it) => {
          setForm({ name: it.name, description: it.description || '', significance: it.significance || '', type: it.type });
        });
      }
    }
  }, [entityId, items, novelId, fetchById]);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      if (entityId) {
        await update(novelId, entityId, form);
        updateTabTitle(`item-${entityId}`, form.name);
      } else {
        const created = await create(novelId, form);
        replaceTabId('item', `item-${created.id}`, created.id);
        updateTabTitle(`item-${created.id}`, created.name);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!entityId || !confirm(t('item.deleteConfirm'))) return;
    try {
      await remove(novelId, entityId);
      closeTab(`item-${entityId}`);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <EntityFormWrapper
      title={entityId ? form.name || t('item.fallback') : t('item.new')}
      loading={loading}
      error={error}
      onSave={handleSave}
      onDelete={entityId ? handleDelete : undefined}
    >
      <div className="space-y-4 max-w-2xl">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-1">{t('item.name')}</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-blue-500"
              placeholder={t('item.namePlaceholder')}
            />
          </div>
          <div className="w-40">
            <label className="block text-sm text-gray-400 mb-1">{t('item.type')}</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as ItemType })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-blue-500"
            >
              {TYPE_OPTIONS.map((tp) => (
                <option key={tp} value={tp}>{tp}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">{t('item.description')}</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-blue-500 resize-none"
            placeholder={t('item.descriptionPlaceholder')}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">{t('item.significance')}</label>
          <textarea
            value={form.significance}
            onChange={(e) => setForm({ ...form, significance: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-blue-500 resize-none"
            placeholder={t('item.significancePlaceholder')}
          />
        </div>
      </div>
    </EntityFormWrapper>
  );
}
