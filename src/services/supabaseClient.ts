// Reutiliza a instância única do cliente Supabase. Criar um segundo cliente
// com a mesma chave de armazenamento gerava o aviso "Multiple GoTrueClient
// instances detected" e podia causar comportamento indefinido na sessão.
export { getSupabaseClient } from './datasync/supabaseClient';
import { SUPABASE_CONFIG as DATASYNC_CONFIG } from './datasync/supabaseClient';

export const SUPABASE_CONFIG = {
  url: DATASYNC_CONFIG.projectUrl,
  anonKey: DATASYNC_CONFIG.anonKey,
};
