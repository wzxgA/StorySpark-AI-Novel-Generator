import { useState, useEffect } from 'react';
import EntityFormWrapper from '../shared/EntityFormWrapper';
import { useCharacterStore } from '../../stores/useCharacterStore';
import { useLayoutStore } from '../../stores/useLayoutStore';

interface Props {
  novelId: number;
  entityId: number | null;
}

export default function CharacterEditor({ novelId, entityId }: Props) {
  const { characters, fetchById, create, update, remove } = useCharacterStore();
  const { closeTab, updateTabTitle, replaceTabId } = useLayoutStore();
  const [form, setForm] = useState({ name: '', description: '', traits: '', relationships: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (entityId) {
      const cached = characters.find((c) => c.id === entityId);
      if (cached) {
        setForm({
          name: cached.name,
          description: cached.description || '',
          traits: cached.traits || '',
          relationships: cached.relationships || '',
        });
      } else {
        fetchById(novelId, entityId).then((ch) => {
          setForm({
            name: ch.name,
            description: ch.description || '',
            traits: ch.traits || '',
            relationships: ch.relationships || '',
          });
        });
      }
    }
  }, [entityId, characters, novelId, fetchById]);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      if (entityId) {
        await update(novelId, entityId, form);
        updateTabTitle(`character-${entityId}`, form.name);
      } else {
        const created = await create(novelId, form);
        replaceTabId('character', `character-${created.id}`, created.id);
        updateTabTitle(`character-${created.id}`, created.name);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!entityId || !confirm('Delete this character?')) return;
    try {
      await remove(novelId, entityId);
      closeTab(`character-${entityId}`);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <EntityFormWrapper
      title={entityId ? form.name || 'Character' : 'New Character'}
      loading={loading}
      error={error}
      onSave={handleSave}
      onDelete={entityId ? handleDelete : undefined}
    >
      <div className="space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-blue-500"
            placeholder="Character name"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-blue-500 resize-none"
            placeholder="Character description, background, etc."
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Traits (JSON)</label>
          <textarea
            value={form.traits}
            onChange={(e) => setForm({ ...form, traits: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm font-mono focus:outline-none focus:border-blue-500 resize-none"
            placeholder='e.g. {"age": 25, "gender": "male", "personality": "brave"}'
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Relationships (JSON)</label>
          <textarea
            value={form.relationships}
            onChange={(e) => setForm({ ...form, relationships: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm font-mono focus:outline-none focus:border-blue-500 resize-none"
            placeholder='e.g. {"father": "Character A", "friend": "Character B"}'
          />
        </div>
      </div>
    </EntityFormWrapper>
  );
}
