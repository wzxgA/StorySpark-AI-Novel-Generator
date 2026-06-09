import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAIConfigStore } from '../../stores/useAIConfigStore';

export default function AIConfigPage() {
  const { config, loading, testing, testResult, fetchConfig, saveConfig, testConnection, clearTestResult } = useAIConfigStore();
  const [form, setForm] = useState({
    apiUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o',
    chapterWordCount: 3000,
    temperature: 0.7,
    maxTokens: 4096,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    if (config) {
      setForm({
        apiUrl: config.apiUrl || 'https://api.openai.com/v1',
        apiKey: config.apiKey || '',
        model: config.model || 'gpt-4o',
        chapterWordCount: config.chapterWordCount || 3000,
        temperature: config.temperature ?? 0.7,
        maxTokens: config.maxTokens || 4096,
      });
    }
  }, [config]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveConfig(form);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    clearTestResult();
    await testConnection(form);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 shrink-0">
        <h2 className="text-lg font-semibold text-gray-100">AI Configuration</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded transition-colors"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {error && (
        <div className="mx-4 mt-3 px-3 py-2 bg-red-900/30 border border-red-800 rounded text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4 max-w-xl">
          <div>
            <label className="block text-sm text-gray-400 mb-1">API URL</label>
            <input
              type="text"
              value={form.apiUrl}
              onChange={(e) => setForm({ ...form, apiUrl: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-blue-500"
              placeholder="https://api.openai.com/v1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Supports OpenAI, DeepSeek, Qwen, Ollama, and other OpenAI-compatible APIs.
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">API Key</label>
            <input
              type="password"
              value={form.apiKey}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-blue-500"
              placeholder="sk-..."
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Model</label>
            <input
              type="text"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-blue-500"
              placeholder="gpt-4o"
            />
            <div className="flex gap-2 mt-1 flex-wrap">
              {['gpt-4o', 'gpt-4o-mini', 'deepseek-chat', 'qwen-turbo', 'qwen-plus'].map((m) => (
                <button
                  key={m}
                  onClick={() => setForm({ ...form, model: m })}
                  className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                    form.model === m
                      ? 'border-blue-500 text-blue-400 bg-blue-900/30'
                      : 'border-gray-600 text-gray-400 hover:text-gray-200 hover:border-gray-500'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Words/Chapter</label>
              <input
                type="number"
                value={form.chapterWordCount}
                onChange={(e) => setForm({ ...form, chapterWordCount: parseInt(e.target.value) || 3000 })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Temperature</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={form.temperature}
                onChange={(e) => setForm({ ...form, temperature: parseFloat(e.target.value) || 0.7 })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Max Tokens</label>
              <input
                type="number"
                value={form.maxTokens}
                onChange={(e) => setForm({ ...form, maxTokens: parseInt(e.target.value) || 4096 })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleTest}
              disabled={testing || !form.apiUrl || !form.apiKey}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-gray-200 text-sm rounded transition-colors"
            >
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Test Connection
            </button>

            {testResult && (
              <div className={`mt-3 px-3 py-2 rounded text-sm flex items-center gap-2 ${
                testResult.success ? 'bg-green-900/30 border border-green-800 text-green-400' : 'bg-red-900/30 border border-red-800 text-red-400'
              }`}>
                {testResult.success ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {testResult.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
