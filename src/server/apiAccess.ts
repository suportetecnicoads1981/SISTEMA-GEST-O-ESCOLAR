/**
 * Regras de acesso às rotas /api do servidor (server.ts).
 *
 * Mantidas em um módulo separado e sem dependências para poderem ser testadas.
 *
 *  - public: descoberta de rede, estações de trabalho da rede local e leitura
 *            do catálogo de atualizações. Funcionam sem login (inclusive offline).
 *  - self:   rotas que já fazem a própria verificação de ADMIN com a chave de serviço.
 *  - staff:  exigem login na nuvem com perfil ADMIN ou TEACHER (ex.: IA paga).
 *  - admin:  exigem login na nuvem com perfil ADMIN. Qualquer rota nova que não
 *            esteja listada cai aqui (falha fechada).
 */
export type ApiAccessLevel = 'public' | 'self' | 'staff' | 'admin';

const PUBLIC_ROUTES = new Set<string>([
  'GET /api/health',
  'GET /api/ping',
  'GET /api/server-info',
  'GET /api/network-ip',
  // Estações da rede local enviam registro/backup por scripts (sem login na nuvem).
  'POST /api/sync',
  'POST /api/sync/station',
  // Catálogo de atualizações: somente leitura.
  'GET /api/updates/cloud-repository',
  'GET /api/updates/cloud-files',
  'GET /api/updates/cloud-status',
  'GET /api/updates/download-test-file',
  'GET /api/updates/test-file-content',
]);

const PUBLIC_PREFIXES = ['GET /api/updates/download/'];

const SELF_CHECKED_ROUTES = new Set<string>([
  'POST /api/admin/cloud-user',
  'POST /api/update-user-role',
]);

const STAFF_PREFIXES = ['/api/ai/'];

export const API_ROLES = ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] as const;

/** Normaliza o caminho: sem query string, sem barras finais repetidas. */
export function normalizeApiPath(rawPath: string): string {
  const withoutQuery = (rawPath || '').split('?')[0].split('#')[0];
  const collapsed = withoutQuery.replace(/\/{2,}/g, '/');
  return collapsed.length > 1 ? collapsed.replace(/\/+$/, '') : collapsed;
}

export function classifyApiRoute(method: string, rawPath: string): ApiAccessLevel {
  const m = (method || 'GET').toUpperCase();
  const p = normalizeApiPath(rawPath);
  // HEAD segue as mesmas regras do GET.
  const key = `${m === 'HEAD' ? 'GET' : m} ${p}`;

  if (PUBLIC_ROUTES.has(key)) return 'public';
  if (PUBLIC_PREFIXES.some((prefix) => key.startsWith(prefix))) return 'public';
  if (SELF_CHECKED_ROUTES.has(key)) return 'self';
  if (STAFF_PREFIXES.some((prefix) => p.startsWith(prefix))) return 'staff';
  return 'admin';
}

/** Decide, a partir do papel da sessão, se a rota pode ser acessada. */
export function isRoleAllowed(level: ApiAccessLevel, role: string | null | undefined): boolean {
  if (level === 'public' || level === 'self') return true;
  const r = String(role || '').toUpperCase();
  if (level === 'staff') return r === 'ADMIN' || r === 'TEACHER';
  return r === 'ADMIN';
}

export function extractBearerToken(header: string | undefined | null): string {
  const value = String(header || '');
  return value.toLowerCase().startsWith('bearer ') ? value.slice(7).trim() : '';
}
