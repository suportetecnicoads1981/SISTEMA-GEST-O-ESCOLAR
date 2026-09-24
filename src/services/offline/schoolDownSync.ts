/**
 * Servidor Remoto (escola): recebe da Sede, pela nuvem, o que mudou na PRÓPRIA escola.
 *
 * O envio (escola → Sede) continua sendo o lote. Este é o caminho de volta (Sede → escola):
 * a escola, as turmas e os alunos dela são lidos da nuvem e mesclados na base do servidor.
 *
 * Regra da mescla (3 vias, sem perder trabalho feito na escola):
 *  - registro que só existe na nuvem: entra;
 *  - registro que a escola NÃO alterou desde o último recebimento: fica com a versão da nuvem;
 *  - registro alterado na escola e ainda não confirmado: a versão da escola é mantida
 *    (ela vai para a Sede no próximo lote);
 *  - nada é apagado por este recebimento.
 */
import { getSupabaseClient } from '../datasync/supabaseClient';
import { fromRemoteRow } from '../datasync/supabaseRowMapper';
import { sha256Hex } from '../../utils/passwordHasher';
import { stableStringify } from './batchPacket';

export const SCHOOL_PULL_KEY = 'sucessoedu_school_pull_v1';

type Rec = Record<string, any>;
export interface PullSnapshot {
  at?: string;
  hashes: Record<string, Record<string, string>>;
}

export interface SchoolTarget {
  unitId?: string;
  inep?: string;
}

const TABLE_KEYS: Array<[string, string]> = [
  ['schoolUnits', 'school_units'],
  ['classes', 'school_classes'],
  ['students', 'students'],
];

function recordHash(r: Rec): string {
  const { updatedAt, ...rest } = r || {};
  return sha256Hex(stableStringify(rest));
}

export function readPullSnapshot(): PullSnapshot {
  try {
    const raw = localStorage.getItem(SCHOOL_PULL_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' && parsed.hashes ? parsed : { hashes: {} };
  } catch {
    return { hashes: {} };
  }
}

function writePullSnapshot(s: PullSnapshot) {
  try {
    localStorage.setItem(SCHOOL_PULL_KEY, JSON.stringify(s));
  } catch {
    /* sem espaço: o próximo recebimento só fica mais conservador */
  }
}

const validInep = (v: any) => /^\d{8}$/.test(String(v ?? '').trim()) || /^\d{10}$/.test(String(v ?? '').trim());

/** Mescla em 3 vias de uma lista (pura, testável). */
export function mergeDown(
  localList: Rec[] | undefined,
  remoteList: Rec[],
  snapshot: Record<string, string> = {}
): { list: Rec[]; added: number; updated: number; keptLocal: number; hashes: Record<string, string> } {
  const local = Array.isArray(localList) ? localList.filter(Boolean) : [];
  const byId = new Map(local.map((r) => [String(r.id), r]));
  const order = local.map((r) => String(r.id));
  let added = 0;
  let updated = 0;
  let keptLocal = 0;
  const hashes: Record<string, string> = {};

  for (const remote of remoteList) {
    if (!remote || remote.id === undefined) continue;
    const id = String(remote.id);
    const current = byId.get(id);
    if (!current) {
      byId.set(id, remote);
      order.push(id);
      added++;
      hashes[id] = recordHash(remote);
      continue;
    }
    const merged = { ...current, ...remote };
    if (recordHash(merged) === recordHash(current)) {
      hashes[id] = recordHash(current);
      continue; // já igual
    }
    const known = snapshot[id];
    const unchangedHere = known !== undefined && known === recordHash(current);
    const remoteNewer =
      Date.parse(String(remote.updatedAt || '')) > Date.parse(String(current.updatedAt || '')) ||
      (!current.updatedAt && known === undefined);
    if (unchangedHere || (known === undefined && remoteNewer)) {
      byId.set(id, merged);
      updated++;
      hashes[id] = recordHash(merged);
    } else {
      keptLocal++;
      hashes[id] = known ?? recordHash(current);
    }
  }
  return { list: order.map((id) => byId.get(id)!).filter(Boolean), added, updated, keptLocal, hashes };
}

function mapStudent(row: Rec): Rec {
  const m = fromRemoteRow(row);
  if (row.registration_number) m.enrollmentNumber = row.registration_number;
  if (typeof row.has_aee === 'boolean') m.hasAEE = row.has_aee;
  delete m.registrationNumber;
  delete m.hasAee;
  delete m.createdAt;
  return m;
}
function mapClass(row: Rec): Rec {
  const m = fromRemoteRow(row);
  if (row.capacity) m.maxCapacity = row.capacity;
  delete m.capacity;
  delete m.createdAt;
  return m;
}
function mapUnit(row: Rec): Rec {
  const m = fromRemoteRow(row);
  delete m.createdAt;
  return m;
}

/**
 * Lê da nuvem a escola do servidor e mescla na base local. Devolve a base nova (ou null se
 * nada mudou) e um resumo. `target` vem da própria base (escola cadastrada) ou do pacote.
 */
export async function pullSchoolFromCloud(
  local: Rec,
  target: SchoolTarget
): Promise<{ next: Rec | null; note: string }> {
  const client = getSupabaseClient();
  const localUnits: Rec[] = Array.isArray(local.schoolUnits) ? local.schoolUnits : [];
  const localUnit =
    localUnits.find((u) => target.unitId && u?.id === target.unitId) ||
    localUnits.find((u) => validInep(target.inep) && String(u?.inepCode || '').trim() === String(target.inep).trim()) ||
    localUnits[0];

  const { data: unitRows, error: unitErr } = await client.from('school_units').select('*');
  if (unitErr) throw new Error(unitErr.message);
  const inep = String(localUnit?.inepCode || target.inep || '').trim();
  const cloudUnit =
    (unitRows || []).find((u: Rec) => u.id === (localUnit?.id || target.unitId)) ||
    (validInep(inep) ? (unitRows || []).find((u: Rec) => String(u.inep_code || '').trim() === inep) : undefined) ||
    (target.unitId ? (unitRows || []).find((u: Rec) => u.id === target.unitId) : undefined);
  if (!cloudUnit) return { next: null, note: '' };

  const [classesRes, studentsRes] = await Promise.all([
    client.from('school_classes').select('*').eq('school_unit_id', cloudUnit.id),
    client.from('students').select('*').eq('school_unit_id', cloudUnit.id),
  ]);
  if (classesRes.error) throw new Error(classesRes.error.message);
  if (studentsRes.error) throw new Error(studentsRes.error.message);

  // Escola cadastrada à mão aqui com outro id, mas mesmo INEP: os registros ficam na escola local
  const localUnitId = localUnit?.id || cloudUnit.id;
  const toLocalUnit = (r: Rec) => (r.schoolUnitId === cloudUnit.id ? { ...r, schoolUnitId: localUnitId } : r);
  const remote = {
    schoolUnits: [{ ...mapUnit(cloudUnit), id: localUnitId }],
    classes: (classesRes.data || []).map(mapClass).map(toLocalUnit),
    students: (studentsRes.data || []).map(mapStudent).map(toLocalUnit),
  } as Record<string, Rec[]>;
  if (localUnit) {
    // A escola local mantém os campos que só existem aqui (tipo, zona, anexos...)
    remote.schoolUnits = [{ ...localUnit, ...remote.schoolUnits[0] }];
  }

  const snap = readPullSnapshot();
  const next: Rec = { ...local };
  let added = 0;
  let updated = 0;
  let keptLocal = 0;
  const newHashes: PullSnapshot['hashes'] = { ...snap.hashes };
  for (const [key] of TABLE_KEYS) {
    const r = mergeDown(local[key], remote[key] || [], snap.hashes[key] || {});
    next[key] = r.list;
    added += r.added;
    updated += r.updated;
    keptLocal += r.keptLocal;
    newHashes[key] = { ...(snap.hashes[key] || {}), ...r.hashes };
  }
  writePullSnapshot({ at: new Date().toISOString(), hashes: newHashes });

  if (added === 0 && updated === 0) return { next: null, note: keptLocal ? `${keptLocal} alteração(ões) da escola aguardando envio à Sede.` : '' };
  return {
    next,
    note: `Recebido da Sede: ${added} novo(s), ${updated} atualizado(s)` + (keptLocal ? `; ${keptLocal} alteração(ões) da escola mantida(s)` : '') + '.',
  };
}
