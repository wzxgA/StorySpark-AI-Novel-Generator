import { useState, useEffect, useCallback } from 'react';
import { BookOpen, Users, Package, Globe, FileText, List, ScrollText, Map } from 'lucide-react';
import TreeNode from './TreeNode';
import { useNovelStore } from '../../stores/useNovelStore';
import { useChapterStore } from '../../stores/useChapterStore';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { useItemStore } from '../../stores/useItemStore';
import { useWorldBuildingStore } from '../../stores/useWorldBuildingStore';
import { useSynopsisStore } from '../../stores/useSynopsisStore';
import { useChapterPlanStore } from '../../stores/useChapterPlanStore';
import { useLayoutStore } from '../../stores/useLayoutStore';

export default function ProjectTree() {
  const { novels, selectedNovelId, fetchAll: fetchNovels, create: createNovel, selectNovel } = useNovelStore();
  const { chapters, fetchAll: fetchChapters } = useChapterStore();
  const { characters, fetchAll: fetchCharacters } = useCharacterStore();
  const { items, fetchAll: fetchItems } = useItemStore();
  const { items: worldBuildings, fetchAll: fetchWorldBuilding } = useWorldBuildingStore();
  const { synopses, fetchAll: fetchSynopses } = useSynopsisStore();
  const { plans, fetchAll: fetchPlans } = useChapterPlanStore();
  const openTab = useLayoutStore((s) => s.openTab);

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
    const title = prompt('Novel title:');
    if (!title?.trim()) return;
    await createNovel({ title: title.trim(), description: '' });
  };

  if (novels.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <BookOpen className="w-12 h-12 text-gray-600 mb-3" />
        <p className="text-gray-400 text-sm mb-4">No novel yet</p>
        <button
          onClick={handleCreateNovel}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors"
        >
          Create Your First Novel
        </button>
      </div>
    );
  }

  const novel = novels[0];

  return (
    <div className="h-full flex flex-col bg-gray-850 overflow-y-auto">
      <div className="px-3 py-2 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-400" />
          <span
            className="text-sm font-medium text-gray-200 truncate cursor-pointer hover:text-blue-400"
            onClick={() => {
              selectNovel(novel.id);
              openTab('novel', novel.id, novel.title);
            }}
          >
            {novel.title}
          </span>
        </div>
      </div>

      <div className="py-1">
        {/* Outline */}
        <TreeNode
          label="Outline"
          icon={<Map className="w-3.5 h-3.5 text-yellow-400" />}
          expanded={false}
          onToggle={() => {}}
          onClick={() => selectedNovelId && openTab('outline', selectedNovelId, 'Outline')}
          children={undefined}
        />

        {/* Characters */}
        <TreeNode
          label="Characters"
          icon={<Users className="w-3.5 h-3.5 text-green-400" />}
          count={characters.length}
          expanded={expandedSections.characters}
          onToggle={() => toggleSection('characters')}
          onAdd={() => selectedNovelId && openTab('character', null, 'New Character')}
        >
          {characters.map((c) => (
            <TreeNode
              key={`char-${c.id}`}
              label={c.name}
              depth={1}
              expanded={false}
              onToggle={() => {}}
              onClick={() => openTab('character', c.id, c.name)}
            />
          ))}
        </TreeNode>

        {/* Items */}
        <TreeNode
          label="Items"
          icon={<Package className="w-3.5 h-3.5 text-orange-400" />}
          count={items.length}
          expanded={expandedSections.items}
          onToggle={() => toggleSection('items')}
          onAdd={() => selectedNovelId && openTab('item', null, 'New Item')}
        >
          {items.map((item) => (
            <TreeNode
              key={`item-${item.id}`}
              label={item.name}
              depth={1}
              expanded={false}
              onToggle={() => {}}
              onClick={() => openTab('item', item.id, item.name)}
            />
          ))}
        </TreeNode>

        {/* World Building */}
        <TreeNode
          label="World Building"
          icon={<Globe className="w-3.5 h-3.5 text-purple-400" />}
          count={worldBuildings.length}
          expanded={expandedSections.worldbuilding}
          onToggle={() => toggleSection('worldbuilding')}
          onAdd={() => selectedNovelId && openTab('worldbuilding', null, 'New World Entry')}
        >
          {worldBuildings.map((wb) => (
            <TreeNode
              key={`wb-${wb.id}`}
              label={wb.title}
              depth={1}
              expanded={false}
              onToggle={() => {}}
              onClick={() => openTab('worldbuilding', wb.id, wb.title)}
            />
          ))}
        </TreeNode>

        {/* Chapters */}
        <TreeNode
          label="Chapters"
          icon={<FileText className="w-3.5 h-3.5 text-cyan-400" />}
          count={chapters.length}
          expanded={expandedSections.chapters}
          onToggle={() => toggleSection('chapters')}
          onAdd={() => selectedNovelId && openTab('chapter', null, 'New Chapter')}
        >
          {chapters.map((ch) => (
            <TreeNode
              key={`ch-${ch.id}`}
              label={`Ch.${ch.chapterNumber} ${ch.title}`}
              depth={1}
              expanded={false}
              onToggle={() => {}}
              onClick={() => openTab('chapter', ch.id, `Ch.${ch.chapterNumber} ${ch.title}`)}
            />
          ))}
        </TreeNode>

        {/* Chapter Plans */}
        <TreeNode
          label="Chapter Plans"
          icon={<ScrollText className="w-3.5 h-3.5 text-pink-400" />}
          count={plans.length}
          expanded={expandedSections.plans}
          onToggle={() => toggleSection('plans')}
          onAdd={() => selectedNovelId && openTab('chapter-plan', null, 'New Plan')}
        >
          {plans.map((p) => (
            <TreeNode
              key={`plan-${p.id}`}
              label={`Ch.${p.chapterRangeStart}-${p.chapterRangeEnd}`}
              depth={1}
              expanded={false}
              onToggle={() => {}}
              onClick={() => openTab('chapter-plan', p.id, `Plan Ch.${p.chapterRangeStart}-${p.chapterRangeEnd}`)}
            />
          ))}
        </TreeNode>

        {/* Synopses */}
        <TreeNode
          label="Synopses"
          icon={<List className="w-3.5 h-3.5 text-indigo-400" />}
          count={synopses.length}
          expanded={expandedSections.synopses}
          onToggle={() => toggleSection('synopses')}
          onAdd={() => selectedNovelId && openTab('synopsis', null, 'New Synopsis')}
        >
          {synopses.map((s) => (
            <TreeNode
              key={`syn-${s.id}`}
              label={s.title}
              depth={1}
              expanded={false}
              onToggle={() => {}}
              onClick={() => openTab('synopsis', s.id, s.title)}
            />
          ))}
        </TreeNode>
      </div>
    </div>
  );
}
