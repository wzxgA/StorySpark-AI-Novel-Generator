import TabBar from './TabBar';
import TabContent from './TabContent';

export default function TabContainer() {
  return (
    <div className="h-full flex flex-col bg-gray-900">
      <TabBar />
      <div className="flex-1 min-h-0">
        <TabContent />
      </div>
    </div>
  );
}
