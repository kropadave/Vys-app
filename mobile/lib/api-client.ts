const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

type ApiOptions = Omit<RequestInit, 'body'> & {
  body?: Record<string, unknown>;
};

async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error ?? 'API požadavek selhal.');

  return payload as T;
}

export const apiClient = {
  health: () => apiFetch<{ ok: boolean; service: string }>('/health'),
  camps: () => apiFetch<{ camps: unknown[] }>('/api/camps'),
  courses: () => apiFetch<{ courses: unknown[] }>('/api/courses'),
  coachSessions: (coachId = 'coach-demo') => apiFetch<{ sessions: unknown[] }>(`/api/coach/sessions?coachId=${encodeURIComponent(coachId)}`),
};