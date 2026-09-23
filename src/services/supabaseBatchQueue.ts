import { getSupabaseClient } from './supabaseClient';
import { toRemoteRow } from './datasync/supabaseRowMapper';

export interface QueuedBatchItem {
  id: string;
  data: any;
  retryCount: number;
  enqueuedAt: number;
  lastAttemptAt?: number;
  nextRetryAt: number;
  lastError?: string;
}

export interface DeadLetterBatchItem {
  id: string;
  table: string;
  data: any;
  retryCount: number;
  enqueuedAt: number;
  failedAt: number;
  error: string;
}

export interface BatchQueueConfig {
  initialDelayMs: number;
  maxDelayMs: number;
  factor: number;
  jitter: boolean;
  maxRetries: number;
  flushIntervalMs: number;
  chunkSize: number;
}

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

const PERSISTENCE_KEY = 'sucessoedu_supabase_batch_queue_v2';
const DLQ_PERSISTENCE_KEY = 'sucessoedu_supabase_batch_dlq_v2';

class SupabaseBatchQueue {
  private queue: Map<string, Map<string, QueuedBatchItem>> = new Map();
  private deadLetterQueue: DeadLetterBatchItem[] = [];
  private timer: any = null;
  private isFlushing = false;
  private consecutiveFailures = 0;
  private lastFlushTimestamp?: number;
  private lastSuccessfulSync?: number;
  private lastError?: string;
  private listeners: Set<(status: BatchQueueStatus) => void> = new Set();

  private config: BatchQueueConfig = {
    initialDelayMs: 1000,   // 1 segundo
    maxDelayMs: 60000,      // 60 segundos máx
    factor: 2.0,            // base exponencial
    jitter: true,           // Full Jitter para mitigar Thundering Herd
    maxRetries: 8,          // até 8 tentativas com backoff
    flushIntervalMs: 4000,  // ciclo de monitoramento a cada 4 segundos
    chunkSize: 100,         // blocos seguros para PostgreSQL/Supabase
  };

  constructor() {
    this.loadPersistedQueue();
    this.setupNetworkListeners();
    this.startTimer();
  }

  /**
   * Monitora reconexão e desconexão de rede
   */
  private setupNetworkListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[SupabaseBatchQueue] Conexão com a rede detectada. Resetando backoff e disparando sync...');
        this.handleNetworkRestored();
      });

      window.addEventListener('offline', () => {
        console.warn('[SupabaseBatchQueue] Modo offline ativado. As operações serão retidas em buffer local.');
        this.notifyListeners();
      });
    }
  }

  /**
   * Restabelece items para envio imediato quando a rede volta
   */
  public handleNetworkRestored() {
    const now = Date.now();
    for (const [, tableMap] of this.queue.entries()) {
      for (const [, item] of tableMap.entries()) {
        // Reduz o nextRetryAt para agora se estava aguardando
        if (item.nextRetryAt > now) {
          item.nextRetryAt = now;
        }
      }
    }
    this.consecutiveFailures = 0;
    this.notifyListeners();
    this.flush().catch((err) => console.warn('[SupabaseBatchQueue] Erro no flush pós-reconexão:', err));
  }

  private isOnline(): boolean {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      return navigator.onLine;
    }
    return true;
  }

  private startTimer() {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.flush().catch((err) => console.warn('[SupabaseBatchQueue] Erro no intervalo de batch:', err));
    }, this.config.flushIntervalMs);
  }

  /**
   * Enfileira registros para sincronização automática com deduplicação por ID
   */
  public enqueue(table: string, records: any[]) {
    if (!records || records.length === 0) return;

    if (!this.queue.has(table)) {
      this.queue.set(table, new Map());
    }

    const tableMap = this.queue.get(table)!;
    const now = Date.now();

    for (let idx = 0; idx < records.length; idx++) {
      const record = records[idx];
      const recordId = record?.id || `temp_${table}_${idx}_${now}_${Math.random().toString(36).substring(2, 7)}`;

      const existingItem = tableMap.get(recordId);
      const retryCount = existingItem ? existingItem.retryCount : 0;

      tableMap.set(recordId, {
        id: recordId,
        data: record,
        retryCount,
        enqueuedAt: existingItem ? existingItem.enqueuedAt : now,
        nextRetryAt: existingItem ? existingItem.nextRetryAt : now,
      });
    }

    this.savePersistedQueue();
    this.notifyListeners();

    // Se o volume acumulado for alto (> 50 items prontos), antecipa a execução
    if (this.getReadyItemsCount() >= 50) {
      this.flush().catch(() => {});
    }
  }

  /**
   * Cálculo de Exponential Backoff com Full Jitter:
   * t = min(maxDelay, initialDelay * (factor ^ retryCount))
   * jitter = random(initialDelay, t)
   */
  private calculateBackoffDelay(retryCount: number): number {
    const baseDelay = Math.min(
      this.config.maxDelayMs,
      this.config.initialDelayMs * Math.pow(this.config.factor, Math.min(retryCount, 10))
    );

    if (!this.config.jitter) {
      return baseDelay;
    }

    const minDelay = this.config.initialDelayMs;
    return Math.floor(Math.random() * (baseDelay - minDelay + 1)) + minDelay;
  }

  /**
   * Avalia se um erro é transitório (rede, timeout, rate limit 429, 50x)
   * para justificar nova tentativa via backoff
   */
  private isTransientError(error: any): boolean {
    if (!this.isOnline()) return true;
    if (!error) return false;

    const msg = (error.message || error.details || error.hint || String(error)).toLowerCase();
    const code = String(error.code || error.status || '');

    // 1. Falhas de conexão física, DNS ou timeout de rede
    if (
      msg.includes('failed to fetch') ||
      msg.includes('network') ||
      msg.includes('timeout') ||
      msg.includes('aborted') ||
      msg.includes('connection refused') ||
      msg.includes('offline') ||
      msg.includes('socket') ||
      msg.includes('load failed') ||
      msg.includes('econnrefused')
    ) {
      return true;
    }

    // 2. HTTP 429 (Rate Limit) e HTTP 500, 502, 503, 504 (Server Overload)
    if (code === '429' || code === '500' || code === '502' || code === '503' || code === '504') {
      return true;
    }

    // 3. PostgreSQL connection drop ou locks concorrentes transitórios
    if (code === '57P01' || code === '57P02' || code === '57P03' || code === '08006' || code === '08001') {
      return true;
    }

    // 4. Erros não transitórios de modelagem (PGRST204, coluna inexistente 42703)
    if (code === '42703' || code === '42P01' || code === '42601' || code === 'PGRST204') {
      return false;
    }

    // Por padrão em fila de background, assumir transitório para maior resiliência
    return true;
  }

  /**
   * Sanitização de schema antes de enviar para o Supabase PostgreSQL
   */
  private sanitizeForTable(table: string, records: any[]): any[] {
    if (table === 'exams') {
      return records.map((e: any, idx: number) => ({
        id: e.id || ('exam_' + idx),
        title: e.title || ('Avaliação ' + (idx + 1)),
        description: e.description || null,
        subject: e.subject || e.subjectId || 'Geral',
        class_id: e.classId || null,
        teacher_name: e.teacherName || null,
        school_year: e.schoolYear || 2026,
        term: e.term || '1º Bimestre',
        total_points: e.totalPoints || 10.0,
        passing_score: e.passingScore || 6.0,
        time_limit_minutes: e.timeLimitMinutes || 60,
        questions: e.questions || [],
        status: e.status || 'PUBLISHED',
      }));
    }

    if (table === 'students') {
      return records.map((s: any, idx: number) => ({
        id: s.id || ('std_' + idx),
        name: s.name,
        registration_number: s.enrollmentNumber || s.registrationNumber || s.registration_number || ('RA-2026-' + idx),
        status: s.status || 'ACTIVE',
        class_id: s.classId || s.class_id || null,
        birth_date: s.birthDate || s.birth_date || '2015-01-01',
        cpf: s.cpf || null,
        rg: s.rg || null,
        gender: s.gender || 'M',
        email: s.email || null,
        phone: s.phone || null,
        guardian_name: s.guardianName || s.guardian_name || 'Responsável Legal',
        guardian_phone: s.guardianPhone || s.guardian_phone || null,
        address: s.address || null,
        city: s.city || 'São Paulo',
        state: s.state || 'SP',
        location_zone: s.locationZone || s.location_zone || 'URBANA',
        cadastral_status: s.cadastralStatus || s.cadastral_status || 'COMPLETE',
        medical_observations: s.medicalObservations || s.medical_observations || null,
        has_aee: Boolean(s.hasAEE ?? s.hasAeeSupport ?? s.hasAee ?? s.has_aee ?? false),
        photo_url: s.photoUrl || s.photo_url || null,
        school_unit_id: s.schoolUnitId || s.school_unit_id || null,
      }));
    }

    if (table === 'notifications') {
      return records.map((n: any, idx: number) => ({
        id: n.id || ('notif_' + idx),
        title: n.title || 'Notificação do Sistema',
        message: n.message || '',
        type: n.type || 'INFO',
        read: Boolean(n.read),
        created_at: n.timestamp || n.createdAt || new Date().toISOString(),
      }));
    }

    return records
      .map((r) => (r && typeof r === 'object' ? toRemoteRow(table, r) : null))
      .filter((r): r is Record<string, any> => r !== null);
  }

  /**
   * Executa o flush de todos os itens da fila que já atingiram o tempo de retry
   */
  public async flush(): Promise<void> {
    if (this.isFlushing) return;
    if (this.getPendingCount() === 0) return;

    // Se estiver offline, preserva os itens sem consumir tentativas
    if (!this.isOnline()) {
      return;
    }

    // Sem login no Supabase as políticas RLS recusam a gravação: mantém os itens na
    // fila, sem consumir tentativas, até o usuário se autenticar.
    try {
      const { data: sessionData } = await getSupabaseClient().auth.getSession();
      if (!sessionData?.session) return;
    } catch {
      return;
    }

    this.isFlushing = true;
    this.lastFlushTimestamp = Date.now();
    this.notifyListeners();

    try {
      const supabase = getSupabaseClient();
      const now = Date.now();

      for (const [table, tableMap] of this.queue.entries()) {
        // Filtra apenas itens cujo backoff já expirou (prontos para envio)
        const readyItems: QueuedBatchItem[] = [];
        for (const [, item] of tableMap.entries()) {
          if (item.nextRetryAt <= now) {
            readyItems.push(item);
          }
        }

        if (readyItems.length === 0) continue;

        // Processa em lotes (chunks)
        const chunkSize = this.config.chunkSize;
        for (let i = 0; i < readyItems.length; i += chunkSize) {
          const chunkItems = readyItems.slice(i, i + chunkSize);
          const rawDataArray = chunkItems.map((ci) => ci.data);
          const sanitizedPayload = this.sanitizeForTable(table, rawDataArray);

          try {
            const { error } = await supabase.from(table).upsert(sanitizedPayload, { onConflict: 'id' });

            if (error) {
              const errorMessage = error.message || error.details || JSON.stringify(error);
              this.handleChunkFailure(table, chunkItems, errorMessage, error);
            } else {
              // Sucesso no lote: remove da fila
              this.handleChunkSuccess(table, chunkItems);
            }
          } catch (networkErr: any) {
            const errorMessage = networkErr?.message || 'Falha de conexão com Supabase';
            this.handleChunkFailure(table, chunkItems, errorMessage, networkErr);
          }
        }

        // Limpa o mapa da tabela se estiver vazio
        if (tableMap.size === 0) {
          this.queue.delete(table);
        }
      }

      this.savePersistedQueue();
    } catch (err: any) {
      console.warn('[SupabaseBatchQueue] Erro crítico no loop de flush:', err);
      this.lastError = err?.message || String(err);
      this.consecutiveFailures++;
    } finally {
      this.isFlushing = false;
      this.notifyListeners();
    }
  }

  /**
   * Trata sucesso de um lote de itens
   */
  private handleChunkSuccess(table: string, items: QueuedBatchItem[]) {
    const tableMap = this.queue.get(table);
    if (!tableMap) return;

    for (const item of items) {
      tableMap.delete(item.id);
    }

    this.consecutiveFailures = 0;
    this.lastSuccessfulSync = Date.now();
  }

  /**
   * Trata falha com cálculo de backoff exponencial e re-agendamento em background
   */
  private handleChunkFailure(table: string, items: QueuedBatchItem[], errorMessage: string, rawError: any) {
    const tableMap = this.queue.get(table);
    if (!tableMap) return;

    this.consecutiveFailures++;
    this.lastError = errorMessage;
    const isTransient = this.isTransientError(rawError);

    console.warn(
      `[SupabaseBatchQueue] Falha de sync na tabela "${table}" (${items.length} itens). Transitório: ${isTransient}. Erro: ${errorMessage}`
    );

    const now = Date.now();

    for (const item of items) {
      const nextRetryCount = item.retryCount + 1;

      // Se excedeu o número máximo de retentativas ou for erro não transitório definitivo
      if (!isTransient || nextRetryCount > this.config.maxRetries) {
        console.error(
          `[SupabaseBatchQueue] Item ${item.id} da tabela "${table}" atingiu limite de retentativas (${nextRetryCount}). Movendo para Dead-Letter Queue.`
        );

        this.deadLetterQueue.unshift({
          id: item.id,
          table,
          data: item.data,
          retryCount: nextRetryCount,
          enqueuedAt: item.enqueuedAt,
          failedAt: now,
          error: errorMessage,
        });

        // Mantém tamanho máximo de 200 itens no DLQ
        if (this.deadLetterQueue.length > 200) {
          this.deadLetterQueue.pop();
        }

        tableMap.delete(item.id);
      } else {
        // Aplica exponential backoff com jitter
        const backoffDelay = this.calculateBackoffDelay(nextRetryCount);
        item.retryCount = nextRetryCount;
        item.lastAttemptAt = now;
        item.nextRetryAt = now + backoffDelay;
        item.lastError = errorMessage;

        // Atualiza no mapa
        tableMap.set(item.id, item);
      }
    }

    this.saveDlqPersisted();
  }

  /**
   * Total de itens pendentes em todas as tabelas
   */
  public getPendingCount(): number {
    let total = 0;
    for (const [, tableMap] of this.queue.entries()) {
      total += tableMap.size;
    }
    return total;
  }

  /**
   * Total de itens cujo tempo de backoff já atingiu o momento presente
   */
  public getReadyItemsCount(): number {
    const now = Date.now();
    let total = 0;
    for (const [, tableMap] of this.queue.entries()) {
      for (const [, item] of tableMap.entries()) {
        if (item.nextRetryAt <= now) {
          total++;
        }
      }
    }
    return total;
  }

  /**
   * Snapshot de telemetria e estado para UIs e monitoramento
   */
  public getStatus(): BatchQueueStatus {
    const tableBreakdown: Record<string, number> = {};
    for (const [table, tableMap] of this.queue.entries()) {
      tableBreakdown[table] = tableMap.size;
    }

    return {
      isOnline: this.isOnline(),
      isFlushing: this.isFlushing,
      totalPendingCount: this.getPendingCount(),
      tableBreakdown,
      deadLetterCount: this.deadLetterQueue.length,
      lastFlushTimestamp: this.lastFlushTimestamp,
      lastSuccessfulSync: this.lastSuccessfulSync,
      lastError: this.lastError,
      consecutiveFailures: this.consecutiveFailures,
    };
  }

  /**
   * Retorna os itens arquivados na Dead-Letter Queue
   */
  public getDeadLetterItems(): DeadLetterBatchItem[] {
    return [...this.deadLetterQueue];
  }

  /**
   * Tenta reprocessar todos os itens da Dead-Letter Queue
   */
  public retryDeadLetterItems() {
    const items = [...this.deadLetterQueue];
    this.deadLetterQueue = [];
    this.saveDlqPersisted();

    for (const item of items) {
      this.enqueue(item.table, [item.data]);
    }
  }

  /**
   * Limpa a fila e a DLQ
   */
  public clearQueue() {
    this.queue.clear();
    this.deadLetterQueue = [];
    this.savePersistedQueue();
    this.saveDlqPersisted();
    this.notifyListeners();
  }

  /**
   * Inscrição para atualizações de status
   */
  public subscribe(listener: (status: BatchQueueStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const status = this.getStatus();
    this.listeners.forEach((listener) => {
      try {
        listener(status);
      } catch (_) {}
    });
  }

  /**
   * Persistência em localStorage para sobrevivência a recarregamentos de página
   */
  private savePersistedQueue() {
    if (typeof localStorage === 'undefined') return;
    try {
      const serializable: Record<string, QueuedBatchItem[]> = {};
      for (const [table, map] of this.queue.entries()) {
        serializable[table] = Array.from(map.values()).slice(0, 500);
      }
      localStorage.setItem(PERSISTENCE_KEY, JSON.stringify(serializable));
    } catch (_) {}
  }

  private loadPersistedQueue() {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(PERSISTENCE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        for (const [table, items] of Object.entries<QueuedBatchItem[]>(parsed)) {
          if (!this.queue.has(table)) {
            this.queue.set(table, new Map());
          }
          const tableMap = this.queue.get(table)!;
          const now = Date.now();
          for (const item of items) {
            tableMap.set(item.id, {
              ...item,
              // Agenda para re-tentar logo após boot
              nextRetryAt: Math.min(item.nextRetryAt || now, now + 2000),
            });
          }
        }
      }

      const dlqRaw = localStorage.getItem(DLQ_PERSISTENCE_KEY);
      if (dlqRaw) {
        this.deadLetterQueue = JSON.parse(dlqRaw);
      }
    } catch (_) {}
  }

  private saveDlqPersisted() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(DLQ_PERSISTENCE_KEY, JSON.stringify(this.deadLetterQueue.slice(0, 200)));
    } catch (_) {}
  }
}

export const supabaseBatchQueue = new SupabaseBatchQueue();
