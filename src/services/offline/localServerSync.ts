/**
 * Conexão das estações com o banco central da rede local.
 *
 * Quando o sistema é aberto a partir do Servidor Remoto (escola) ou do Servidor
 * da Sede (ex.: http://192.168.0.10:8088), todas as estações leem e gravam no
 * MESMO banco, guardado no servidor em C:\SucessoEdu\data. Não depende de
 * internet.
 *
 * Fluxo:
 *  - ao abrir: busca o banco do servidor antes de desenhar a tela;
 *  - a cada gravação: calcula o que mudou (storeOps) e envia ao servidor, que
 *    só aceita a gravação se ninguém tiver gravado antes (versão); se outra
 *    estação gravou, as mudanças são reaplicadas sobre a versão nova;
 *  - a cada poucos segundos: verifica se outra estação gravou e atualiza a tela;
 *  - sem conexão com o servidor: as mudanças ficam guardadas nesta estação e
 *    são enviadas assim que o servidor voltar.
 */

import { applyOps, compactOps, diffStates, StoreOp } from './storeOps';
import { promptDialog, notify } from '../../utils/dialogs';

export type LocalServerRole = 'REMOTO' | 'SEDE';

export interface LocalServerInfo {
  role: LocalServerRole;
  serverName: string;
  version: number;
  /** Versão do sistema que esta página carregou (data da compilação). */
  appBuiltAt?: string;
  /** Servidor Remoto: escola atendida (definida ao gerar o pacote). */
  schoolUnitId?: string;
  schoolInep?: string;
  schoolName?: string;
}

export interface LocalServerStatus {
  mode: 'desativado' | 'conectado' | 'sem-conexao' | 'sincronizando';
  role?: LocalServerRole;
  serverName?: string;
  pending: number;
  lastSyncAt?: string;
  message?: string;
  /** O servidor recebeu uma versão nova do sistema depois que esta página abriu. */
  newAppVersion?: boolean;
}

interface QueuedOp {
  seq: number;
  op: StoreOp;
}

export const LOCAL_OPS_KEY = 'sucessoedu_local_ops_v1';
export const LOCAL_VERSION_KEY = 'sucessoedu_local_version_v1';
export const LOCAL_KEY_STORAGE = 'sucessoedu_local_key';
const API = '/api/local';
const POLL_MS = 4000;

let info: LocalServerInfo | null = null;
let dataKey = 'sucessoedu_master_store_v5';
let status: LocalServerStatus = { mode: 'desativado', pending: 0 };
const listeners = new Set<(s: LocalServerStatus) => void>();
const debug = (...args: any[]) => {
  try {
    if (localStorage.getItem('sucessoedu_debug_sync') === '1') console.log('[sync]', ...args);
  } catch {
    /* sem armazenamento */
  }
};
let flushing: Promise<void> | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
/** Muda a cada gravação/adoção: uma leitura iniciada antes disso é descartada. */
let syncEpoch = 0;
/**
 * Falhas seguidas ao falar com o servidor da rede local. Com o banco grande, o servidor pode
 * demorar alguns segundos numa gravação e uma consulta isolada estoura o tempo: isso não é
 * "sem conexão". O aviso só aparece depois de algumas falhas seguidas.
 */
let failStreak = 0;
const FAILS_BEFORE_OFFLINE = 3;
const OFFLINE_MSG =
  'O servidor desta rede (programa SucessoEdu no computador da Sede) não está respondendo. As alterações ficam guardadas nesta estação e são enviadas quando ele voltar. Isso não tem relação com a internet.';
function markFailure() {
  failStreak++;
  if (failStreak >= FAILS_BEFORE_OFFLINE) {
    setStatus({ mode: 'sem-conexao', message: OFFLINE_MSG });
  } else if (status.mode !== 'sem-conexao') {
    setStatus({ message: 'Servidor ocupado; tentando de novo em instantes.' });
  }
}

// ---------------------------------------------------------------------------
// Estado e avisos
// ---------------------------------------------------------------------------

export function getLocalServerInfo(): LocalServerInfo | null {
  return info;
}

export function isLocalServerMode(): boolean {
  return info !== null;
}

export function getLocalServerStatus(): LocalServerStatus {
  return status;
}

export function subscribeLocalServerStatus(fn: (s: LocalServerStatus) => void): () => void {
  listeners.add(fn);
  fn(status);
  return () => listeners.delete(fn);
}

function setStatus(patch: Partial<LocalServerStatus>) {
  status = { ...status, ...patch, pending: readQueue().length };
  listeners.forEach((fn) => {
    try {
      fn(status);
    } catch {
      /* ouvinte com erro não interrompe os demais */
    }
  });
}

// ---------------------------------------------------------------------------
// Fila de mudanças desta estação
// ---------------------------------------------------------------------------

function readQueue(): QueuedOp[] {
  try {
    const raw = localStorage.getItem(LOCAL_OPS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((q) => q && typeof q.seq === 'number' && q.op) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedOp[]): boolean {
  try {
    localStorage.setItem(LOCAL_OPS_KEY, JSON.stringify(queue));
    return true;
  } catch (err) {
    console.warn('[SucessoEdu] Não foi possível guardar as mudanças pendentes desta estação:', err);
    storageFull = true;
    return false;
  }
}

let storageFull = false;
const STORAGE_FULL_MSG =
  'ATENÇÃO: o armazenamento deste navegador está cheio e a última alteração pode não ter sido guardada. ' +
  'Clique em "Sincronizar agora" e, se o aviso continuar, use outro computador ou reduza as fotos dos cadastros.';

function appendOps(ops: StoreOp[]) {
  if (!ops.length) return;
  const queue = readQueue();
  let seq = queue.reduce((max, q) => Math.max(max, q.seq), 0);
  const all: QueuedOp[] = [...queue, ...ops.map((op) => ({ seq: ++seq, op }))];
  // Compacta mantendo o número original de cada operação que sobrevive: o envio em
  // andamento remove da fila exatamente o que enviou, nem mais nem menos.
  const survivors = new Set(compactOps(all.map((q) => q.op)));
  if (!writeQueue(all.filter((q) => survivors.has(q.op)))) {
    setStatus({ message: STORAGE_FULL_MSG });
  }
}

function readLocalData(): Record<string, any> | null {
  try {
    const raw = localStorage.getItem(dataKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function lastVersion(): number {
  const v = Number(localStorage.getItem(LOCAL_VERSION_KEY));
  return Number.isFinite(v) ? v : -1;
}

function setLastVersion(v: number) {
  try {
    localStorage.setItem(LOCAL_VERSION_KEY, String(v));
  } catch {
    /* sem espaço: a próxima verificação refaz a leitura */
  }
}

// ---------------------------------------------------------------------------
// Comunicação com o servidor
// ---------------------------------------------------------------------------

function readAccessKey(): string {
  try {
    return (localStorage.getItem(LOCAL_KEY_STORAGE) || '').trim().toUpperCase();
  } catch {
    return '';
  }
}

/** A chave pode vir no atalho da estação (?chave=XXXX-XXXX): guarda e tira do endereço. */
function captureAccessKeyFromUrl() {
  try {
    const url = new URL(window.location.href);
    const key = url.searchParams.get('chave');
    if (key) {
      localStorage.setItem(LOCAL_KEY_STORAGE, key.trim().toUpperCase());
      url.searchParams.delete('chave');
      window.history.replaceState(null, '', url.pathname + (url.search ? url.search : '') + url.hash);
    }
  } catch {
    /* endereço sem chave */
  }
}

/** Pede a chave da escola até ela ser aceita pelo servidor. */
async function ensureAccessKey(): Promise<{ status: number; body: any }> {
  let res = await call('/store', {}, 30000);
  let tries = 0;
  while (res.status === 401) {
    const typed = await promptDialog(
      tries === 0
        ? 'Digite a chave de acesso do servidor da escola. Ela aparece no final da instalação do servidor e no arquivo LEIA-ME.txt (ex.: K7P4-QX9M).'
        : 'Chave incorreta. Confira a chave no LEIA-ME.txt do servidor e digite novamente.',
      '',
      'Chave de acesso da escola'
    );
    if (typed === null) {
      // Cancelar/Fechar: para de pedir e abre com os dados desta estação (recarregar a página pede de novo).
      await notify('Sem a chave de acesso, este computador usa só os dados guardados nele. Para ligar ao servidor da escola, recarregue a página e digite a chave (LEIA-ME.txt do servidor).', 'Chave de acesso');
      setStatus({ mode: 'sem-conexao', message: 'Chave de acesso não informada: usando os dados desta estação. Recarregue a página para digitar a chave.' });
      return res as any;
    }
    try {
      localStorage.setItem(LOCAL_KEY_STORAGE, typed.trim().toUpperCase());
    } catch {
      /* sem armazenamento */
    }
    tries++;
    res = await call('/store', {}, 30000);
  }
  return res as any;
}

async function call<T = any>(path: string, init: RequestInit = {}, timeoutMs = 8000): Promise<{ status: number; body: T | null }> {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = setTimeout(() => controller?.abort(), timeoutMs);
  try {
    const res = await fetch(`${API}${path}`, {
      ...init,
      cache: 'no-store',
      signal: controller?.signal,
      headers: { 'Content-Type': 'application/json', 'X-Chave': readAccessKey(), ...(init.headers || {}) },
    });
    let body: any = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    return { status: res.status, body };
  } finally {
    clearTimeout(timer);
  }
}

/** Verifica se esta página foi aberta a partir de um servidor SucessoEdu da rede local. */
export async function detectLocalServer(timeoutMs = 1500): Promise<LocalServerInfo | null> {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') return null;
  if (!/^https?:$/.test(window.location.protocol)) return null;
  try {
    const { status: code, body } = await call('/health', {}, timeoutMs);
    if (code !== 200 || !body || body.app !== 'sucessoedu-local') return null;
    const role: LocalServerRole = body.role === 'SEDE' ? 'SEDE' : 'REMOTO';
    return {
      role,
      serverName: String(body.serverName || (role === 'SEDE' ? 'Servidor da Sede' : 'Servidor Remoto')),
      version: Number(body.version) || 0,
      appBuiltAt: typeof body.appBuiltAt === 'string' ? body.appBuiltAt : '',
      schoolUnitId: typeof body.schoolUnitId === 'string' && body.schoolUnitId ? body.schoolUnitId : undefined,
      schoolInep: typeof body.schoolInep === 'string' && body.schoolInep ? body.schoolInep : undefined,
      schoolName: typeof body.schoolName === 'string' && body.schoolName ? body.schoolName : undefined,
    };
  } catch {
    return null;
  }
}

function adoptServerData(serverData: Record<string, any>, version: number) {
  const remaining = readQueue().map((q) => q.op);
  const local = readLocalData() || {};
  // Chaves que o servidor ainda não tem continuam com o valor desta estação.
  const next = applyOps({ ...local, ...serverData }, remaining);
  const nextJson = JSON.stringify(next);
  syncEpoch++;
  if (nextJson !== JSON.stringify(local)) {
    try {
      localStorage.setItem(dataKey, nextJson);
    } catch (err) {
      // Não registra a versão: na próxima verificação a leitura é refeita.
      console.warn('[SucessoEdu] Não foi possível gravar os dados recebidos do servidor nesta estação:', err);
      storageFull = true;
      setStatus({ message: STORAGE_FULL_MSG });
      window.dispatchEvent(new CustomEvent('sucessoedu_db_changed', { detail: next }));
      return;
    }
    window.dispatchEvent(new CustomEvent('sucessoedu_db_changed', { detail: next }));
  }
  setLastVersion(version);
}

/**
 * Executado antes de desenhar a tela. Retorna true se a página veio de um
 * servidor da rede local (e, nesse caso, os dados do servidor já estão aplicados).
 */
export async function bootstrapLocalServer(options: { dataKey: string; markInitialized: () => void }): Promise<boolean> {
  dataKey = options.dataKey;
  captureAccessKeyFromUrl();
  const found = await detectLocalServer();
  if (!found) return false;
  info = found;
  options.markInitialized();
  setStatus({ mode: 'conectado', role: found.role, serverName: found.serverName, message: undefined });

  try {
    const { status: code, body } = await ensureAccessKey();
    if (code === 200 && body) {
      if (body.data && typeof body.data === 'object') {
        const remaining = readQueue().map((q) => q.op);
        const local = readLocalData() || {};
        const next = applyOps({ ...local, ...body.data }, remaining);
        localStorage.setItem(dataKey, JSON.stringify(next));
        setLastVersion(Number(body.version) || 0);
        if (remaining.length) scheduleFlush(50);
      } else {
        // Primeiro acesso ao servidor (banco vazio): a base desta estação vira a base da escola.
        const local = readLocalData();
        if (local) {
          const put = await putStore(Number(body.version) || 0, local);
          if (put.status === 200 && put.body) setLastVersion(Number(put.body.version) || 0);
        }
      }
      setStatus({ mode: 'conectado', lastSyncAt: new Date().toISOString() });
    }
  } catch {
    setStatus({ mode: 'sem-conexao', message: 'Servidor não respondeu ao abrir o sistema. Usando os dados desta estação.' });
  }
  startPolling();
  return true;
}

/** Grava o banco inteiro no servidor, desde que ninguém tenha gravado depois de `baseVersion`. */
function putStore(baseVersion: number, data: Record<string, any>) {
  return call(
    '/store',
    {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { 'X-Base-Version': String(baseVersion), 'X-Station': stationName() },
    },
    60000
  );
}

function stationName(): string {
  try {
    let name = localStorage.getItem('sucessoedu_station_id');
    if (!name) {
      name = `estacao-${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem('sucessoedu_station_id', name);
    }
    return name;
  } catch {
    return 'estacao';
  }
}

// ---------------------------------------------------------------------------
// Gravação
// ---------------------------------------------------------------------------

/** Chamado por saveStoredData a cada gravação feita nas telas. */
export function enqueueLocalChanges(prev: Record<string, any> | null, next: Record<string, any>): void {
  if (!info) return;
  const { ops, skippedMass } = diffStates(prev, next);
  if (skippedMass.length) {
    console.warn('[SucessoEdu] Remoção em massa não enviada ao servidor da rede local:', skippedMass.join(', '));
    setStatus({
      message:
        'Uma remoção de muitos registros de uma vez não foi enviada ao servidor (proteção contra apagamento acidental). ' +
        'Os registros voltarão na próxima sincronização. Para apagar em massa, restaure um backup no servidor.',
    });
  }
  if (!ops.length) return;
  appendOps(ops);
  setStatus({});
  scheduleFlush();
}

/** Envia operações prontas (ex.: registro de exclusões para o lote da Sede). */
export function enqueueRawOps(ops: StoreOp[]): void {
  if (!info || !ops.length) return;
  appendOps(ops);
  setStatus({});
  scheduleFlush();
}

/** Lê o banco atual direto do servidor (usado para gerar o lote com os dados de todas as estações). */
export async function fetchServerStore(): Promise<{ version: number; data: Record<string, any> | null } | null> {
  if (!info) return null;
  try {
    const res = await call('/store', {}, 20000);
    if (res.status !== 200 || !res.body) return null;
    return { version: Number(res.body.version) || 0, data: res.body.data || null };
  } catch {
    return null;
  }
}

/** Substitui o banco do servidor pelo estado informado (restaurar backup, limpar base). */
export function enqueueFullReplace(next: Record<string, any>): void {
  if (!info) return;
  const ops: StoreOp[] = Object.keys(next).map((k) => ({ k, t: 's', v: next[k] }));
  appendOps(ops);
  setStatus({});
  scheduleFlush(50);
}

function scheduleFlush(delay = 400) {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushLocalChanges().catch(() => {});
  }, delay);
}

/** Envia ao servidor as mudanças pendentes desta estação. */
export function flushLocalChanges(): Promise<void> {
  if (!info) return Promise.resolve();
  debug('flush pedido; em andamento?', !!flushing, 'fila', readQueue().length);
  if (flushing) return flushing;
  const run = async () => {
    try {
      for (let attempt = 0; attempt < 5; attempt++) {
        const queue = readQueue();
        if (!queue.length) return;
        setStatus({ mode: 'sincronizando' });
        debug('flush tentativa', attempt);
        const current = await call('/store', {}, 30000);
        debug('flush GET', current.status);
        if (current.status !== 200 || !current.body) throw new Error(`HTTP ${current.status}`);
        const merged = applyOps(current.body.data || readLocalData() || {}, queue.map((q) => q.op));
        const put = await putStore(Number(current.body.version) || 0, merged);
        debug('flush PUT', put.status);
        if (put.status === 409) continue; // outra estação gravou no meio: refaz sobre a versão nova
        if (put.status !== 200 || !put.body) throw new Error(`HTTP ${put.status}`);

        const sent = new Set(queue.map((q) => q.seq));
        writeQueue(readQueue().filter((q) => !sent.has(q.seq)));
        adoptServerData(merged, Number(put.body.version) || 0);
        failStreak = 0;
        setStatus({ mode: 'conectado', lastSyncAt: new Date().toISOString(), message: undefined });
        if (!readQueue().length) return;
      }
      setStatus({ mode: 'conectado', message: 'Servidor ocupado; nova tentativa em instantes.' });
    } catch (err) {
      debug('flush erro', err);
      markFailure();
    }
  };
  // O "finally" é ligado DEPOIS da atribuição: se a fila estiver vazia a função termina
  // na hora, e limpar `flushing` por dentro deixaria a promessa antiga presa para sempre.
  const current = run().finally(() => {
    debug('flush fim');
    if (flushing === current) flushing = null;
  });
  flushing = current;
  return current;
}

// ---------------------------------------------------------------------------
// Atualização a partir das outras estações
// ---------------------------------------------------------------------------

export async function pullFromLocalServer(): Promise<void> {
  if (!info) return;
  debug('pull');
  try {
    if (readQueue().length) {
      await flushLocalChanges();
      return;
    }
    const epoch = syncEpoch;
    const v = await call('/version', {}, 10000);
    if (v.status !== 200 || !v.body) throw new Error(`HTTP ${v.status}`);
    const serverVersion = Number(v.body.version) || 0;
    const serverApp = typeof v.body.appBuiltAt === 'string' ? v.body.appBuiltAt : '';
    if (info && serverApp && info.appBuiltAt && serverApp !== info.appBuiltAt && !status.newAppVersion) {
      setStatus({ newAppVersion: true });
    }
    if (serverVersion !== lastVersion()) {
      const s = await call('/store', {}, 30000);
      // Descarta a leitura se esta estação gravou/recebeu algo enquanto ela acontecia.
      if (s.status === 200 && s.body?.data && !readQueue().length && epoch === syncEpoch) {
        adoptServerData(s.body.data, Number(s.body.version) || 0);
      }
    }
    failStreak = 0;
    if (status.mode !== 'conectado' || (status.message && !storageFull)) setStatus({ mode: 'conectado', message: storageFull ? STORAGE_FULL_MSG : undefined, lastSyncAt: new Date().toISOString() });
  } catch {
    markFailure();
  }
}

function startPolling() {
  if (pollTimer) return;
  pollTimer = setInterval(() => {
    if (typeof document !== 'undefined' && document.hidden) return;
    pullFromLocalServer().catch(() => {});
  }, POLL_MS);
  window.addEventListener('focus', () => pullFromLocalServer().catch(() => {}));
}

/** Somente para testes. */
export function __resetLocalServerForTests() {
  info = null;
  failStreak = 0;
  status = { mode: 'desativado', pending: 0 };
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = null;
  flushing = null;
}

export function __setLocalServerInfoForTests(value: LocalServerInfo | null) {
  info = value;
}


// ---------------------------------------------------------------------------
// Atualização do sistema no servidor (só o administrador aplica)
// ---------------------------------------------------------------------------

export interface ServerUpdateInfo {
  current: string;
  ready: string;
  previous: string;
  hasPrevious: boolean;
  updateUrl: string;
  status: null | {
    state?: 'sem-endereco' | 'sem-internet' | 'atualizado' | 'baixando' | 'pronta' | 'erro' | 'aplicada' | 'revertida';
    message?: string;
    checkedAt?: string;
    available?: string;
    scriptsChanged?: string[];
  };
}

export async function getServerUpdateInfo(): Promise<ServerUpdateInfo | null> {
  if (!info) return null;
  const r = await call<ServerUpdateInfo>('/update', {}, 8000);
  return r.status === 200 ? r.body : null;
}

async function postUpdate(path: string, body?: any): Promise<{ ok: boolean; message: string }> {
  const r = await call<any>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }, 60000);
  if (r.status === 202) return { ok: true, message: 'Verificação iniciada.' };
  return { ok: r.status === 200 && r.body?.ok !== false, message: r.body?.message || `HTTP ${r.status}` };
}

export const checkServerUpdate = () => postUpdate('/update/check');
export const applyServerUpdate = () => postUpdate('/update/apply');
export const rollbackServerUpdate = () => postUpdate('/update/rollback');
export const setServerUpdateUrl = (updateUrl: string) => postUpdate('/update/config', { updateUrl });
