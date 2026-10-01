/**
 * Perfil do usuário na nuvem (Supabase Auth, app_metadata), a partir do cadastro de usuários:
 * - Master: ADMIN (a marca de Master na nuvem é dada só pelo servidor, nunca pelo sistema).
 * - Lotado numa escola: ESCOLA + escola. Na nuvem ele lê e grava só a escola e as anexas dela,
 *   e não exclui nada (exclusões ficam com a Sede).
 * - Sem escola (Rede / Coordenação da SEMED): o papel do cadastro (ADMIN, TEACHER...).
 */
export interface CloudProfile {
  role: string;
  schoolUnitId?: string;
}

export function cloudProfileFor(user: {
  role?: string;
  sector?: string;
  isMaster?: boolean;
  schoolUnitId?: string | null;
}): CloudProfile {
  if (user?.isMaster || user?.sector === 'MASTER') return { role: 'ADMIN' };
  const school = String(user?.schoolUnitId || '').trim();
  if (school) return { role: 'ESCOLA', schoolUnitId: school };
  return { role: String(user?.role || 'ADMIN').toUpperCase() };
}

export function sameCloudProfile(a: CloudProfile, b: CloudProfile): boolean {
  return a.role === b.role && (a.schoolUnitId || '') === (b.schoolUnitId || '');
}
