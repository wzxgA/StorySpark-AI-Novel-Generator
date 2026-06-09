import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Plus, Users, Package, Globe, FileText, List, ScrollText, Map, Pencil, Trash2 } from 'lucide-react';
import TreeNode from './TreeNode';
import type { ContextMenuItem } from '../shared/ContextMenu';
import { useNovelStore } from '../../stores/useNovelStore';
import { useChapterStore } from '../../stores/useChapterStore';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { useItemStore } from '../../stores/useItemStore';
import { useWorldBuildingStore } from '../../stores/useWorldBuildingStore';
import { useSynopsisStore } from '../../stores/useSynopsisStore';
import { useChapterPlanStore } from '../../stores/useChapterPlanStore';
import { useLayoutStore } from '../../stores/useLayoutStore';

export default function ProjectTree() {
  const { t } = useTranslation();
  const { novels, selectedNovelId, fetchAll: fetchNovels, create: createNovel, selectNovel, update: updateNovel, remove: removeNovel } = useNovelStore();
  const { chapters, fetchAll: fetchChapters } = useChapterStore();
  const { characters, fetchAll: fetchCharacters } = useCharacterStore();
  const { items, fetchAll: fetchItems } = useItemStore();
  const { items: worldBuildings, fetchAll: fetchWorldBuilding } = useWorldBuildingStore();
  const { synopses, fetchAll: fetchSynopses } = useSynopsisStore();
  const { plans, fetchAll: fetchPlans } = useChapterPlanStore();
  const { openTab, closeTab } = useLayoutStore();

  const [novelsExpanded, setNovelsExpanded] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    characters: false,
    items: false,
    worldbuilding: false,
    chapters: false,
    plans: false,
    synopses: false,
  });

  useEffect(() => {
    fetchNovels();
  }, [fetchNovels]);

  useEffect(() => {
    if (selectedNovelId) {
      fetchChapters(selectedNovelId);
      fetchCharacters(selectedNovelId);
      fetchItems(selectedNovelId);
      fetchWorldBuilding(selectedNovelId);
      fetchSynopses(selectedNovelId);
      fetchPlans(selectedNovelId);
    }
  }, [selectedNovelId, fetchChapters, fetchCharacters, fetchItems, fetchWorldBuilding, fetchSynopses, fetchPlans]);

  const toggleSection = useCallback((key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleCreateNovel = async () => {
    const title = prompt(`${t('sidebar.novelTitle')}:`);
    if (!title?.trim()) return;
    await createNovel({ title: title.trim(), description: '' });
  };

  const makeRenameItems = (label: string, onRename: (newName: string) => void): ContextMenuItem[] => [
    {
      label: t('contextMenu.rename'),
      icon: <Pencil className="w-3.5 h-3.5" />,
      onClick: () => {
        const newName = prompt(t('contextMenu.renamePrompt'), label);
        if (newName?.trim() && newName.trim() !== label) {
          onRename(newName.trim());
        }
      },
    },
  ];

  const makeDeleteItem = (onDelete: () => void): ContextMenuItem => ({
    label: t('contextMenu.delete'),
    icon: <Trash2 className="w-3.5 h-3.5" />,
    danger: true,
    onClick: () => {
      if (confirm(t('contextMenu.deleteConfirm'))) {
        onDelete();
      }
    },
  });

  const makeAddItem = (onAdd: () => void): ContextMenuItem => ({
    label: t('contextMenu.addNew'),
    icon: <Plus className="w-3.5 h-3.5" />,
    onClick: () => onAdd(),
  });

  if (novels.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <BookOpen className="w-12 h-12 text-gray-600 mb-3" />
        <p className="text-gray-400 text-sm mb-4">{t('sidebar.noNovelYet')}</p>
        <button
          onClick={handleCreateNovel}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors"
        >
          {t('sidebar.createFirstNovel')}
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-850 overflow-y-auto">
      {/* Novels section */}
      <TreeNode
        label={t('sidebar.novels')}
        icon={<BookOpen className="w-3.5 h-3.5 text-blue-400" />}
        count={novels.length}
        expanded={novelsExpanded}
        onToggle={() => setNovelsExpanded(!novelsExpanded)}
        onAdd={handleCreateNovel}
      >
        {novels.map((novel) => (
          <TreeNode
            key={`novel-${novel.id}`}
            label={novel.title}
            depth={1}
            expanded={false}
            onToggle={() => {}}
            active={novel.id === selectedNovelId}
            onClick={() => {
              selectNovel(novel.id);
              openTab('novel', novel.id, novel.title);
            }}
            contextMenuItems={[
              ...makeRenameItems(novel.title, (newTitle) => {
                updateNovel(novel.id, { title: newTitle });
              }),
              makeDeleteItem(async () => {
                await removeNovel(novel.id);
                closeTab(`novel-${novel.id}`);
              }),
            ]}
          />
        ))}
      </TreeNode>

      {/* Entity tree — only visible when a novel is selected */}
      {selectedNovelId && (
        <div className="py-1 border-t border-gray-700">
          {/* Outline */}
          <TreeNode
            label={t('sidebar.outline')}
            icon={<Map className="w-3.5 h-3.5 text-yellow-400" />}
            expanded={false}
            onToggle={() => {}}
            onClick={() => openTab('outline', selectedNovelId, t('sidebar.outline'))}
            children={undefined}
          />

          {/* Characters */}
          <TreeNode
            label={t('sidebar.characters')}
            icon={<Users className="w-3.5 h-3.5 text-green-400" />}
            count={characters.length}
            expanded={expandedSections.characters}
            onToggle={() => toggleSection('characters')}
            onAdd={() => openTab('character', null, t('sidebar.newCharacter'))}
            contextMenuItems={[
              makeAddItem(() => openTab('character', null, t('sidebar.newCharacter'))),
            ]}
          >
            {characters.map((c) => (
              <TreeNode
                key={`char-${c.id}`}
                label={c.name}
                depth={1}
                expanded={false}
                onToggle={() => {}}
                onClick={() => openTab('character', c.id, c.name)}
                contextMenuItems={[
                  ...makeRenameItems(c.name, (newName) => {
                    useCharacterStore.getState().update(selectedNovelId, c.id, { name: newName });
                  }),
                  makeDeleteItem(async () => {
                    await useCharacterStore.getState().remove(selectedNovelId, c.id);
                    closeTab(`character-${c.id}`);
                  }),
                ]}
              />
            ))}
          </TreeNode>

          {/* Items */}
          <TreeNode
            label={t('sidebar.items')}
            icon={<Package className="w-3.5 h-3.5 text-orange-400" />}
            count={items.length}
            expanded={expandedSections.items}
            onToggle={() => toggleSection('items')}
            onAdd={() => openTab('item', null, t('sidebar.newItem'))}
            contextMenuItems={[
              makeAddItem(() => openTab('item', null, t('sidebar.newItem'))),
            ]}
          >
            {items.map((item) => (
              <TreeNode
                key={`item-${item.id}`}
                label={item.name}
                depth={1}
                expanded={false}
                onToggle={() => {}}
                onClick={() => openTab('item', item.id, item.name)}
                contextMenuItems={[
                  ...makeRenameItems(item.name, (newName) => {
                    useItemStore.getState().update(selectedNovelId, item.id, { name: newName });
                  }),
                  makeDeleteItem(async () => {
                    await useItemStore.getState().remove(selectedNovelId, item.id);
                    closeTab(`item-${item.id}`);
                  }),
                ]}
              />
            ))}
          </TreeNode>

          {/* World Building */}
          <TreeNode
            label={t('sidebar.worldBuilding')}
            icon={<Globe className="w-3.5 h-3.5 text-purple-400" />}
            count={worldBuildings.length}
            expanded={expandedSections.worldbuilding}
            onToggle={() => toggleSection('worldbuilding')}
            onAdd={() => openTab('worldbuilding', null, t('sidebar.newWorldEntry'))}
            contextMenuItems={[
              makeAddItem(() => openTab('worldbuilding', null, t('sidebar.newWorldEntry'))),
            ]}
          >
            {worldBuildings.map((wb) => (
              <TreeNode
                key={`wb-${wb.id}`}
                label={wb.title}
                depth={1}
                expanded={false}
                onToggle={() => {}}
                onClick={() => openTab('worldbuilding', wb.id, wb.title)}
                contextMenuItems={[
                  ...makeRenameItems(wb.title, (newTitle) => {
                    useWorldBuildingStore.getState().update(selectedNovelId, wb.id, { title: newTitle });
                  }),
                  makeDeleteItem(async () => {
                    await useWorldBuildingStore.getState().remove(selectedNovelId, wb.id);
                    closeTab(`worldbuilding-${wb.id}`);
                  }),
                ]}
              />
            ))}
          </TreeNode>

          {/* Chapters */}
          <TreeNode
            label={t('sidebar.chapters')}
            icon={<FileText className="w-3.5 h-3.5 text-cyan-400" />}
            count={chapters.length}
            expanded={expandedSections.chapters}
            onToggle={() => toggleSection('chapters')}
            onAdd={() => openTab('chapter', null, t('sidebar.newChapter'))}
            contextMenuItems={[
              makeAddItem(() => openTab('chapter', null, t('sidebar.newChapter'))),
            ]}
          >
            {chapters.map((ch) => (
              <TreeNode
                key={`ch-${ch.id}`}
                label={`Ch.${ch.chapterNumber} ${ch.title}`}
                depth={1}
                expanded={false}
                onToggle={() => {}}
                onClick={() => openTab('chapter', ch.id, `Ch.${ch.chapterNumber} ${ch.title}`)}
                contextMenuItems={[
                  ...makeRenameItems(ch.title, (newTitle) => {
                    useChapterStore.getState().update(selectedNovelId, ch.id, { title: newTitle });
                  }),
                  makeDeleteItem(async () => {
                    await useChapterStore.getState().remove(selectedNovelId, ch.id);
                    closeTab(`chapter-${ch.id}`);
                  }),
                ]}
              />
            ))}
          </TreeNode>

          {/* Chapter Plans */}
          <TreeNode
            label={t('sidebar.chapterPlans')}
            icon={<ScrollText className="w-3.5 h-3.5 text-pink-400" />}
            count={plans.length}
            expanded={expandedSections.plans}
            onToggle={() => toggleSection('plans')}
            onAdd={() => openTab('chapter-plan', null, t('sidebar.newPlan'))}
            contextMenuItems={[
              makeAddItem(() => openTab('chapter-plan', null, t('sidebar.newPlan'))),
            ]}
          >
            {plans.map((p) => (
              <TreeNode
                key={`plan-${p.id}`}
                label={`Ch.${p.chapterRangeStart}-${p.chapterRangeEnd}`}
                depth={1}
                expanded={false}
                onToggle={() => {}}
                onClick={() => openTab('chapter-plan', p.id, `Plan Ch.${p.chapterRangeStart}-${p.chapterRangeEnd}`)}
                contextMenuItems={[
                  makeDeleteItem(async () => {
                    await useChapterPlanStore.getState().remove(selectedNovelId, p.id);
                    closeTab(`chapter-plan-${p.id}`);
                  }),
                ]}
              />
            ))}
          </TreeNode>

          {/* Synopses */}
          <TreeNode
            label={t('sidebar.synopses')}
            icon={<List className="w-3.5 h-3.5 text-indigo-400" />}
            count={synopses.length}
            expanded={expandedSections.synopses}
            onToggle={() => toggleSection('synopses')}
            onAdd={() => openTab('synopsis', null, t('sidebar.newSynopsis'))}
            contextMenuItems={[
              makeAddItem(() => openTab('synopsis', null, t('sidebar.newSynopsis'))),
            ]}
          >
            {synopses.map((s) => (
              <TreeNode
                key={`syn-${s.id}`}
                label={s.title}
                depth={1}
                expanded={false}
                onToggle={() => {}}
                onClick={() => openTab('synopsis', s.id, s.title)}
                contextMenuItems={[
                  ...makeRenameItems(s.title, (newTitle) => {
                    useSynopsisStore.getState().update(selectedNovelId, s.id, { title: newTitle });
                  }),
                  makeDeleteItem(async () => {
                    await useSynopsisStore.getState().remove(selectedNovelId, s.id);
                    closeTab(`synopsis-${s.id}`);
                  }),
                ]}
              />
            ))}
          </TreeNode>
        </div>
      )}
    </div>
  );
}
