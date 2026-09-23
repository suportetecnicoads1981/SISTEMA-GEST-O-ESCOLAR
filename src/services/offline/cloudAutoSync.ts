/**
 * Envio automático pela nuvem quando a internet aparecer.
 *
 * Usado quando o sistema roda a partir de um servidor da rede local:
 *  - Servidor Remoto (escola): gera o LOTE da escola (o mesmo .edusync do pendrive)
 *    e deixa na nuvem (tabela lotes_escolas). Nada mais da escola vai direto para
 *    as tabelas da nuvem: assim uma escola nunca sobrescreve configurações, contas
 *    ou dados de outra.
 *  - Servidor da Sede: importa os lotes pendentes (mesma mescla do pendrive), envia
 *    a base consolidada para a nuvem e, por último, recebe o que foi lançado
 *    direto na nuvem. Enviar antes de receber impede que uma cópia antiga da nuvem
 *    desfaça alterações feitas na Sede sem internet.
 * Sem internet, nada acontece e o trabalho segue normalmente na rede local.
 */
import { getSupabaseClient } from '../datasync/supabaseClient';
import { SupabaseDatabaseService } from '../datasync/SupabaseDatabaseService';
import { SupabasePersistenceService } from '../supabasePersistenceService';
import { getStoredData, saveStoredData } from '../../data/storage';
import { sha256Hex } from '../../utils/passwordHasher';
import { isCloudReachable } from './connectivity';
import { getLocalServerInfo, isLocalServerMode, LOCAL_VERSION_KEY } from './localServerSync';
import { parseLoteFile, stableStringify, LotePacket, isOlderThanLastImport } from './batchPacket';
import { generateLote, importLote } from './loteService';

export interface CloudSyncStatus {
  state: 'inativo' | 'sem-internet' | 'aguardando-login' | 'enviando' | 'enviado' | 'erro';
  lastPushAt?: string;
  message?: string;
}

const LAST_PUSH_KEY = 'sucessoedu_cloud_last_push_v1';
const LAST_LOTE_KEY = 'sucessoedu_cloud_last_lote_v1';
const TICK_MS = 60_000;
const MIN_PUSH_INTERVAL_MS = 10 * 60_000;
export const LOTES_TABLE = 'lotes_escolas';

let status: CloudSyncStatus = { state: 'inativo' };
const listeners = new Set<(s: CloudSyncStatus) => void>();
let running = false;
let timer: ReturnType<typeof setInterval> | null = null;

function readJson(key: string): any {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}') || {};
  } catch {
    return {};
  }
}

function writeJson(key: string, value: any) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* sem espaço */
  }
}

function setStatus(next: CloudSyncStatus) {
  status = { lastPushAt: readJson(LAST_PUSH_KEY).at, ...next };
  listeners.forEach((fn) => {
    try {
      fn(status);
    } catch {
      /* ignora ouvinte com erro */
    }
  });
}

export function getCloudSyncStatus(): CloudSyncStatus {
  return status;
}

export function subscribeCloudSyncStatus(fn: (s: CloudSyncStatus) => void): () => void {
  listeners.add(fn);
  fn(status);
  return () => listeners.delete(fn);
}

/** Impressão digital do conteúdo do lote (sem data de geração), para não reenviar lote igual. */
function loteFingerprint(p: LotePacket): string {
  return sha256Hex(stableStringify({ unit: p.schoolUnit?.inepCode || p.schoolUnit?.id, data: p.data, deletions: p.deletions }));
}

async function sendSchoolLote(force: boolean): Promise<string> {
  const units = (getStoredData() as any).schoolUnits || [];
  const unit = units[0];
  if (!unit) return 'Cadastre a unidade escolar (Rede Municipal & Polos > Escolas) para enviar o lote à Sede pela nuvem.';
  const packet = await generateLote(unit, 'Envio automático pela internet');
  const fingerprint = loteFingerprint(packet);
  const last = readJson(LAST_LOTE_KEY);
  if (!force && last.fingerprint === fingerprint) return 'Nenhuma alteração desde o último envio à Sede.';

  const { error } = await getSupabaseClient()
    .from(LOTES_TABLE)
    .insert({
      id: packet.packetId,
      school_unit_id: packet.schoolUnit.id,
      school_inep: packet.schoolUnit.inepCode || null,
      school_name: packet.schoolUnit.name,
      sha256: packet.sha256,
      lote_created_at: packet.createdAt,
      payload: packet,
    });
  if (error) throw new Error(error.message);
  writeJson(LAST_LOTE_KEY, { fingerprint, packetId: packet.packetId, at: new Date().toISOString() });
  return `Lote da escola enviado à Sede pela internet (${packet.counts.students || 0} aluno(s)).`;
}

async function importPendingLotes(userId: string): Promise<string[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from(LOTES_TABLE)
    .select('id, payload')
    .is('imported_at', null)
    .order('lote_created_at', { ascending: true })
    .limit(20);
  if (error) throw new Error(error.message);
  const notes: string[] = [];
  for (const row of data || []) {
    try {
      const parsed = parseLoteFile(JSON.stringify(row.payload));
      if (isOlderThanLastImport(getStoredData() as any, parsed.packet)) {
        notes.push(`Lote ${row.id} ignorado: é mais antigo que o último já importado da escola`);
        await client.from(LOTES_TABLE).update({ imported_at: new Date().toISOString(), imported_by: userId }).eq('id', row.id);
        continue;
      }
      const report = importLote(parsed.packet, 'Envio automático pela internet');
      notes.push(`${report.unitName}: ${Object.values(report.added).reduce((a, b) => a + b, 0)} novo(s)` + (report.conflicts.length ? `, ${report.conflicts.length} conflito(s)` : ''));
      await client.from(LOTES_TABLE).update({ imported_at: new Date().toISOString(), imported_by: userId }).eq('id', row.id);
    } catch (err: any) {
      notes.push(`Lote ${row.id} recusado: ${err?.message || err}`);
      // Lote inválido não trava a fila: fica marcado para análise do administrador.
      await client.from(LOTES_TABLE).update({ imported_at: new Date().toISOString(), imported_by: userId }).eq('id', row.id);
    }
  }
  return notes;
}

/** Uma rodada de verificação/envio. `force` ignora o intervalo mínimo entre envios. */
export async function runCloudSyncNow(force = false): Promise<CloudSyncStatus> {
  if (running) return status;
  running = true;
  try {
    const reachable = await isCloudReachable(3000, true);
    if (!reachable) {
      setStatus({ state: 'sem-internet', message: 'Sem internet. Os dados seguem guardados no servidor da rede local.' });
      return status;
    }
    const { data } = await getSupabaseClient().auth.getSession();
    const session = data?.session;
    if (!session) {
      setStatus({
        state: 'aguardando-login',
        message: 'Internet disponível. Para enviar pela nuvem, saia e entre novamente com uma conta cadastrada na nuvem.',
      });
      return status;
    }

    const last = readJson(LAST_PUSH_KEY);
    const localVersion = localStorage.getItem(LOCAL_VERSION_KEY) || '';
    const recent = last.at && Date.now() - new Date(last.at).getTime() < MIN_PUSH_INTERVAL_MS;
    const role = getLocalServerInfo()?.role;

    if (role === 'REMOTO') {
      if (!force && recent && last.version === localVersion) {
        setStatus({ state: 'enviado', message: 'Lote da escola já enviado.' });
        return status;
      }
      setStatus({ state: 'enviando', message: 'Enviando o lote da escola para a Sede...' });
      const note = await sendSchoolLote(force);
      const at = new Date().toISOString();
      writeJson(LAST_PUSH_KEY, { at, version: localVersion });
      setStatus({ state: 'enviado', lastPushAt: at, message: note });
      return status;
    }

    // Servidor da Sede
    setStatus({ state: 'enviando', message: 'Importando lotes das escolas e enviando à nuvem...' });
    const isAdmin = String(session.user?.app_metadata?.role || '').toUpperCase() === 'ADMIN';
    const notes = isAdmin ? await importPendingLotes(session.user.id) : [];

    if (force || !recent || last.version !== localVersion || notes.length) {
      const results = await SupabaseDatabaseService.syncAllEntitiesToSupabase();
      const failed = results.filter((r) => !r.success);
      if (failed.length) {
        setStatus({
          state: 'erro',
          message: `Envio à nuvem incompleto (${failed.length} tabela(s) com erro): ${failed
            .map((f) => f.table)
            .slice(0, 4)
            .join(', ')}. Nova tentativa automática em instantes.`,
        });
        return status;
      }
      // Depois de enviar, recebe o que foi lançado direto na nuvem (mescla sem apagar).
      const remote = await SupabasePersistenceService.fetchAppStateFromSupabase();
      if (remote) {
        saveStoredData(remote);
        window.dispatchEvent(new CustomEvent('sucessoedu_db_changed', { detail: remote }));
      }
      writeJson(LAST_PUSH_KEY, { at: new Date().toISOString(), version: localStorage.getItem(LOCAL_VERSION_KEY) || '' });
    }
    setStatus({
      state: 'enviado',
      lastPushAt: readJson(LAST_PUSH_KEY).at,
      message: notes.length
        ? `Lotes importados: ${notes.join('; ')}.`
        : isAdmin
          ? 'Base da Sede sincronizada com a nuvem.'
          : 'Base enviada. Para importar os lotes das escolas, entre com uma conta de administrador.',
    });
    return status;
  } catch (err: any) {
    setStatus({ state: 'erro', message: `Falha no envio pela nuvem: ${err?.message || err}` });
    return status;
  } finally {
    running = false;
  }
}

export function startCloudAutoSync(): void {
  if (timer || !isLocalServerMode() || typeof window === 'undefined') return;
  setStatus({ state: 'sem-internet', message: 'Verificando acesso à internet...' });
  setTimeout(() => runCloudSyncNow().catch(() => {}), 8000);
  timer = setInterval(() => runCloudSyncNow().catch(() => {}), TICK_MS);
  window.addEventListener('online', () => runCloudSyncNow().catch(() => {}));
}
