import { useState } from 'react';
import { ChevronRight, ChevronDown, Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import ContextMenu from '../shared/ContextMenu';
import type { ContextMenuItem } from '../shared/ContextMenu';

interface Props {
  label: string;
  icon?: ReactNode;
  count?: number;
  expanded: boolean;
  onToggle: () => void;
  onClick?: () => void;
  onAdd?: () => void;
  children?: ReactNode;
  depth?: number;
  active?: boolean;
  contextMenuItems?: ContextMenuItem[];
}

export default function TreeNode({ label, icon, count, expanded, onToggle, onClick, onAdd, children, depth = 0, active, contextMenuItems }: Props) {
  const [ctxMenu, setCtxMenu] = useState<{ open: boolean; x: number; y: number } | null>(null);

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-gray-700/50 rounded text-sm select-none group ${
          active ? 'bg-blue-900/40 text-blue-300' : 'text-gray-300'
        }`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => { onToggle(); onClick?.(); }}
        onContextMenu={(e) => {
          if (!contextMenuItems || contextMenuItems.length === 0) return;
          e.preventDefault();
          e.stopPropagation();
          setCtxMenu({ open: true, x: e.clientX, y: e.clientY });
        }}
      >
        {children ? (
          expanded ? <ChevronDown className="w-3.5 h-3.5 shrink-0 text-gray-500" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0 text-gray-500" />
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="truncate flex-1">{label}</span>
        {count !== undefined && (
          <span className="text-xs text-gray-500">({count})</span>
        )}
        {onAdd && (
          <button
            onClick={(e) => { e.stopPropagation(); onAdd(); }}
            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-600 rounded transition-all"
            title="Add"
          >
            <Plus className="w-3 h-3" />
          </button>
        )}
      </div>
      {expanded && children && (
        <div>{children}</div>
      )}

      {contextMenuItems && contextMenuItems.length > 0 && (
        <ContextMenu
          x={ctxMenu?.x ?? 0}
          y={ctxMenu?.y ?? 0}
          open={ctxMenu?.open ?? false}
          onClose={() => setCtxMenu(null)}
          items={contextMenuItems}
        />
      )}
    </div>
  );
}
