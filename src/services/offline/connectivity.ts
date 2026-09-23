/**
 * Verificação real de acesso à nuvem (Supabase).
 *
 * navigator.onLine só diz se há rede, não se há internet: numa escola com rede
 * local e sem internet ele continua "online" e cada tentativa de login esperava
 * 8 segundos. Aqui a nuvem é testada com uma requisição curta ao Supabase.
 */
import { SUPABASE_CONFIG } from '../datasync/supabaseClient';

const CACHE_MS = 20_000;
let cache: { at: number; ok: boolean } | null = null;
let inflight: Promise<boolean> | null = null;

export async function isCloudReachable(timeoutMs = 2500, force = false): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    cache = { at: Date.now(), ok: false };
    return false;
  }
  if (!force && cache && Date.now() - cache.at < CACHE_MS) return cache.ok;
  if (inflight) return inflight;

  inflight = (async () => {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = setTimeout(() => controller?.abort(), timeoutMs);
    try {
      const res = await fetch(`${SUPABASE_CONFIG.projectUrl}/auth/v1/health`, {
        method: 'GET',
        headers: { apikey: SUPABASE_CONFIG.anonKey },
        cache: 'no-store',
        signal: controller?.signal,
      });
      // Qualquer resposta HTTP do Supabase prova que há caminho até a nuvem.
      const ok = res.status > 0 && res.status < 500;
      cache = { at: Date.now(), ok };
      return ok;
    } catch {
      cache = { at: Date.now(), ok: false };
      return false;
    } finally {
      clearTimeout(timer);
      inflight = null;
    }
  })();
  return inflight;
}

export function forgetCloudReachability() {
  cache = null;
}
