import { Save, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  loading?: boolean;
  error?: string | null;
  onSave: () => void;
  onDelete?: () => void;
  saveLabel?: string;
  extraActions?: ReactNode;
  children: ReactNode;
}

export default function EntityFormWrapper({ title, loading, error, onSave, onDelete, saveLabel, extraActions, children }: Props) {
  const { t } = useTranslation();

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 shrink-0">
        <h2 className="text-lg font-semibold text-gray-100">{title}</h2>
        <div className="flex gap-2">
          {extraActions}
          {onDelete && (
            <button
              onClick={onDelete}
              className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
            >
              {t('editor.delete')}
            </button>
          )}
          <button
            onClick={onSave}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saveLabel || t('editor.save')}
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-3 px-3 py-2 bg-red-900/30 border border-red-800 rounded text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {children}
      </div>
    </div>
  );
}
