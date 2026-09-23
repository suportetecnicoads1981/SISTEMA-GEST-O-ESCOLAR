import { getSupabaseClient } from '../services/datasync/supabaseClient';

/** true se a URL aponta para a API do próprio servidor (mesma origem, caminho /api/...). */
export function isOwnApiUrl(rawUrl: string, origin: string): boolean {
  try {
    const url = new URL(rawUrl, origin);
    return url.origin === origin && url.pathname.startsWith('/api/');
  } catch {
    return false;
  }
}

/**
 * Anexa o token da sessão do Supabase às chamadas para /api do próprio servidor.
 * As rotas administrativas recusam (401) chamadas sem token. Sem sessão na nuvem
 * (login só local/offline), a chamada segue sem token, como antes.
 */
export function installApiAuthFetch(): void {
  if (typeof window === 'undefined' || typeof window.fetch !== 'function') return;
  if ((window.fetch as any).__sucessoEduAuth) return;

  const originalFetch = window.fetch.bind(window);

  const wrapped = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const rawUrl = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (!isOwnApiUrl(rawUrl, window.location.origin)) return originalFetch(input, init);

    let token: string | undefined;
    try {
      const { data } = await getSupabaseClient().auth.getSession();
      token = data.session?.access_token;
    } catch {
      /* sem sessão na nuvem */
    }
    if (!token) return originalFetch(input, init);

    const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
    if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
    if (input instanceof Request) return originalFetch(new Request(input, { ...init, headers }));
    return originalFetch(input, { ...init, headers });
  };
  (wrapped as any).__sucessoEduAuth = true;
  window.fetch = wrapped as typeof window.fetch;
}
