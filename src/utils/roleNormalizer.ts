import { UserRole } from '../types';

/**
 * Normaliza qualquer string ou objeto de perfil de forma segura para uma UserRole válida.
 * Evita erros do tipo "Cannot read properties of undefined (reading 'TEACHER'/'ADMIN')".
 */
export const normalizeRole = (rawRole: any): UserRole => {
  if (!rawRole) return 'STUDENT';

  // Se o objeto fornecido for um objeto contendo role ou app_metadata
  if (typeof rawRole === 'object') {
    if (rawRole.role) {
      return normalizeRole(rawRole.role);
    }
    if (rawRole.app_metadata?.role) {
      return normalizeRole(rawRole.app_metadata.role);
    }
    return 'STUDENT';
  }

  if (typeof rawRole !== 'string') return 'STUDENT';

  const cleanRole = rawRole.trim().toUpperCase();

  switch (cleanRole) {
    case 'ADMIN':
    case 'ADMINISTRADOR':
    case 'SECRETARIA':
    case 'DIRECTOR':
    case 'DIRETOR':
      return 'ADMIN';

    case 'TEACHER':
    case 'PROFESSOR':
    case 'DOCENTE':
    case 'INSTRUTOR':
      return 'TEACHER';

    case 'STUDENT':
    case 'ALUNO':
    case 'ESTUDANTE':
      return 'STUDENT';

    case 'PARENT':
    case 'PAI':
    case 'MAE':
    case 'RESPONSAVEL':
      return 'PARENT';

    case 'GUEST':
    case 'VISITANTE':
      return 'GUEST';

    default:
      return 'STUDENT';
  }
};

/**
 * Utilitário para verificar permissões sem risco de TypeError
 */
export const hasRoleAccess = (userRole: any, allowedRoles?: UserRole[]): boolean => {
  const safeRole = normalizeRole(userRole);
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.includes(safeRole);
};

/**
 * Utilitário seguro para verificar se o objeto de preferências do perfil possui a role
 */
export const getRolePreferenceSafely = <T>(
  preferencesObj: any,
  role: UserRole | string,
  fallbackValue?: T
): T | undefined => {
  if (!preferencesObj || typeof preferencesObj !== 'object') {
    return fallbackValue;
  }
  const safeRole = normalizeRole(role);
  return (
    preferencesObj?.[safeRole] ||
    preferencesObj?.['ADMIN'] ||
    preferencesObj?.['STUDENT'] ||
    fallbackValue
  );
};
