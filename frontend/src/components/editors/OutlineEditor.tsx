import { useState, useEffect } from 'react';
import EntityFormWrapper from '../shared/EntityFormWrapper';
import { useOutlineStore } from '../../stores/useOutlineStore';

interface Props {
  novelId: number;
}

export default function OutlineEditor({ novelId }: Props) {
  const { outline, fetchByNovelId, update } = useOutlineStore();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchByNovelId(novelId).then((o) => {
      setContent(o.content || '');
    });
  }, [novelId, fetchByNovelId]);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      await update(novelId, { content });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <EntityFormWrapper title="Outline" loading={loading} error={error} onSave={handleSave}>
      <div className="space-y-2">
        <p className="text-xs text-gray-500">
          Write your story outline here. Use a hierarchical structure (indented text, markdown headings, or JSON tree).
          This will be included in the AI context when generating chapters.
        </p>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={30}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm font-mono leading-relaxed focus:outline-none focus:border-blue-500 resize-y"
          placeholder={'# Act 1\n## Chapter 1\n- The hero discovers...\n- A mysterious event...\n\n## Chapter 2\n- The journey begins...'}
        />
      </div>
    </EntityFormWrapper>
  );
}
