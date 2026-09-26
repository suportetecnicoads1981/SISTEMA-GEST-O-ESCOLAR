/**
 * CPF e idade do aluno.
 *
 * Regra do cadastro: o aluno pode ser salvo sem CPF (fica com a pendência
 * "CPF do Aluno"), mas, quando o CPF é informado, ele precisa ser válido.
 */

/** Só os dígitos. */
export const cpfDigits = (value: string | undefined | null): string => String(value || '').replace(/\D/g, '');

/** "12345678909" → "123.456.789-09" (formata também enquanto se digita). */
export function formatCpf(value: string | undefined | null): string {
  const n = cpfDigits(value).slice(0, 11);
  if (n.length > 9) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`;
  if (n.length > 6) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`;
  if (n.length > 3) return `${n.slice(0, 3)}.${n.slice(3)}`;
  return n;
}

/** Confere os dois dígitos verificadores. Recusa sequências repetidas (111.111.111-11). */
export function isValidCpf(value: string | undefined | null): boolean {
  const n = cpfDigits(value);
  if (n.length !== 11 || /^(\d)\1{10}$/.test(n)) return false;
  const dv = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(n[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(n[9]) && dv(10) === Number(n[10]);
}

/** Sem CPF (vazio ou o marcador 000.000.000-00 das importações). */
export const isCpfMissing = (value: string | undefined | null): boolean => {
  const n = cpfDigits(value);
  return n.length === 0 || /^0+$/.test(n);
};

/** Situação do CPF para o cadastro. */
export type CpfState = 'OK' | 'FALTANDO' | 'INVALIDO';
export function cpfState(value: string | undefined | null): CpfState {
  if (isCpfMissing(value)) return 'FALTANDO';
  return isValidCpf(value) ? 'OK' : 'INVALIDO';
}

/** CPF que ainda precisa ser resolvido (faltando ou inválido). */
export const isCpfPending = (value: string | undefined | null): boolean => cpfState(value) !== 'OK';

/** Nome da pendência usada em pendingFields. */
export const CPF_PENDING_LABEL = 'CPF do Aluno';

/** Datas-marcador usadas pelas importações quando a data real não veio. */
const PLACEHOLDER_BIRTHS = new Set(['2020-01-01', '2012-01-01']);

/** Idade completa em anos na data de hoje (ou na data informada). null se a data for inválida. */
export function ageFromBirthDate(birthDate: string | undefined | null, today = new Date()): number | null {
  const s = String(birthDate || '').slice(0, 10);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m || PLACEHOLDER_BIRTHS.has(s)) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < mo || (today.getMonth() + 1 === mo && today.getDate() < d)) age -= 1;
  return age >= 0 && age < 120 ? age : null;
}

/** "10 anos", "1 ano", "menos de 1 ano"; '' sem data válida. */
export function formatAge(birthDate: string | undefined | null, today = new Date()): string {
  const age = ageFromBirthDate(birthDate, today);
  if (age === null) return '';
  if (age === 0) return 'menos de 1 ano';
  return `${age} ${age === 1 ? 'ano' : 'anos'}`;
}

/** Data de nascimento no futuro (erro de digitação). */
export function isFutureBirthDate(birthDate: string | undefined | null, today = new Date()): boolean {
  const s = String(birthDate || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  return new Date(s + 'T00:00:00').getTime() > today.getTime();
}

/**
 * Atualiza a pendência de CPF na lista de pendências do aluno.
 * Remove quando o CPF está certo; acrescenta quando falta ou é inválido.
 */
export function withCpfPending(pendingFields: string[] | undefined, cpf: string | undefined | null): string[] {
  const others = (pendingFields || []).filter((f) => !/^cpf\b/i.test(String(f).trim()) && String(f).trim() !== CPF_PENDING_LABEL);
  return isCpfPending(cpf) ? [...others, CPF_PENDING_LABEL] : others;
}
