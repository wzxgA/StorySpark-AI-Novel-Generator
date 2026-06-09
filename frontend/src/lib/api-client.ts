import type { TokenEvent, DoneEvent, ErrorEvent, BatchStartEvent, ChapterStartEvent, ChapterDoneEvent, BatchDoneEvent } from '../types';

let _baseUrl: string | null = null;

export async function getBaseUrl(): Promise<string> {
  if (_baseUrl) return _baseUrl;
  const api = (window as any).electronAPI;
  if (api?.getBackendPort) {
    try {
      const port = await api.getBackendPort();
      _baseUrl = `http://localhost:${port}`;
    } catch {
      _baseUrl = 'http://localhost:18080';
    }
  } else {
    _baseUrl = 'http://localhost:18080';
  }
  return _baseUrl;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const base = await getBaseUrl();
  const res = await fetch(`${base}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(body || `API error: ${res.status} ${res.statusText}`)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export interface StreamCallbacks {
  onToken: (data: TokenEvent) => void;
  onDone: (data: DoneEvent) => void;
  onError: (data: ErrorEvent) => void;
  onBatchStart?: (data: BatchStartEvent) => void;
  onChapterStart?: (data: ChapterStartEvent) => void;
  onChapterDone?: (data: ChapterDoneEvent) => void;
  onBatchDone?: (data: BatchDoneEvent) => void;
}

export function streamGenerate(
  path: string,
  body: unknown,
  callbacks: StreamCallbacks,
): AbortController {
  const controller = new AbortController();

  (async () => {
    try {
      const base = await getBaseUrl();
      const res = await fetch(`${base}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        callbacks.onError({ message: text || `HTTP ${res.status}` });
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        callbacks.onError({ message: 'No response body' });
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event:')) {
            currentEvent = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            const data = line.slice(5).trim();
            if (!data) continue;
            try {
              const parsed = JSON.parse(data);
              switch (currentEvent) {
                case 'token': callbacks.onToken(parsed as TokenEvent); break;
                case 'done': callbacks.onDone(parsed as DoneEvent); break;
                case 'error': callbacks.onError(parsed as ErrorEvent); break;
                case 'batch-start': callbacks.onBatchStart?.(parsed as BatchStartEvent); break;
                case 'chapter-start': callbacks.onChapterStart?.(parsed as ChapterStartEvent); break;
                case 'chapter-done': callbacks.onChapterDone?.(parsed as ChapterDoneEvent); break;
                case 'batch-done': callbacks.onBatchDone?.(parsed as BatchDoneEvent); break;
              }
            } catch {
              // ignore unparsable frames
            }
            currentEvent = '';
          } else if (line === '') {
            currentEvent = '';
          }
        }
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        callbacks.onError({ message: e.message || 'Stream failed' });
      }
    }
  })();

  return controller;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  health: () => request<{ status: string; timestamp: string }>('/actuator/health'),
}
