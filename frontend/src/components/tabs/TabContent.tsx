import { useTranslation } from 'react-i18next';
import { useLayoutStore } from '../../stores/useLayoutStore';
import { useNovelStore } from '../../stores/useNovelStore';
import NovelEditor from '../editors/NovelEditor';
import ChapterEditor from '../editors/ChapterEditor';
import CharacterEditor from '../editors/CharacterEditor';
import ItemEditor from '../editors/ItemEditor';
import WorldBuildingEditor from '../editors/WorldBuildingEditor';
import OutlineEditor from '../editors/OutlineEditor';
import SynopsisEditor from '../editors/SynopsisEditor';
import ChapterPlanEditor from '../editors/ChapterPlanEditor';
import SettingsPage from '../settings/SettingsPage';

export default function TabContent() {
  const { t } = useTranslation();
  const openTabs = useLayoutStore((s) => s.openTabs);
  const activeTabId = useLayoutStore((s) => s.activeTabId);
  const selectedNovelId = useNovelStore((s) => s.selectedNovelId);

  const activeTab = openTabs.find((t) => t.id === activeTabId);

  if (!activeTab) {
    return (
      <div className="h-full flex items-center justify-center text-gray-600">
        <div className="text-center">
          <p className="text-4xl mb-2">&#x2728;</p>
          <p className="text-sm">{t('tabs.selectItem')}</p>
        </div>
      </div>
    );
  }

  const novelId = selectedNovelId!;

  switch (activeTab.type) {
    case 'novel':
      return <NovelEditor entityId={activeTab.entityId} />;
    case 'chapter':
      return <ChapterEditor novelId={novelId} entityId={activeTab.entityId} />;
    case 'character':
      return <CharacterEditor novelId={novelId} entityId={activeTab.entityId} />;
    case 'item':
      return <ItemEditor novelId={novelId} entityId={activeTab.entityId} />;
    case 'worldbuilding':
      return <WorldBuildingEditor novelId={novelId} entityId={activeTab.entityId} />;
    case 'outline':
      return <OutlineEditor novelId={novelId} />;
    case 'synopsis':
      return <SynopsisEditor novelId={novelId} entityId={activeTab.entityId} />;
    case 'chapter-plan':
      return <ChapterPlanEditor novelId={novelId} entityId={activeTab.entityId} />;
    case 'settings':
      return <SettingsPage />;
    default:
      return <div className="p-4 text-gray-400">{t('tabs.unknownType')}</div>;
  }
}
