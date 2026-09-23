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
  try {
    if (typeof window === 'undefined' || typeof window.fetch !== 'function') return;
    if ((window.fetch as any).__sucessoEduAuth) return;

    const originalFetch = window.fetch.bind(window);

    const wrapped = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      try {
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
      } catch {
        return originalFetch(input, init);
      }
    };
    (wrapped as any).__sucessoEduAuth = true;

    try {
      Object.defineProperty(window, 'fetch', {
        value: wrapped,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    } catch {
      try {
        window.fetch = wrapped as typeof window.fetch;
      } catch {
        try {
          Object.defineProperty(globalThis, 'fetch', {
            value: wrapped,
            writable: true,
            configurable: true,
          });
        } catch (e) {
          console.warn('[SucessoEdu] Não foi possível sobrepor fetch global:', e);
        }
      }
    }
  } catch (err) {
    console.warn('[SucessoEdu] Erro ao instalar interceptador de fetch:', err);
  }
}
