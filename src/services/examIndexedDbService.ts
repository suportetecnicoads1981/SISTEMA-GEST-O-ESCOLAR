/**
 * SucessoEdu Gestão Educacional - Motor de Armazenamento Local Resiliente para Provas
 * IndexedDB Nativo com Fallback em LocalStorage e Reconciliação Last-Write-Wins (LWW)
 */

export interface ExamDraftAnswer {
  questionId: string;
  selectedOptionId?: string;
  essayText?: string;
  timeSpentSeconds?: number;
}

export interface ExamDraftRecord {
  examId: string;
  studentId: string;
  studentName: string;
  answers: Record<string, { selectedOptionId?: string; essayText?: string }>;
  timeLeftSeconds: number;
  currentQuestionIndex: number;
  lastSavedAt: string;
  timestamp: number; // Unix epoch ms for Last-Write-Wins
  isSyncedWithServer: boolean;
}

const DB_NAME = 'SucessoEdu_ExamDB';
const DB_VERSION = 1;
const STORE_NAME = 'exam_drafts';
const LS_FALLBACK_PREFIX = 'sucessoedu_exam_draft_';

function openIndexedDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB não suportado neste navegador.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'compositeKey' });
        store.createIndex('examId', 'examId', { unique: false });
        store.createIndex('studentId', 'studentId', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getCompositeKey(examId: string, studentId: string): string {
  return `${examId}__${studentId}`;
}

/**
 * Salva o rascunho da prova com auto-save resiliente no IndexedDB e fallback no LocalStorage
 */
export async function saveExamDraft(draft: Omit<ExamDraftRecord, 'timestamp'>): Promise<ExamDraftRecord> {
  const record: ExamDraftRecord = {
    ...draft,
    timestamp: Date.now(),
    lastSavedAt: new Date().toISOString(),
  };

  const key = getCompositeKey(record.examId, record.studentId);

  // 1. Grava no LocalStorage como fallback imediato
  try {
    localStorage.setItem(`${LS_FALLBACK_PREFIX}${key}`, JSON.stringify(record));
  } catch (err) {
    console.warn('[ExamAutoSave] LocalStorage quota atingida ou restrito:', err);
  }

  // 2. Grava no IndexedDB de alta capacidade
  try {
    const db = await openIndexedDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const putReq = store.put({ ...record, compositeKey: key });
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    });
  } catch (idbErr) {
    console.warn('[ExamAutoSave] Falha ao persistir no IndexedDB, mantido em fallback:', idbErr);
  }

  return record;
}

/**
 * Recupera o rascunho com estratégia Last-Write-Wins (LWW) entre IndexedDB e LocalStorage
 */
export async function getExamDraft(examId: string, studentId: string): Promise<ExamDraftRecord | null> {
  const key = getCompositeKey(examId, studentId);
  let idbDraft: ExamDraftRecord | null = null;
  let lsDraft: ExamDraftRecord | null = null;

  // 1. Tentar ler do LocalStorage
  try {
    const raw = localStorage.getItem(`${LS_FALLBACK_PREFIX}${key}`);
    if (raw) {
      lsDraft = JSON.parse(raw);
    }
  } catch {}

  // 2. Tentar ler do IndexedDB
  try {
    const db = await openIndexedDb();
    idbDraft = await new Promise<ExamDraftRecord | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ? (req.result as ExamDraftRecord) : null);
      req.onerror = () => resolve(null);
    });
  } catch {
    idbDraft = null;
  }

  // 3. Reconciliação Last-Write-Wins (LWW)
  if (!idbDraft && !lsDraft) return null;
  if (idbDraft && !lsDraft) return idbDraft;
  if (!idbDraft && lsDraft) return lsDraft;

  // Se ambos existem, priorizar o timestamp mais recente
  if (idbDraft && lsDraft) {
    return (idbDraft.timestamp || 0) >= (lsDraft.timestamp || 0) ? idbDraft : lsDraft;
  }

  return null;
}

/**
 * Remove rascunho após a entrega final da prova
 */
export async function clearExamDraft(examId: string, studentId: string): Promise<void> {
  const key = getCompositeKey(examId, studentId);
  try {
    localStorage.removeItem(`${LS_FALLBACK_PREFIX}${key}`);
  } catch {}

  try {
    const db = await openIndexedDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch {}
}
