/**
 * RA (matrícula) gerado pela nuvem.
 *
 * Antes cada computador numerava o RA sozinho e os números "brigavam" na nuvem
 * (vai e vem de RA). Agora:
 *  - aluno novo nasce com um RA PROVISÓRIO ("RA-PROV-XXXXXXX"), calculado a partir
 *    do id do aluno — é o mesmo em qualquer computador;
 *  - assim que houver conexão com a nuvem, o sistema pede o número definitivo à
 *    função reserve_student_ras do Supabase. A nuvem guarda qual RA cada aluno
 *    recebeu: se dois computadores pedirem para o mesmo aluno, os dois recebem o
 *    MESMO número. Nenhum computador numera mais por conta própria.
 */
import { getSupabaseClient } from './supabaseClient';

export const PROVISIONAL_RA_PREFIX = 'RA-PROV-';

export function isProvisionalRa(ra: unknown): boolean {
  return String(ra || '').startsWith(PROVISIONAL_RA_PREFIX);
}

/** RA provisório estável: sempre o mesmo para o mesmo aluno (id). */
export function provisionalRaFor(studentId: string): string {
  let h1 = 2166136261;
  let h2 = 5381;
  for (let i = 0; i < studentId.length; i++) {
    const c = studentId.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
    h2 = (Math.imul(h2, 33) + c) >>> 0;
  }
  const tag = (h1.toString(36) + h2.toString(36)).toUpperCase().replace(/[^A-Z0-9]/g, '');
  return `${PROVISIONAL_RA_PREFIX}${tag.slice(0, 10).padStart(10, '0')}`;
}

/**
 * Pede à nuvem o RA definitivo de cada aluno. Retorna um mapa id → RA,
 * ou null quando não há login na nuvem / sem internet (fica o provisório).
 */
export async function reserveRasForStudents(studentIds: string[]): Promise<Map<string, string> | null> {
  const ids = Array.from(new Set(studentIds.filter(Boolean)));
  if (!ids.length) return new Map();
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return null;
  try {
    const supabase = getSupabaseClient();
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) return null;
    const out = new Map<string, string>();
    for (let k = 0; k < ids.length; k += 500) {
      const part = ids.slice(k, k + 500);
      const { data, error } = await supabase.rpc('reserve_student_ras', { p_student_ids: part });
      if (error || !Array.isArray(data)) {
        console.warn('[RA] A nuvem não entregou os números agora; ficam os provisórios.', error);
        return out.size ? out : null;
      }
      data.forEach((row: any) => {
        if (row?.student_id && row?.registration_number) out.set(String(row.student_id), String(row.registration_number));
      });
    }
    return out;
  } catch (err) {
    console.warn('[RA] Sem acesso à nuvem para gerar RA; ficam os provisórios.', err);
    return null;
  }
}

/**
 * Troca os RAs provisórios pelos definitivos da nuvem.
 * Devolve a nova lista (ou a mesma, se nada mudou) e quantos foram trocados.
 */
export async function resolveProvisionalRas<T extends { id: string; enrollmentNumber?: string }>(
  students: T[]
): Promise<{ students: T[]; resolved: number }> {
  const pending = (students || []).filter((s) => s && isProvisionalRa(s.enrollmentNumber));
  if (!pending.length) return { students, resolved: 0 };
  const map = await reserveRasForStudents(pending.map((s) => String(s.id)));
  if (!map || !map.size) return { students, resolved: 0 };
  const now = new Date().toISOString();
  let resolved = 0;
  const next = students.map((s) => {
    if (!s || !isProvisionalRa(s.enrollmentNumber)) return s;
    const ra = map.get(String(s.id));
    if (!ra) return s;
    resolved++;
    return { ...s, enrollmentNumber: ra, updatedAt: now } as T;
  });
  return { students: resolved ? next : students, resolved };
}
