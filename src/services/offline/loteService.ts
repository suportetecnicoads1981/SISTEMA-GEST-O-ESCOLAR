/**
 * Integra o lote (.edusync formato 2) com o armazenamento do sistema.
 */
import { getStoredData, saveStoredData } from '../../data/storage';
import { readBrowserDeletions } from './loteDeletions';
import {
  buildLotePacket,
  LoteDeletion,
  LoteMergeReport,
  LotePacket,
  LoteUnit,
  mergeLotePacket,
  SERVER_DELETION_LOG_KEY,
} from './batchPacket';
import { fetchServerStore, flushLocalChanges, getLocalServerInfo, isLocalServerMode } from './localServerSync';

/** Dados usados no lote: no Servidor Remoto, o banco do servidor (todas as estações). */
async function loteSource(): Promise<{ state: Record<string, any>; deletions: LoteDeletion[] }> {
  if (isLocalServerMode()) {
    await flushLocalChanges();
    const server = await fetchServerStore();
    if (server?.data) {
      const log = Array.isArray(server.data[SERVER_DELETION_LOG_KEY]) ? server.data[SERVER_DELETION_LOG_KEY] : [];
      return { state: server.data, deletions: log.map((d: any) => ({ k: d.k, id: String(d.recordId ?? ''), at: d.at })).filter((d: LoteDeletion) => d.k && d.id) };
    }
    throw new Error('Não foi possível ler o banco do Servidor Remoto. Verifique se ele está ligado e tente novamente.');
  }
  return { state: getStoredData() as any, deletions: readBrowserDeletions() };
}

export async function generateLote(unit: LoteUnit, operatorName: string): Promise<LotePacket> {
  const { state, deletions } = await loteSource();
  const info = getLocalServerInfo();
  const units = Array.isArray(state.schoolUnits) ? state.schoolUnits : [];
  return buildLotePacket(state, unit, {
    operatorName,
    originRole: info?.role || 'NAVEGADOR',
    serverName: info?.serverName,
    deletions,
    includeUntagged: info?.role === 'REMOTO' || units.length <= 1,
  });
}

export function downloadLote(packet: LotePacket): string {
  const safeName = (packet.schoolUnit.name || 'escola').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '_');
  const fileName = `LOTE_${packet.schoolUnit.inepCode || 'SEM_INEP'}_${safeName}_${packet.createdAt.slice(0, 10)}.edusync`;
  const blob = new Blob([JSON.stringify(packet)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return fileName;
}

/** Importa o lote na Sede (mescla) e grava. Com Servidor da Sede, vai para o banco dele. */
export function importLote(packet: LotePacket, operatorName: string): LoteMergeReport {
  const current = getStoredData() as any;
  const { next, report } = mergeLotePacket(current, packet, operatorName);
  saveStoredData(next as any);
  window.dispatchEvent(new CustomEvent('sucessoedu_db_changed', { detail: next }));
  return report;
}
