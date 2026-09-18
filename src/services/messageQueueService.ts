/**
 * SucessoEdu Gestão Educacional - Motor de Mensageria e Fila Assíncrona
 * Integração Supabase / Local para processamento desacoplado de triggers:
 * - trg_attendance_alert: Falta registrada -> WhatsApp para pais/responsáveis
 * - trg_grade_published: Nota bimestral homologada -> WhatsApp com boletim
 */

export interface MessageQueueRecord {
  id: string;
  recipient_phone: string;
  recipient_name?: string;
  student_id?: string;
  student_name?: string;
  message_payload: {
    event: 'ATTENDANCE_ALERT' | 'GRADE_PUBLISHED' | 'SYSTEM_COMMUNICATION';
    title: string;
    body: string;
    details: Record<string, any>;
  };
  status: 'PENDING' | 'SENT' | 'FAILED';
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  retry_count: number;
  error_message?: string;
  created_at: string;
  processed_at?: string;
}

const STORAGE_QUEUE_KEY = 'sucessoedu_message_queue';

export function getLocalMessageQueue(): MessageQueueRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalMessageQueue(queue: MessageQueueRecord[]): void {
  try {
    localStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(queue.slice(0, 100)));
  } catch (err) {
    console.error('Erro ao salvar fila de mensagens:', err);
  }
}

/**
 * Enfileira uma mensagem com prioridade
 */
export function enqueueMessage(
  payload: Omit<MessageQueueRecord, 'id' | 'created_at' | 'retry_count' | 'status'>
): MessageQueueRecord {
  const current = getLocalMessageQueue();
  const newItem: MessageQueueRecord = {
    ...payload,
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    status: 'PENDING',
    retry_count: 0,
    created_at: new Date().toISOString(),
  };

  const updated = [newItem, ...current];
  saveLocalMessageQueue(updated);
  return newItem;
}

/**
 * Trigger: trg_attendance_alert
 * Disparado ao salvar falta escolar
 */
export function triggerAttendanceAlert(params: {
  studentId: string;
  studentName: string;
  guardianName?: string;
  guardianPhone?: string;
  className: string;
  subjectName: string;
  date: string;
  lessonNumber: number;
}): MessageQueueRecord {
  const formattedDate = new Date(params.date + 'T00:00:00').toLocaleDateString('pt-BR');
  const phone = params.guardianPhone || '+55 (11) 98765-4321';
  const guardian = params.guardianName || 'Responsável';

  const body = `Olá, ${guardian}. Informamos que o(a) estudante ${params.studentName} registrou ausência na aula de ${params.subjectName} (${params.className}) realizada em ${formattedDate} (Aula ${params.lessonNumber}). Caso tenha justificativa ou atestado, favor encaminhar à secretaria escolar.`;

  return enqueueMessage({
    recipient_phone: phone,
    recipient_name: guardian,
    student_id: params.studentId,
    student_name: params.studentName,
    priority: 'HIGH',
    message_payload: {
      event: 'ATTENDANCE_ALERT',
      title: `Aviso de Falta Escolar - ${params.studentName}`,
      body,
      details: {
        date: params.date,
        lessonNumber: params.lessonNumber,
        subject: params.subjectName,
        class: params.className,
      },
    },
  });
}

/**
 * Trigger: trg_grade_published
 * Disparado ao homologar pauta de notas bimestrais
 */
export function triggerGradePublished(params: {
  studentId: string;
  studentName: string;
  guardianName?: string;
  guardianPhone?: string;
  className: string;
  subjectName: string;
  term: string;
  average: number;
  passingScore: number;
  status: string;
}): MessageQueueRecord {
  const phone = params.guardianPhone || '+55 (11) 98765-4321';
  const guardian = params.guardianName || 'Responsável';
  const situation = params.status === 'APROVADO' ? 'Satisfatório / Aprovado' : params.status === 'RECUPERACAO' ? 'Em Recuperação' : 'Abaixo da Média';

  const body = `Prezado(a) ${guardian}, a pauta do ${params.term} foi homologada. Nota de ${params.studentName} em ${params.subjectName}: Média ${params.average.toFixed(1)} (Média mínima para aprovação: ${params.passingScore.toFixed(1)}). Situação: ${situation}. Acesse o portal do aluno para consultar o boletim completo.`;

  return enqueueMessage({
    recipient_phone: phone,
    recipient_name: guardian,
    student_id: params.studentId,
    student_name: params.studentName,
    priority: 'NORMAL',
    message_payload: {
      event: 'GRADE_PUBLISHED',
      title: `Boletim Homologado - ${params.term} (${params.subjectName})`,
      body,
      details: {
        term: params.term,
        subject: params.subjectName,
        average: params.average,
        passingScore: params.passingScore,
        status: params.status,
      },
    },
  });
}

/**
 * Processamento assíncrono da fila (Edge Function / Background Worker)
 */
export async function processMessageQueue(): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  const queue = getLocalMessageQueue();
  const pendingItems = queue.filter((item) => item.status === 'PENDING');

  if (pendingItems.length === 0) {
    return { processed: 0, sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  const updatedQueue = queue.map((item) => {
    if (item.status === 'PENDING') {
      try {
        // Simulação da Edge Function / Gateway oficial disparando WhatsApp / Notificação
        sent++;
        return {
          ...item,
          status: 'SENT' as const,
          processed_at: new Date().toISOString(),
        };
      } catch (err: any) {
        if (item.retry_count < 3) {
          return {
            ...item,
            retry_count: item.retry_count + 1,
            error_message: err?.message || 'Falha transitória na rede',
          };
        } else {
          failed++;
          return {
            ...item,
            status: 'FAILED' as const,
            error_message: err?.message || 'Excedido limite de 3 tentativas',
            processed_at: new Date().toISOString(),
          };
        }
      }
    }
    return item;
  });

  saveLocalMessageQueue(updatedQueue);
  notifyQueueSubscribers(updatedQueue);
  return { processed: pendingItems.length, sent, failed };
}

// -------------------------------------------------------------
// WORKER EM SEGUNDO PLANO (BACKGROUND WORKER LOOP)
// -------------------------------------------------------------
let workerTimerId: any = null;
const queueSubscribers = new Set<(queue: MessageQueueRecord[]) => void>();

export function subscribeToMessageQueue(callback: (queue: MessageQueueRecord[]) => void): () => void {
  queueSubscribers.add(callback);
  callback(getLocalMessageQueue());
  return () => {
    queueSubscribers.delete(callback);
  };
}

function notifyQueueSubscribers(queue: MessageQueueRecord[]): void {
  queueSubscribers.forEach((cb) => {
    try {
      cb(queue);
    } catch (e) {
      console.warn('Erro em subscriber da fila de mensagens:', e);
    }
  });
}

/**
 * Inicia o worker assíncrono em segundo plano para processamento contínuo
 */
export function startMessageQueueWorker(intervalMs = 12000): void {
  if (workerTimerId) return; // Já em execução

  // Execução inicial imediata
  processMessageQueue().catch(() => {});

  workerTimerId = setInterval(() => {
    processMessageQueue().catch((err) => {
      console.warn('[MessageQueueWorker] Erro de processamento:', err);
    });
  }, intervalMs);
}

/**
 * Encerra o worker de segundo plano
 */
export function stopMessageQueueWorker(): void {
  if (workerTimerId) {
    clearInterval(workerTimerId);
    workerTimerId = null;
  }
}

/**
 * Verifica se o worker está ativo
 */
export function isMessageQueueWorkerRunning(): boolean {
  return workerTimerId !== null;
}
