/**
 * Fila antiga de envio à nuvem — agora só uma ponte para o motor de sincronização v2
 * (services/sync/cloudSync).
 *
 * A fila antiga recebia as listas INTEIRAS (2.011 alunos) a cada alteração, guardava no
 * navegador e reenviava sozinha a cada 4 segundos: era um dos caminhos que gravavam a
 * mesma coisa ao mesmo tempo na nuvem. Os métodos continuam existindo para as telas que
 * os chamam, mas quem envia e recebe é o motor, só com o que mudou.
 */
import { toIsoDateOrNull } from '../utils/isoDate';

export { toIsoDateOrNull };

export interface BatchQueueStatus {
  isOnline: boolean;
  isFlushing: boolean;
  totalPendingCount: number;
  tableBreakdown: Record<string, number>;
  deadLetterCount: number;
  lastFlushTimestamp?: number;
  lastSuccessfulSync?: number;
  lastError?: string;
  consecutiveFailures: number;
}

// Fila guardada pela versão antiga: descartada (o motor compara registro a registro).
try {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('sucessoedu_supabase_batch_queue_v2');
    localStorage.removeItem('sucessoedu_supabase_batch_dlq_v2');
  }
} catch {
  /* sem armazenamento */
}

const engine = () => import('./sync/cloudSync');

function toQueueStatus(s: any): BatchQueueStatus {
  return {
    isOnline: typeof navigator === 'undefined' ? true : navigator.onLine !== false,
    isFlushing: s?.state === 'sincronizando',
    totalPendingCount: Number(s?.pending) || 0,
    tableBreakdown: {},
    deadLetterCount: Number(s?.rejected) || 0,
    lastSuccessfulSync: s?.lastSyncAt ? Date.parse(s.lastSyncAt) : undefined,
    lastError: s?.state === 'erro' ? s?.message : undefined,
    consecutiveFailures: s?.state === 'erro' ? 1 : 0,
  };
}

let lastStatus: BatchQueueStatus = toQueueStatus(null);

export const supabaseBatchQueue = {
  /** Sem efeito: o motor detecta sozinho o que mudou. */
  enqueue(_table: string, _records: any[]): void {},
  /** Envia e recebe agora (usado antes de atualizar o sistema ou sair). */
  async flush(): Promise<void> {
    const m = await engine();
    await m.syncNow();
  },
  handleNetworkRestored(): void {
    engine().then((m) => m.schedule(300)).catch(() => {});
  },
  getStatus(): BatchQueueStatus {
    return lastStatus;
  },
  subscribe(listener: (status: BatchQueueStatus) => void): () => void {
    let off: (() => void) | null = null;
    let cancelled = false;
    listener(lastStatus);
    engine()
      .then((m) => {
        if (cancelled) return;
        off = m.subscribeCloudSync((s) => {
          lastStatus = toQueueStatus(s);
          listener(lastStatus);
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      off?.();
    };
  },
};
