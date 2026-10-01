/**
 * Escola em foco (usuários da Sede / rede inteira).
 *
 * Quem não está lotado em uma escola (Master e "Rede Municipal Global") vê a rede inteira.
 * Para trabalhar com mais precisão, ele pode escolher no topo da tela uma escola em foco
 * (ou a escola sede junto com as anexas dela). Todas as telas passam a mostrar só os dados
 * dessa escola. É só um filtro de visão: não muda as permissões do usuário, e o cadastro de
 * escolas continua completo (para transferir aluno para outra escola, por exemplo).
 *
 * Proteção: como as telas só enxergam a escola em foco, um registro de outra escola que
 * "sumir" de uma gravação (a tela regravou a lista que conhecia) volta como estava.
 */
import { SCHOOL_SCOPED_COLLECTIONS, buildSchoolIndex, recordInSchools } from './schoolScope';
import { annexesOf } from '../../utils/schoolAnnexes';
import type { SchoolUnit } from '../../types';

export interface SchoolFocus {
  unitId: string;
  withAnnexes?: boolean;
}

/** Cadastros que continuam completos com a escola em foco. */
const KEEP_FULL: ReadonlySet<string> = new Set(['schoolUnits']);

const text = (v: unknown) => (v == null ? '' : String(v).trim());

/** Escolas da escola em foco (ela e, se pedido, as anexas). Vazio = rede inteira. */
export function focusSchoolIds(focus: SchoolFocus | null | undefined, units: Pick<SchoolUnit, 'id' | 'name' | 'parentUnitId'>[] | undefined): string[] {
  const id = text(focus?.unitId);
  if (!id) return [];
  const ids = [id];
  if (focus?.withAnnexes) annexesOf(id, units as any).forEach((a: any) => ids.push(a.id));
  return ids;
}

/** Dados vistos com a escola em foco (o estado completo não é alterado). */
export function scopeDataToFocus<T extends Record<string, any>>(state: T, ids: readonly string[]): T {
  if (!state || !ids.length) return state;
  const set = new Set(ids);
  const index = buildSchoolIndex(state);
  const out: Record<string, any> = { ...state };
  for (const collection of SCHOOL_SCOPED_COLLECTIONS) {
    if (KEEP_FULL.has(collection)) continue;
    const list = (state as any)[collection];
    if (!Array.isArray(list)) continue;
    out[collection] = list.filter((r) => recordInSchools(collection, r, index, set));
  }
  return out as T;
}

const idOf = (r: any, i: number) => (r && typeof r === 'object' && r.id != null ? String(r.id) : `#${i}`);

/**
 * Registros fora da escola em foco que sumiram da gravação voltam como estavam
 * (a tela não os mostrava, então não houve pedido de exclusão).
 */
export function restoreHiddenRecords<T extends Record<string, any>>(prev: T, next: T, ids: readonly string[]): T {
  if (!ids.length || !prev || !next || prev === next) return next;
  const set = new Set(ids);
  const index = buildSchoolIndex(prev);
  let result: Record<string, any> | null = null;
  for (const collection of SCHOOL_SCOPED_COLLECTIONS) {
    if (KEEP_FULL.has(collection)) continue;
    const before = (prev as any)[collection];
    const after = (next as any)[collection];
    if (before === after || !Array.isArray(before) || !Array.isArray(after)) continue;
    const present = new Set(after.map((r: any, i: number) => idOf(r, i)));
    const missing = before.filter((r: any, i: number) => !present.has(idOf(r, i)) && !recordInSchools(collection, r, index, set));
    if (missing.length) {
      result = result || { ...next };
      result[collection] = [...after, ...missing];
    }
  }
  return (result as T) || next;
}

/** Chave onde a escola em foco de cada usuário fica guardada neste computador. */
export const focusStorageKey = (userId: string | null | undefined) => `sucessoedu_school_focus_${text(userId) || 'anon'}`;

export function readStoredFocus(userId: string | null | undefined): SchoolFocus | null {
  try {
    const raw = localStorage.getItem(focusStorageKey(userId));
    if (!raw) return null;
    const v = JSON.parse(raw);
    return v && typeof v.unitId === 'string' && v.unitId ? { unitId: v.unitId, withAnnexes: !!v.withAnnexes } : null;
  } catch {
    return null;
  }
}

export function storeFocus(userId: string | null | undefined, focus: SchoolFocus | null): void {
  try {
    if (focus?.unitId) localStorage.setItem(focusStorageKey(userId), JSON.stringify(focus));
    else localStorage.removeItem(focusStorageKey(userId));
  } catch {
    /* sem armazenamento: o foco vale só nesta sessão */
  }
}
