import AppLayout from './components/layout/AppLayout';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

export default function App() {
  useKeyboardShortcuts();
  return <AppLayout />;
}
