/**
 * Sincronização com a nuvem — versão 2 (28/09/2026).
 *
 * Substitui as rotinas antigas que gravavam na nuvem ao mesmo tempo (cópia completa a
 * cada gravação, fila de listas inteiras, conferência completa da Sede e recarga total
 * a cada alteração). Agora há UM motor, e ele:
 *
 *  1. ENVIA só o que mudou: guarda, por registro, a versão da nuvem e uma impressão
 *     digital do conteúdo; só sobe o registro cuja impressão mudou (venha a mudança da
 *     tela, do servidor da rede local, de uma importação ou de um lote).
 *  2. É RECUSADO quando está desatualizado: cada envio leva a versão que conhecia; se a
 *     nuvem já tem outra, a gravação é ignorada lá (gatilho sync_guard) e o computador
 *     recebe a versão atual. Conteúdo igual = nada acontece; diferente = aviso.
 *  3. RECEBE só o que é novo: pede à nuvem apenas o que mudou desde a última vez
 *     (server_updated_at, hora carimbada pela nuvem) e as exclusões (lápides).
 *  4. Guarda o registro COMPLETO na nuvem (coluna doc): nada se perde entre computadores.
 *
 * Servidor Remoto (escola) continua pelo lote (cloudAutoSync). Na Sede, cada estação com
 * login na nuvem roda este motor; a trava de versão impede que uma sobrescreva a outra.
 */
import { getSupabaseClient } from '../datasync/supabaseClient';
import { fromRemoteRow } from '../datasync/supabaseRowMapper';
import { getLocalServerInfo } from '../offline/localServerSync';
import { getStoredData, saveStoredData, setAfterLocalSave, performAutoBackup } from '../../data/storage';
import { SYNC_TABLES, SyncTable, APP_TABLE, SINGLETON_COLLECTION, SETTINGS_ID } from './syncTables';

// ---------------------------------------------------------------------------
// Estado guardado neste computador
// ---------------------------------------------------------------------------
interface RowMeta {
  /** Versão da nuvem que este computador conhece. */
  v: number;
  /** Impressão digital do conteúdo enviado/recebido nessa versão. */
  h: string;
}
interface StreamMeta {
  cursor?: string;
  pulled?: boolean;
  rows: Record<string, RowMeta>;
  /** Registros recusados pela nuvem (dado inválido): impressão -> motivo. Não reenvia até mudar. */
  rejected?: Record<string, { h: string; msg: string }>;
}
interface SyncMeta {
  v: 2;
  streams: Record<string, StreamMeta>;
  delCursor?: string;
  /** Marco de reinício da base que este computador já aplicou. */
  epoch?: string;
}

export const SYNC_META_KEY = 'sucessoedu_cloud_sync_v2';
const OVERLAP_MS = 30_000;
const PAGE = 1000;
const CHUNK = 100;
const TICK_MS = 60_000;
const MASS_DELETE_MIN = 20;
const MASS_DELETE_RATIO = 0.5;

export interface SyncNotice {
  at: string;
  kind: 'conflito' | 'excluido' | 'recusado';
  table: string;
  label: string;
  message: string;
}

export interface CloudSyncStatus {
  state: 'inativo' | 'sem-internet' | 'aguardando-login' | 'sincronizando' | 'ok' | 'erro';
  message?: string;
  lastSyncAt?: string;
  /** Registros alterados neste computador ainda não aceitos pela nuvem. */
  pending: number;
  lastPushed: number;
  lastPulled: number;
  rejected: number;
  notices: SyncNotice[];
  /** Avisos só da última rodada. */
  lastNotices: SyncNotice[];
}

let status: CloudSyncStatus = { state: 'inativo', pending: 0, lastPushed: 0, lastPulled: 0, rejected: 0, notices: [], lastNotices: [] };
const listeners = new Set<(s: CloudSyncStatus) => void>();
let running: Promise<CloudSyncStatus> | null = null;
let rerun = false;
let scheduleTimer: ReturnType<typeof setTimeout> | null = null;
let tickTimer: ReturnType<typeof setInterval> | null = null;
let started = false;

function setStatus(patch: Partial<CloudSyncStatus>) {
  status = { ...status, ...patch };
  listeners.forEach((fn) => {
    try {
      fn(status);
    } catch {
      /* ouvinte com erro */
    }
  });
}

export function getCloudSyncStatus(): CloudSyncStatus {
  return status;
}

export function subscribeCloudSync(fn: (s: CloudSyncStatus) => void): () => void {
  listeners.add(fn);
  fn(status);
  return () => listeners.delete(fn);
}

function readMeta(): SyncMeta {
  try {
    const m = JSON.parse(localStorage.getItem(SYNC_META_KEY) || 'null');
    if (m && m.v === 2 && m.streams) return m;
  } catch {
    /* ilegível: recomeça */
  }
  return { v: 2, streams: {} };
}

function writeMeta(m: SyncMeta) {
  try {
    localStorage.setItem(SYNC_META_KEY, JSON.stringify(m));
  } catch (err) {
    console.warn('[Sincronização] Não foi possível guardar o controle de versões neste computador:', err);
  }
}

/** Apaga o controle de versões: a próxima rodada faz a conferência completa. */
export function resetCloudSyncMeta() {
  try {
    localStorage.removeItem(SYNC_META_KEY);
  } catch {
    /* sem armazenamento */
  }
}

// ---------------------------------------------------------------------------
// Registros
// ---------------------------------------------------------------------------

/** Impressão digital (FNV-1a 32 bits + tamanho) do texto do registro. */
export function fingerprint(value: unknown): string {
  const s = JSON.stringify(value ?? null);
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return `${h.toString(36)}.${s.length.toString(36)}`;
}

const docOf = (t: SyncTable, rec: any) => (t.toDoc ? t.toDoc(rec) : rec);
const hashOf = (t: SyncTable, rec: any) => fingerprint(docOf(t, rec));

/** Registros da coleção por id (formato da nuvem). */
export function recordsOf(state: Record<string, any>, t: SyncTable): Map<string, any> {
  const out = new Map<string, any>();
  const v = state?.[t.key];
  if (t.kind === 'list' || t.kind === 'appList') {
    if (Array.isArray(v)) for (const r of v) if (r && r.id !== undefined && r.id !== null && !t.skip?.(r)) out.set(String(r.id), r);
  } else if (t.kind === 'single') {
    if (v && typeof v === 'object') out.set(SETTINGS_ID, v);
  } else if (v !== undefined) {
    out.set(t.key, { value: v });
  }
  return out;
}

const appCollection = (t: SyncTable) => (t.kind === 'appSingle' ? SINGLETON_COLLECTION : t.key);

export function buildRow(t: SyncTable, id: string, rec: any, base: number, schoolIds?: Set<string>): Record<string, any> | null {
  const doc = docOf(t, rec);
  if (t.table === APP_TABLE) return { collection: appCollection(t), id, doc, base_version: base };
  const cols = t.toColumns ? t.toColumns(rec) : {};
  if (!cols) return null;
  // Escola que não existe mais (apagada): a coluna vai vazia para a nuvem não recusar o registro
  // inteiro. O registro completo (doc) guarda a escola original, então um usuário lotado nela
  // continua restrito (não passa a ver a rede toda) até o Master escolher a escola correta.
  if (schoolIds && t.table !== 'school_units' && cols.school_unit_id && !schoolIds.has(String(cols.school_unit_id))) {
    cols.school_unit_id = null;
  }
  return { ...cols, id, doc, base_version: base };
}

/** Escolas que existem neste computador (para não enviar vínculo com escola apagada). */
export function knownSchoolIds(state: Record<string, any>): Set<string> {
  const list = Array.isArray(state?.schoolUnits) ? state.schoolUnits : [];
  return new Set(list.filter((u: any) => u && u.id != null).map((u: any) => String(u.id)));
}

const INTERNAL = ['doc', 'rowVersion', 'baseVersion', 'serverUpdatedAt', 'row_version', 'base_version', 'server_updated_at'];

/** Linha da nuvem -> registro local. */
export function rowToRecord(t: SyncTable, row: any, local: any | undefined): any {
  let rec: any;
  if (row?.doc && typeof row.doc === 'object') {
    rec = Array.isArray(row.doc) ? row.doc : { ...row.doc };
  } else {
    // Linha antiga (sem registro completo): mescla sobre o local para não perder campos.
    const mapped = t.fromLegacyRow ? t.fromLegacyRow(row) : fromRemoteRow(row);
    rec = t.kind === 'appSingle' ? { value: mapped?.value } : { ...(local || {}), ...mapped };
  }
  if (rec && typeof rec === 'object' && !Array.isArray(rec)) for (const k of INTERNAL) delete rec[k];
  return t.afterPull ? t.afterPull(rec, row, local) : rec;
}

// ---------------------------------------------------------------------------
// Marco de reinício da base (limpeza para reimportação)
// ---------------------------------------------------------------------------

/**
 * Quando a Secretaria reinicia a base na nuvem (ex.: reimportar tudo da planilha padrão),
 * grava um marco em app_records ('__system', 'epoch'): { epoch, at, clearKeys }.
 * Cada computador, na próxima rodada, faz backup automático e descarta os cadastros locais
 * alterados ANTES de `at` (os de depois — ex.: uma reimportação já feita aqui — ficam).
 * Assim nenhum computador esquecido reenvia a base antiga.
 */
export const EPOCH_COLLECTION = '__system';
export const EPOCH_ID = 'epoch';
export const DEFAULT_EPOCH_CLEAR_KEYS = [
  'students',
  'classes',
  'schoolUnits',
  'classGradeSheets',
  'attendanceSheets',
  'lessonRegistries',
  'academicHistories',
  'bnccAssessments',
  'submissions',
  'teacherStudentNotes',
];

const recordTime = (r: any) => Date.parse(String(r?.updatedAt || r?.createdAt || '')) || 0;

/** Aplica o marco no estado (pura, testável): remove os registros anteriores a `at`. */
export function applyEpochToState(state: Record<string, any>, at: string, clearKeys: string[]): { next: Record<string, any>; removed: number } {
  const limit = Date.parse(at) || 0;
  const next = { ...state };
  let removed = 0;
  for (const key of clearKeys) {
    const list = state?.[key];
    if (!Array.isArray(list)) continue;
    const kept = list.filter((r) => recordTime(r) > limit);
    removed += list.length - kept.length;
    next[key] = kept;
  }
  return { next, removed };
}

async function checkEpoch(client: ReturnType<typeof getSupabaseClient>, meta: SyncMeta): Promise<{ meta: SyncMeta; reset: string | null }> {
  const { data, error } = await client.from(APP_TABLE).select('doc').eq('collection', EPOCH_COLLECTION).eq('id', EPOCH_ID).limit(1);
  if (error || !data?.[0]?.doc?.epoch) return { meta, reset: null };
  const doc = data[0].doc as { epoch: string; at: string; clearKeys?: string[]; note?: string };
  if (meta.epoch === doc.epoch) return { meta, reset: null };
  try {
    performAutoBackup(`Antes do reinício da base (${doc.note || doc.epoch})`, 'Sistema');
  } catch (err) {
    console.warn('[Sincronização] Backup antes do reinício falhou:', err);
  }
  const { next, removed } = applyEpochToState(getStoredData() as any, doc.at, doc.clearKeys?.length ? doc.clearKeys : DEFAULT_EPOCH_CLEAR_KEYS);
  // Substituição completa: vale também para o servidor da rede local (todas as estações).
  // Reinício vindo da nuvem: no servidor da rede local conta como operação da nuvem, não do operador.
  saveStoredData(next as any, { bulkReplace: true, authoritative: true, replaceOrigin: 'cloud' });
  try {
    window.dispatchEvent(new CustomEvent('sucessoedu_db_changed', { detail: next }));
  } catch {
    /* sem janela */
  }
  const fresh: SyncMeta = { v: 2, streams: {}, epoch: doc.epoch };
  writeMeta(fresh);
  return {
    meta: fresh,
    reset: `A Secretaria reiniciou a base na nuvem (${new Date(doc.at).toLocaleString('pt-BR')}). ${removed} cadastro(s) antigos deste computador foram retirados (há backup automático).`,
  };
}

// ---------------------------------------------------------------------------
// Rodada de sincronização
// ---------------------------------------------------------------------------

interface RunContext {
  client: ReturnType<typeof getSupabaseClient>;
  isAdmin: boolean;
  meta: SyncMeta;
  snapshot: Record<string, any>;
  /** Alterações a aplicar no estado local: fluxo -> id -> registro (null = excluir). */
  changes: Map<string, Map<string, any | null>>;
  /** Impressão do registro local em que cada alteração se baseou. */
  basedOn: Map<string, Map<string, string | null>>;
  notices: SyncNotice[];
  pushed: number;
  pulled: number;
  warnings: string[];
}

const labelOf = (rec: any, id: string) =>
  String(rec?.name || rec?.title || rec?.studentName || rec?.subjectName || rec?.recipientName || rec?.code || id).slice(0, 60);

const TABLE_LABEL: Record<string, string> = {
  students: 'Aluno',
  school_classes: 'Turma',
  school_units: 'Escola',
  class_grade_sheets: 'Folha de notas',
  attendance_sheets: 'Chamada',
  user_accounts: 'Usuário',
};

function stage(ctx: RunContext, t: SyncTable, id: string, rec: any | null, localRec: any | undefined) {
  if (!ctx.changes.has(t.stream)) {
    ctx.changes.set(t.stream, new Map());
    ctx.basedOn.set(t.stream, new Map());
  }
  ctx.changes.get(t.stream)!.set(id, rec);
  ctx.basedOn.get(t.stream)!.set(id, localRec === undefined ? null : hashOf(t, localRec));
}

function streamMeta(ctx: RunContext, t: SyncTable): StreamMeta {
  if (!ctx.meta.streams[t.stream]) ctx.meta.streams[t.stream] = { rows: {} };
  return ctx.meta.streams[t.stream];
}

function scopeQuery(t: SyncTable, q: any) {
  if (t.table !== APP_TABLE) return q;
  q = q.eq('collection', appCollection(t));
  return t.kind === 'appSingle' ? q.eq('id', t.key) : q;
}

async function fetchByIds(ctx: RunContext, t: SyncTable, ids: string[]): Promise<Map<string, any>> {
  const found = new Map<string, any>();
  for (let k = 0; k < ids.length; k += CHUNK) {
    const part = ids.slice(k, k + CHUNK);
    const { data, error } = await scopeQuery(t, ctx.client.from(t.table).select('*')).in('id', part);
    if (error) throw new Error(`${t.table}: ${error.message}`);
    for (const row of data || []) found.set(String(row.id), row);
  }
  return found;
}

/** Envio das alterações de um fluxo. */
async function pushStream(ctx: RunContext, t: SyncTable) {
  const sm = streamMeta(ctx, t);
  // Primeira vez neste computador: primeiro recebe da nuvem, depois envia. Assim um computador
  // que chega com cópia antiga (ou uma segunda estação da Sede) não sobrescreve o que já está lá.
  if (!sm.pulled) return;
  if (t.adminOnly && !ctx.isAdmin) return;

  const local = recordsOf(ctx.snapshot, t);
  const dirty: Array<{ id: string; rec: any; h: string }> = [];
  for (const [id, rec] of local) {
    const h = hashOf(t, rec);
    if (sm.rows[id]?.h === h) continue;
    if (sm.rejected?.[id]?.h === h) continue; // já recusado com este conteúdo
    dirty.push({ id, rec, h });
  }

  // Exclusões: registros que a nuvem conhece e não estão mais aqui.
  const removed = Object.keys(sm.rows).filter((id) => !local.has(id));
  if (removed.length) {
    const known = Object.keys(sm.rows).length;
    if (removed.length >= MASS_DELETE_MIN && removed.length / Math.max(1, known) >= MASS_DELETE_RATIO) {
      ctx.warnings.push(
        `${removed.length} exclusões em ${TABLE_LABEL[t.table] || t.table} não foram enviadas (proteção contra apagamento em massa). Use "Conferência completa" para recuperar os registros ou peça ao suporte a limpeza.`
      );
    } else if (!ctx.isAdmin) {
      ctx.warnings.push(`${removed.length} exclusão(ões) aguardando uma conta de administrador para ir à nuvem.`);
    } else {
      for (let k = 0; k < removed.length; k += CHUNK) {
        const part = removed.slice(k, k + CHUNK);
        const { error } = await scopeQuery(t, ctx.client.from(t.table).delete()).in('id', part);
        if (error) throw new Error(`Exclusão em ${t.table}: ${error.message}`);
        part.forEach((id) => delete sm.rows[id]);
        ctx.pushed += part.length;
      }
    }
  }
  if (!dirty.length) return;

  const rows: Array<{ id: string; rec: any; h: string; row: Record<string, any> }> = [];
  const schoolIds = knownSchoolIds(ctx.snapshot);
  for (const d of dirty) {
    const row = buildRow(t, d.id, d.rec, sm.rows[d.id]?.v ?? -1, schoolIds);
    if (!row) {
      (sm.rejected ||= {})[d.id] = { h: d.h, msg: 'faltam dados obrigatórios (ex.: nome)' };
      continue;
    }
    rows.push({ ...d, row });
  }

  const conflicts: Array<{ id: string; rec: any; h: string }> = [];
  const accept = (id: string, v: number, h: string) => {
    sm.rows[id] = { v: Number(v), h };
    if (sm.rejected) delete sm.rejected[id];
  };
  const sel = t.table === APP_TABLE ? 'id,row_version' : 'id,row_version';
  const onConflict = t.table === APP_TABLE ? 'collection,id' : 'id';

  const sendChunk = async (chunk: typeof rows): Promise<void> => {
    const { data, error } = await ctx.client.from(t.table).upsert(chunk.map((c) => c.row), { onConflict }).select(sel);
    if (error) {
      if (chunk.length > 1) {
        // Isola o registro com problema: os demais seguem.
        for (const c of chunk) await sendChunk([c]);
        return;
      }
      const c = chunk[0];
      (sm.rejected ||= {})[c.id] = { h: c.h, msg: error.message };
      ctx.notices.push({
        at: new Date().toISOString(),
        kind: 'recusado',
        table: t.table,
        label: labelOf(c.rec, c.id),
        message: `${TABLE_LABEL[t.table] || 'Registro'} "${labelOf(c.rec, c.id)}" recusado pela nuvem: ${error.message}`,
      });
      return;
    }
    const back = new Map<string, number>((data || []).map((r: any) => [String(r.id), Number(r.row_version)]));
    for (const c of chunk) {
      if (back.has(c.id)) {
        accept(c.id, back.get(c.id)!, c.h);
        ctx.pushed++;
      } else conflicts.push(c);
    }
  };
  for (let k = 0; k < rows.length; k += CHUNK) await sendChunk(rows.slice(k, k + CHUNK));

  // Recusados por versão: a nuvem tem outra. Recebe a versão atual.
  if (conflicts.length) {
    const current = await fetchByIds(ctx, t, conflicts.map((c) => c.id));
    for (const c of conflicts) {
      const row = current.get(c.id);
      if (!row) {
        // Excluído na nuvem (lápide): sai daqui também.
        stage(ctx, t, c.id, null, c.rec);
        delete sm.rows[c.id];
        ctx.notices.push({
          at: new Date().toISOString(),
          kind: 'excluido',
          table: t.table,
          label: labelOf(c.rec, c.id),
          message: `${TABLE_LABEL[t.table] || 'Registro'} "${labelOf(c.rec, c.id)}" foi excluído na nuvem por outro computador; a alteração feita aqui não foi aplicada.`,
        });
        continue;
      }
      const remote = rowToRecord(t, row, c.rec);
      const rh = hashOf(t, remote);
      sm.rows[c.id] = { v: Number(row.row_version), h: rh };
      if (rh === c.h) continue; // mesmo conteúdo: só atualiza a versão
      stage(ctx, t, c.id, remote, c.rec);
      ctx.notices.push({
        at: new Date().toISOString(),
        kind: 'conflito',
        table: t.table,
        label: labelOf(remote, c.id),
        message: `${TABLE_LABEL[t.table] || 'Registro'} "${labelOf(remote, c.id)}" foi alterado em outro computador antes; ficou a versão mais recente da nuvem. Confira e refaça a alteração, se precisar.`,
      });
    }
  }
}

/** Recebe o que mudou na nuvem desde a última vez. */
async function pullStream(ctx: RunContext, t: SyncTable) {
  const sm = streamMeta(ctx, t);
  const since = sm.cursor ? new Date(Date.parse(sm.cursor) - OVERLAP_MS).toISOString() : null;
  const local = recordsOf(ctx.snapshot, t);
  let maxTs = sm.cursor || '';
  for (let from = 0; ; from += PAGE) {
    let q = scopeQuery(t, ctx.client.from(t.table).select('*'));
    if (since) q = q.gt('server_updated_at', since);
    const { data, error } = await q.order('server_updated_at', { ascending: true }).order('id', { ascending: true }).range(from, from + PAGE - 1);
    if (error) throw new Error(`${t.table}: ${error.message}`);
    const page = data || [];
    for (const row of page) {
      const id = String(row.id);
      if (row.server_updated_at && row.server_updated_at > maxTs) maxTs = row.server_updated_at;
      const known = sm.rows[id];
      const v = Number(row.row_version) || 1;
      if (known && v <= known.v) continue;
      const localRec = local.get(id);
      const localDirty = localRec !== undefined && known?.h !== hashOf(t, localRec);
      const remote = rowToRecord(t, row, localRec);
      const rh = hashOf(t, remote);
      // Linha antiga (sem registro completo): a Sede, que tem o cadastro inteiro, reenvia com doc.
      sm.rows[id] = { v, h: !row.doc && getLocalServerInfo()?.role === 'SEDE' ? '' : rh };
      if (localRec !== undefined && rh === hashOf(t, localRec)) continue;
      stage(ctx, t, id, remote, localRec);
      ctx.pulled++;
      if (localDirty && known) {
        ctx.notices.push({
          at: new Date().toISOString(),
          kind: 'conflito',
          table: t.table,
          label: labelOf(remote, id),
          message: `${TABLE_LABEL[t.table] || 'Registro'} "${labelOf(remote, id)}" foi alterado em outro computador; ficou a versão mais recente da nuvem.`,
        });
      }
    }
    if (page.length < PAGE) break;
  }
  if (maxTs) sm.cursor = maxTs;
  sm.pulled = true;
}

/** Exclusões feitas em outros computadores (lápides). */
async function pullDeletions(ctx: RunContext) {
  // Primeira vez: não precisa das lápides antigas (o que não existe na nuvem é tratado no envio).
  if (!ctx.meta.delCursor) {
    const { data } = await ctx.client.from('deleted_records').select('deleted_at').order('deleted_at', { ascending: false }).limit(1);
    ctx.meta.delCursor = data?.[0]?.deleted_at || new Date(0).toISOString();
    return;
  }
  const since = new Date(Date.parse(ctx.meta.delCursor) - OVERLAP_MS).toISOString();
  let maxTs = ctx.meta.delCursor;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await ctx.client
      .from('deleted_records')
      .select('table_name, record_id, deleted_at')
      .gt('deleted_at', since)
      .order('deleted_at', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`exclusões: ${error.message}`);
    for (const d of data || []) {
      if (d.deleted_at > maxTs) maxTs = d.deleted_at;
      let targets: Array<{ t: SyncTable; id: string }> = [];
      if (d.table_name === APP_TABLE) {
        const [collection, ...rest] = String(d.record_id).split('/');
        const id = rest.join('/');
        targets = SYNC_TABLES.filter((t) => t.table === APP_TABLE && appCollection(t) === collection && (t.kind === 'appList' || t.key === id)).map((t) => ({ t, id }));
      } else {
        targets = SYNC_TABLES.filter((t) => t.table === d.table_name).map((t) => ({ t, id: String(d.record_id) }));
      }
      for (const { t, id } of targets) {
        if (t.kind === 'single' || t.kind === 'appSingle') continue;
        const sm = streamMeta(ctx, t);
        delete sm.rows[id];
        const localRec = recordsOf(ctx.snapshot, t).get(id);
        if (localRec !== undefined) {
          stage(ctx, t, id, null, localRec);
          ctx.pulled++;
        }
      }
    }
    if ((data || []).length < PAGE) break;
  }
  ctx.meta.delCursor = maxTs;
}

/** Aplica as alterações recebidas sobre o estado MAIS RECENTE (a tela pode ter gravado no meio). */
function commit(ctx: RunContext): boolean {
  if (!ctx.changes.size) return false;
  const latest: Record<string, any> = { ...(getStoredData() as any) };
  let changed = false;
  for (const t of SYNC_TABLES) {
    const ch = ctx.changes.get(t.stream);
    if (!ch || !ch.size) continue;
    const based = ctx.basedOn.get(t.stream)!;
    const current = recordsOf(latest, t);
    // Registro alterado na tela durante a rodada: a alteração da tela vale (sobe na próxima).
    for (const [id, basedHash] of based) {
      const cur = current.get(id);
      const curHash = cur === undefined ? null : hashOf(t, cur);
      if (curHash !== basedHash) ch.delete(id);
    }
    if (!ch.size) continue;
    changed = true;
    if (t.kind === 'list' || t.kind === 'appList') {
      const arr: any[] = Array.isArray(latest[t.key]) ? latest[t.key] : [];
      const seen = new Set<string>();
      const next: any[] = [];
      for (const item of arr) {
        const id = item && item.id !== undefined ? String(item.id) : null;
        if (id !== null && ch.has(id)) {
          seen.add(id);
          const v = ch.get(id);
          if (v !== null) next.push(v);
        } else next.push(item);
      }
      for (const [id, v] of ch) if (!seen.has(id) && v !== null) next.push(v);
      latest[t.key] = next;
    } else if (t.kind === 'single') {
      const v = ch.get(SETTINGS_ID);
      if (v) latest[t.key] = v;
    } else {
      const v = ch.get(t.key);
      if (v && 'value' in v && v.value !== undefined) latest[t.key] = v.value;
    }
  }
  if (!changed) return false;
  saveStoredData(latest as any, { origin: 'cloud' });
  try {
    window.dispatchEvent(new CustomEvent('sucessoedu_db_changed', { detail: latest }));
  } catch {
    /* sem janela (testes) */
  }
  return true;
}

function countPending(meta: SyncMeta, state: Record<string, any>, isAdmin: boolean): { pending: number; rejected: number } {
  let pending = 0;
  let rejected = 0;
  for (const t of SYNC_TABLES) {
    const sm = meta.streams[t.stream];
    if (!sm) continue;
    const records = recordsOf(state, t);
    // Recusado que não existe mais aqui (ex.: excluído depois da recusa) sai da conta e do controle.
    if (sm.rejected) for (const id of Object.keys(sm.rejected)) if (!records.has(id)) delete sm.rejected[id];
    rejected += Object.keys(sm.rejected || {}).length;
    if (t.adminOnly && !isAdmin) continue;
    for (const [id, rec] of records) if (sm.rows[id]?.h !== hashOf(t, rec) && sm.rejected?.[id]?.h !== hashOf(t, rec)) pending++;
  }
  return { pending, rejected };
}

/** Este computador sincroniza direto com a nuvem? (escola com Servidor Remoto usa o lote) */
export function isCloudSyncActiveHere(): boolean {
  if (typeof window === 'undefined') return false;
  return getLocalServerInfo()?.role !== 'REMOTO';
}

async function runOnce(): Promise<CloudSyncStatus> {
  if (!isCloudSyncActiveHere()) {
    setStatus({ state: 'inativo', message: 'Esta escola envia pela Sede (lote).' });
    return status;
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    setStatus({ state: 'sem-internet', message: 'Sem internet. As alterações ficam guardadas e sobem quando a conexão voltar.' });
    return status;
  }
  const client = getSupabaseClient();
  const { data: sess } = await client.auth.getSession();
  const session = sess?.session;
  if (!session) {
    setStatus({ state: 'aguardando-login', message: 'Entre na nuvem para enviar e receber as alterações.' });
    return status;
  }
  const ctx: RunContext = {
    client,
    isAdmin: String(session.user?.app_metadata?.role || '').toUpperCase() === 'ADMIN',
    meta: readMeta(),
    snapshot: getStoredData() as any,
    changes: new Map(),
    basedOn: new Map(),
    notices: [],
    pushed: 0,
    pulled: 0,
    warnings: [],
  };
  setStatus({ state: 'sincronizando', message: 'Sincronizando com a nuvem...' });
  try {
    const epoch = await checkEpoch(client, ctx.meta);
    ctx.meta = epoch.meta;
    if (epoch.reset) {
      ctx.snapshot = getStoredData() as any;
      ctx.warnings.push(epoch.reset);
    }
    // 1) Envia o que mudou aqui. 2) Recebe o que mudou na nuvem. 3) Exclusões.
    // Na primeira vez o envio é pulado; o que só existe aqui sobe logo depois do recebimento.
    const firstTime = SYNC_TABLES.some((t) => !ctx.meta.streams[t.stream]?.pulled);
    for (const t of SYNC_TABLES) await pushStream(ctx, t);
    for (const t of SYNC_TABLES) await pullStream(ctx, t);
    await pullDeletions(ctx);
    if (firstTime) {
      // O snapshot passa a ser o estado já com o que veio da nuvem.
      commit(ctx);
      ctx.changes.clear();
      ctx.basedOn.clear();
      ctx.snapshot = getStoredData() as any;
      for (const t of SYNC_TABLES) await pushStream(ctx, t);
    }
    writeMeta(ctx.meta);
    commit(ctx);
    const after = getStoredData() as any;
    const { pending, rejected } = countPending(ctx.meta, after, ctx.isAdmin);
    writeMeta(ctx.meta); // guarda a limpeza de recusados que não existem mais
    const noticeList = [...ctx.notices, ...status.notices].slice(0, 30);
    setStatus({
      state: 'ok',
      lastSyncAt: new Date().toISOString(),
      pending,
      rejected,
      lastPushed: ctx.pushed,
      lastPulled: ctx.pulled,
      notices: noticeList,
      lastNotices: ctx.notices,
      message: ctx.warnings[0] || (rejected ? `${rejected} registro(s) recusado(s) pela nuvem — veja os detalhes.` : undefined),
    });
    if (ctx.notices.length) {
      try {
        window.dispatchEvent(new CustomEvent('sucessoedu_sync_notices', { detail: ctx.notices }));
      } catch {
        /* sem janela */
      }
    }
  } catch (err: any) {
    writeMeta(ctx.meta); // guarda o que já foi aceito
    commit(ctx);
    setStatus({ state: 'erro', message: `Falha na sincronização: ${err?.message || err}. Nova tentativa em instantes.` });
  }
  return status;
}

/** Uma rodada agora (envia e recebe). Chamadas simultâneas aguardam a rodada em andamento. */
export function syncNow(): Promise<CloudSyncStatus> {
  if (running) {
    rerun = true;
    return running;
  }
  const exec = async () => {
    const lockApi = typeof navigator !== 'undefined' ? (navigator as any).locks : null;
    // Uma aba por vez (outras abas do mesmo computador esperam a rodada terminar).
    if (lockApi?.request) return lockApi.request('sucessoedu-cloud-sync', () => runOnce());
    return runOnce();
  };
  const current = exec()
    .catch((err: any) => {
      setStatus({ state: 'erro', message: `Falha na sincronização: ${err?.message || err}` });
      return status;
    })
    .finally(() => {
      running = null;
      if (rerun) {
        rerun = false;
        schedule(500);
      }
    });
  running = current;
  return current;
}

/** Agenda uma rodada (agrupa gravações seguidas). */
export function schedule(delayMs = 1500) {
  if (typeof window === 'undefined') return;
  if (scheduleTimer) clearTimeout(scheduleTimer);
  scheduleTimer = setTimeout(() => {
    scheduleTimer = null;
    syncNow().catch(() => {});
  }, delayMs);
}

/**
 * Conferência completa (botão do administrador): esquece o controle de versões e compara
 * tudo de novo. Onde houver diferença vale a versão da nuvem; o que só existe neste
 * computador é enviado.
 */
export async function fullResync(): Promise<CloudSyncStatus> {
  resetCloudSyncMeta();
  return syncNow();
}

export function startCloudSync(): void {
  if (started || typeof window === 'undefined') return;
  started = true;
  setAfterLocalSave(() => schedule(1500));
  schedule(3000);
  tickTimer = setInterval(() => {
    if (typeof document !== 'undefined' && document.hidden && getLocalServerInfo()?.role !== 'SEDE') return;
    syncNow().catch(() => {});
  }, TICK_MS);
  window.addEventListener('online', () => schedule(500));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) schedule(800);
  });
  // Aviso da nuvem: alguém gravou. Recebe só o que mudou (não recarrega tudo).
  try {
    getSupabaseClient()
      .channel('sucessoedu-sync-v2')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => schedule(2500))
      .subscribe();
  } catch {
    /* sem realtime: o intervalo de 1 minuto cobre */
  }
  void tickTimer;
}

/** Somente para testes. */
export function __runOnceForTests() {
  return runOnce();
}
