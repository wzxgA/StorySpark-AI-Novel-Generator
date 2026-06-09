import { Group, Panel, Separator } from 'react-resizable-panels';
import Toolbar from './Toolbar';
import ProjectTree from '../sidebar/ProjectTree';
import TabContainer from '../tabs/TabContainer';

export default function AppLayout() {
  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <Toolbar />
      <div className="flex-1 min-h-0">
        <Group orientation="horizontal">
          <Panel defaultSize={20} minSize={10}>
            <ProjectTree />
          </Panel>
          <Separator
            className="w-1.5 bg-gray-600 hover:bg-blue-500 active:bg-blue-400 transition-colors cursor-col-resize"
            style={{ flexShrink: 0 }}
          />
          <Panel defaultSize={80} minSize={20}>
            <TabContainer />
          </Panel>
        </Group>
      </div>
    </div>
  );
}
