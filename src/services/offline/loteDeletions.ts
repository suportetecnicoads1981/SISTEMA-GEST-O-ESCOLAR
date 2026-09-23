/**
 * Registro das exclusões que devem viajar no lote para a Sede.
 * (Separado de loteService para não criar dependência circular com storage.ts.)
 */
import { appendDeletionLog, LOTE_DELETIONS_KEY, LoteDeletion, SERVER_DELETION_LOG_KEY } from './batchPacket';
import { enqueueRawOps, isLocalServerMode } from './localServerSync';

export function readBrowserDeletions(): LoteDeletion[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOTE_DELETIONS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Guarda as exclusões feitas nas telas para irem no próximo lote. */
export function recordLoteDeletions(entries: LoteDeletion[]): void {
  if (!entries.length) return;
  if (isLocalServerMode()) {
    // Fica no banco do servidor: vale para exclusões feitas em qualquer estação da escola.
    enqueueRawOps(
      entries.map((d) => {
        const id = `${d.k}:${d.id}`;
        return { k: SERVER_DELETION_LOG_KEY, t: 'u' as const, id, v: { id, k: d.k, recordId: d.id, at: d.at } };
      })
    );
    return;
  }
  try {
    localStorage.setItem(LOTE_DELETIONS_KEY, JSON.stringify(appendDeletionLog(readBrowserDeletions(), entries)));
  } catch {
    /* sem espaço: a exclusão segue valendo localmente */
  }
}

