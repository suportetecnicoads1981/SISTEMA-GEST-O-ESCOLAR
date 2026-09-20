/**
 * SucessoEdu Gestão Educacional - Armazenamento Resiliente de Backups em IndexedDB
 * 
 * Resolve definitivamente a limitação de cota de 5MB do LocalStorage.
 * Permite armazenar snapshots completos do banco de dados (alunos, turmas, notas, diários, financeiro)
 * em escala corporativa sem risco de QuotaExceededError.
 */

import { AutoBackupSnapshot } from '../types';

const DB_NAME = 'SucessoEdu_BackupDB';
const DB_VERSION = 1;
const STORE_NAME = 'snapshots';

// Cache em memória para acesso síncrono ultra-rápido durante a sessão
const snapshotMemoryCache = new Map<string, any>();

/**
 * Abre a conexão com o banco IndexedDB de cópias de segurança
 */
function openBackupDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB não suportado ou indisponível neste ambiente.'));
      return;
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('version', 'version', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => {
        console.warn('[BackupIDB] Conexão bloqueada por outra aba aberta.');
        reject(new Error('IndexedDB bloqueado por outra aba.'));
      };
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Registra dados de um snapshot no cache em memória síncrono
 */
export function cacheSnapshotData(id: string, data: any): void {
  if (id && data) {
    snapshotMemoryCache.set(id, data);
  }
}

/**
 * Obtém dados de um snapshot do cache em memória síncrono
 */
export function getCachedSnapshotData(id: string): any | undefined {
  return snapshotMemoryCache.get(id);
}

/**
 * Salva um snapshot completo no IndexedDB e atualiza o cache em memória
 */
export async function saveSnapshotToIndexedDb(snapshot: AutoBackupSnapshot): Promise<boolean> {
  if (!snapshot || !snapshot.id) return false;

  // Atualiza cache em memória
  if (snapshot.data) {
    cacheSnapshotData(snapshot.id, snapshot.data);
  }

  try {
    const db = await openBackupDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(snapshot);

      req.onsuccess = () => {
        resolve(true);
      };

      req.onerror = (err) => {
        console.warn('[BackupIDB] Falha ao persistir snapshot no IndexedDB:', err);
        resolve(false);
      };

      tx.oncomplete = () => {
        db.close();
      };
    });
  } catch (err) {
    console.warn('[BackupIDB] Ambiente sem suporte ativo a IndexedDB, mantido em cache de memória:', err);
    return false;
  }
}

/**
 * Recupera um snapshot por ID do IndexedDB
 */
export async function getSnapshotFromIndexedDb(id: string): Promise<AutoBackupSnapshot | null> {
  if (!id) return null;

  try {
    const db = await openBackupDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      req.onsuccess = () => {
        const result = req.result as AutoBackupSnapshot | undefined;
        if (result && result.data) {
          cacheSnapshotData(result.id, result.data);
        }
        resolve(result || null);
      };

      req.onerror = () => resolve(null);

      tx.oncomplete = () => {
        db.close();
      };
    });
  } catch {
    return null;
  }
}

/**
 * Recupera todos os snapshots gravados no IndexedDB
 */
export async function getAllSnapshotsFromIndexedDb(): Promise<AutoBackupSnapshot[]> {
  try {
    const db = await openBackupDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const results = (req.result as AutoBackupSnapshot[]) || [];
        // Alimenta o cache em memória
        results.forEach((s) => {
          if (s.id && s.data) {
            cacheSnapshotData(s.id, s.data);
          }
        });
        resolve(results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      };

      req.onerror = () => resolve([]);

      tx.oncomplete = () => {
        db.close();
      };
    });
  } catch {
    return [];
  }
}

/**
 * Carrega em segundo plano os dados de snapshots no cache de memória
 */
export function preloadSnapshotsCache(): void {
  if (typeof window !== 'undefined' && window.indexedDB) {
    getAllSnapshotsFromIndexedDb().catch(() => {});
  }
}

// Inicializa o preload em ambientes com suporte
if (typeof window !== 'undefined' && window.indexedDB) {
  setTimeout(() => {
    preloadSnapshotsCache();
  }, 1000);
}
