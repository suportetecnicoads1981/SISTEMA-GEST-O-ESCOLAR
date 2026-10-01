/**
 * Regra de senha do SucessoEdu, igual à da nuvem (Supabase Auth > Email):
 * pelo menos 8 caracteres, com letra minúscula, letra maiúscula e número.
 * A mesma regra é conferida na função da nuvem (gerenciar-conta-nuvem) e no servidor da Sede/escola.
 */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_RULE_TEXT = 'A senha precisa ter pelo menos 8 caracteres, com letra minúscula, letra maiúscula e número (ex.: Escola2026).';

/** Devolve o que falta na senha, ou '' quando ela atende à regra. */
export function passwordProblem(password: string | null | undefined): string {
  const p = String(password || '');
  const missing: string[] = [];
  if (p.length < PASSWORD_MIN_LENGTH) missing.push(`pelo menos ${PASSWORD_MIN_LENGTH} caracteres`);
  if (!/[a-z]/.test(p)) missing.push('letra minúscula');
  if (!/[A-Z]/.test(p)) missing.push('letra maiúscula');
  if (!/[0-9]/.test(p)) missing.push('número');
  if (p.length > 72) return 'A senha pode ter no máximo 72 caracteres.';
  return missing.length ? `A senha precisa ter: ${missing.join(', ')}. Ex.: Escola2026.` : '';
}

/** Senha aleatória que já atende à regra (12 caracteres). */
export function generateStrongPassword(length = 12): string {
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const all = lower + upper + digits;
  const pick = (set: string) => {
    const b = new Uint32Array(1);
    (globalThis.crypto as Crypto).getRandomValues(b);
    return set[b[0] % set.length];
  };
  const chars = [pick(lower), pick(upper), pick(digits)];
  while (chars.length < Math.max(length, PASSWORD_MIN_LENGTH)) chars.push(pick(all));
  // Embaralha para os tipos não ficarem sempre no começo
  for (let i = chars.length - 1; i > 0; i--) {
    const b = new Uint32Array(1);
    (globalThis.crypto as Crypto).getRandomValues(b);
    const j = b[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}
