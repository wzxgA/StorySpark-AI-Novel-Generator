import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

export interface ContextMenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  separator?: boolean;
}

interface Props {
  x: number;
  y: number;
  open: boolean;
  onClose: () => void;
  items: ContextMenuItem[];
}

const MENU_WIDTH = 180;
const ITEM_HEIGHT = 36;

export default function ContextMenu({ x, y, open, onClose, items }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay listener to avoid the same right-click event closing it
    const timer = setTimeout(() => {
      document.addEventListener('click', handler);
      document.addEventListener('contextmenu', handler);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handler);
      document.removeEventListener('contextmenu', handler);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const visibleItems = items.filter((item) => !item.separator);
  const menuHeight = visibleItems.length * ITEM_HEIGHT + 8; // 8px padding
  const adjustedX = x + MENU_WIDTH > window.innerWidth ? x - MENU_WIDTH : x;
  const adjustedY = y + menuHeight > window.innerHeight ? y - menuHeight : y;

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[100] bg-gray-800 border border-gray-600 rounded-md shadow-2xl py-1 min-w-[160px]"
      style={{ left: adjustedX, top: adjustedY }}
    >
      {items.map((item, i) => {
        if (item.separator) {
          return <div key={`sep-${i}`} className="my-1 border-t border-gray-700" />;
        }
        return (
          <button
            key={`${item.label}-${i}`}
            onClick={(e) => {
              e.stopPropagation();
              if (!item.disabled) {
                item.onClick();
                onClose();
              }
            }}
            disabled={item.disabled}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left transition-colors ${
              item.danger
                ? 'text-red-400 hover:bg-red-900/30 hover:text-red-300'
                : item.disabled
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-200 hover:bg-gray-700'
            }`}
          >
            {item.icon && <span className="w-4 h-4 shrink-0">{item.icon}</span>}
            <span className="flex-1">{item.label}</span>
          </button>
        );
      })}
    </div>,
    document.body,
  );
}
