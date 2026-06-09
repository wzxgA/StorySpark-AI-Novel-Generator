import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { X, Search } from 'lucide-react';

interface SelectableItem {
  id: number;
  primary: string;
  secondary?: string;
}

interface Props {
  title: string;
  open: boolean;
  onClose: () => void;
  items: SelectableItem[];
  selectedIds: number[];
  onConfirm: (ids: number[]) => void;
}

export default function SelectionModal({ title, open, onClose, items, selectedIds, onConfirm }: Props) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [draftIds, setDraftIds] = useState<number[]>([]);

  const [wasOpen, setWasOpen] = useState(false);
  if (open && !wasOpen) {
    setWasOpen(true);
    setDraftIds([...selectedIds]);
    setSearch('');
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (it) =>
        it.primary.toLowerCase().includes(q) ||
        (it.secondary && it.secondary.toLowerCase().includes(q)),
    );
  }, [items, search]);

  const toggle = (id: number) => {
    setDraftIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleConfirm = () => {
    onConfirm(draftIds);
    setWasOpen(false);
    onClose();
  };

  const handleClose = () => {
    setWasOpen(false);
    onClose();
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />

      {/* Panel */}
      <div className="relative bg-gray-800 border border-gray-700 rounded-lg shadow-2xl max-w-lg w-full mx-4 max-h-[70vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 shrink-0">
          <h3 className="text-base font-semibold text-gray-100">{title}</h3>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-gray-700 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('selector.searchPlaceholder')}
              className="w-full pl-8 pr-3 py-2 bg-gray-750 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">{t('selector.noResults')}</p>
          ) : (
            filtered.map((item) => {
              const checked = draftIds.includes(item.id);
              return (
                <label
                  key={item.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-750 rounded cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(item.id)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-200">{item.primary}</span>
                    {item.secondary && (
                      <p className="text-xs text-gray-500 truncate">{item.secondary}</p>
                    )}
                  </div>
                </label>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700 shrink-0">
          <span className="text-xs text-gray-500">
            {draftIds.length} {t('selector.selected')}
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="px-3 py-1.5 text-sm text-gray-300 border border-gray-600 hover:bg-gray-700 rounded transition-colors"
            >
              {t('selector.cancel')}
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
            >
              {t('selector.confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
