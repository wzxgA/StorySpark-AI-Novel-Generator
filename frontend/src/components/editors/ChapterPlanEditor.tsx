import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import EntityFormWrapper from '../shared/EntityFormWrapper';
import SelectionModal from '../shared/SelectionModal';
import { useChapterPlanStore } from '../../stores/useChapterPlanStore';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { useItemStore } from '../../stores/useItemStore';
import { useWorldBuildingStore } from '../../stores/useWorldBuildingStore';
import { useLayoutStore } from '../../stores/useLayoutStore';

interface Props {
  novelId: number;
  entityId: number | null;
}

function parseIds(raw: string): number[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'number') : [];
  } catch {
    return [];
  }
}

export default function ChapterPlanEditor({ novelId, entityId }: Props) {
  const { t } = useTranslation();
  const { plans, fetchById, create, update, remove } = useChapterPlanStore();
  const { characters, fetchAll: fetchCharacters } = useCharacterStore();
  const { items, fetchAll: fetchItems } = useItemStore();
  const { items: worldBuildings, fetchAll: fetchWorldBuilding } = useWorldBuildingStore();
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
  const [modalType, setModalType] = useState<'character' | 'item' | 'worldbuilding' | null>(null);

  useEffect(() => {
    fetchCharacters(novelId);
    fetchItems(novelId);
    fetchWorldBuilding(novelId);
  }, [novelId, fetchCharacters, fetchItems, fetchWorldBuilding]);

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
    if (!entityId || !confirm(t('chapterPlan.deleteConfirm'))) return;
    try {
      await remove(novelId, entityId);
      closeTab(`chapter-plan-${entityId}`);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleModalConfirm = useCallback((ids: number[]) => {
    const json = JSON.stringify(ids);
    if (modalType === 'character') setForm((f) => ({ ...f, characterIds: json }));
    else if (modalType === 'item') setForm((f) => ({ ...f, itemIds: json }));
    else if (modalType === 'worldbuilding') setForm((f) => ({ ...f, worldBuildingIds: json }));
    setModalType(null);
  }, [modalType]);

  const charItems = characters.map((c) => ({ id: c.id, primary: c.name, secondary: c.description }));
  const charSelectedIds = parseIds(form.characterIds);
  const charTags = characters.filter((c) => charSelectedIds.includes(c.id));

  const itemItems = items.map((i) => ({ id: i.id, primary: i.name, secondary: i.type }));
  const itemSelectedIds = parseIds(form.itemIds);
  const itemTags = items.filter((i) => itemSelectedIds.includes(i.id));

  const wbItems = worldBuildings.map((w) => ({ id: w.id, primary: w.title, secondary: w.category }));
  const wbSelectedIds = parseIds(form.worldBuildingIds);
  const wbTags = worldBuildings.filter((w) => wbSelectedIds.includes(w.id));

  return (
    <EntityFormWrapper
      title={entityId ? `Plan Ch.${form.chapterRangeStart}-${form.chapterRangeEnd}` : t('chapterPlan.new')}
      loading={loading}
      error={error}
      onSave={handleSave}
      onDelete={entityId ? handleDelete : undefined}
    >
      <div className="space-y-4 max-w-2xl">
        <div className="flex gap-4">
          <div className="w-32">
            <label className="block text-sm text-gray-400 mb-1">{t('chapterPlan.rangeStart')}</label>
            <input
              type="number"
              min={1}
              value={form.chapterRangeStart}
              onChange={(e) => setForm({ ...form, chapterRangeStart: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="w-32">
            <label className="block text-sm text-gray-400 mb-1">{t('chapterPlan.rangeEnd')}</label>
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
          <label className="block text-sm text-gray-400 mb-1">{t('chapterPlan.outline')}</label>
          <textarea
            value={form.outline}
            onChange={(e) => setForm({ ...form, outline: e.target.value })}
            rows={6}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-blue-500 resize-none"
            placeholder={t('chapterPlan.outlinePlaceholder')}
          />
        </div>

        {/* Characters */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">{t('chapterPlan.characterIds')}</label>
          <button
            type="button"
            onClick={() => setModalType('character')}
            className="px-3 py-1.5 text-sm bg-gray-800 border border-gray-600 rounded text-gray-200 hover:bg-gray-700 transition-colors"
          >
            {t('selector.selectCharacters')}
          </button>
          {charTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {charTags.map((c) => (
                <span key={c.id} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-600/20 text-blue-300 border border-blue-600/30 rounded">
                  {c.name}
                  <button
                    type="button"
                    onClick={() => {
                      const ids = charSelectedIds.filter((id) => id !== c.id);
                      setForm({ ...form, characterIds: JSON.stringify(ids) });
                    }}
                    className="hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Items */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">{t('chapterPlan.itemIds')}</label>
          <button
            type="button"
            onClick={() => setModalType('item')}
            className="px-3 py-1.5 text-sm bg-gray-800 border border-gray-600 rounded text-gray-200 hover:bg-gray-700 transition-colors"
          >
            {t('selector.selectItems')}
          </button>
          {itemTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {itemTags.map((it) => (
                <span key={it.id} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-orange-600/20 text-orange-300 border border-orange-600/30 rounded">
                  {it.name}
                  <button
                    type="button"
                    onClick={() => {
                      const ids = itemSelectedIds.filter((id) => id !== it.id);
                      setForm({ ...form, itemIds: JSON.stringify(ids) });
                    }}
                    className="hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* World Building */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">{t('chapterPlan.worldBuildingIds')}</label>
          <button
            type="button"
            onClick={() => setModalType('worldbuilding')}
            className="px-3 py-1.5 text-sm bg-gray-800 border border-gray-600 rounded text-gray-200 hover:bg-gray-700 transition-colors"
          >
            {t('selector.selectWorldBuilding')}
          </button>
          {wbTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {wbTags.map((w) => (
                <span key={w.id} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-purple-600/20 text-purple-300 border border-purple-600/30 rounded">
                  {w.title}
                  <button
                    type="button"
                    onClick={() => {
                      const ids = wbSelectedIds.filter((id) => id !== w.id);
                      setForm({ ...form, worldBuildingIds: JSON.stringify(ids) });
                    }}
                    className="hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">{t('chapterPlan.notes')}</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-blue-500 resize-none"
            placeholder={t('chapterPlan.notesPlaceholder')}
          />
        </div>
      </div>

      {/* Selection Modals */}
      <SelectionModal
        title={t('selector.selectCharacters')}
        open={modalType === 'character'}
        onClose={() => setModalType(null)}
        items={charItems}
        selectedIds={charSelectedIds}
        onConfirm={handleModalConfirm}
      />
      <SelectionModal
        title={t('selector.selectItems')}
        open={modalType === 'item'}
        onClose={() => setModalType(null)}
        items={itemItems}
        selectedIds={itemSelectedIds}
        onConfirm={handleModalConfirm}
      />
      <SelectionModal
        title={t('selector.selectWorldBuilding')}
        open={modalType === 'worldbuilding'}
        onClose={() => setModalType(null)}
        items={wbItems}
        selectedIds={wbSelectedIds}
        onConfirm={handleModalConfirm}
      />
    </EntityFormWrapper>
  );
}
