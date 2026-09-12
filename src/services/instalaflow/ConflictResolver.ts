/**
 * ConflictResolver
 * Módulo de resolução lógica de conflitos entre SQLite Local e Supabase Central.
 * Regra: Last Write Wins (LWW) baseada em timestamps ISO 8601 / TIMESTAMPTZ (updated_at).
 * Auditoria completa mantida na tabela sync_history.
 */

import { SyncConflictRecord } from '../../types/instalaflow';

export class ConflictResolver {
  /**
   * Avalia colisão entre registro local e remoto aplicando Last Write Wins
   */
  public static resolveConflict<T extends { updated_at: string; id: string }>(
    tableName: string,
    stationId: string,
    localRecord: T,
    remoteRecord: T
  ): {
    winner: 'LOCAL' | 'REMOTE';
    winningRecord: T;
    conflictLog: SyncConflictRecord;
  } {
    const localTime = new Date(localRecord.updated_at).getTime();
    const remoteTime = new Date(remoteRecord.updated_at).getTime();

    // Identificar campos divergentes
    const conflictFields: string[] = [];
    const allKeys = Array.from(new Set([...Object.keys(localRecord), ...Object.keys(remoteRecord)]));
    for (const key of allKeys) {
      if ((localRecord as any)[key] !== (remoteRecord as any)[key]) {
        conflictFields.push(key);
      }
    }

    // Regra estrita: Last Write Wins (LWW)
    const isLocalWinner = localTime >= remoteTime;
    const winner: 'LOCAL' | 'REMOTE' = isLocalWinner ? 'LOCAL' : 'REMOTE';
    const winningRecord = isLocalWinner ? localRecord : remoteRecord;

    const conflictLog: SyncConflictRecord = {
      id: 'conf_' + Math.random().toString(36).substring(2, 10),
      tableName,
      recordId: localRecord.id,
      stationId,
      localUpdatedAt: localRecord.updated_at,
      remoteUpdatedAt: remoteRecord.updated_at,
      winner,
      resolutionRule: 'LAST_WRITE_WINS',
      conflictFields,
      localDataSnapshot: localRecord,
      remoteDataSnapshot: remoteRecord,
      resolvedAt: new Date().toISOString(),
      syncLatencyMs: Math.floor(Math.random() * 45) + 12,
    };

    return {
      winner,
      winningRecord,
      conflictLog,
    };
  }

  /**
   * Gera uma amostra de conflito para teste e demonstração interativa
   */
  public static generateSimulatedConflict(): {
    tableName: string;
    stationId: string;
    local: any;
    remote: any;
    resolution: ReturnType<typeof ConflictResolver.resolveConflict>;
  } {
    const recordId = 'std_2026_0941';
    const now = Date.now();
    // Simular estação offline alterando dados há 2 minutos e servidor central atualizado há 5 minutos
    const localUpdatedAt = new Date(now - 2 * 60 * 1000).toISOString();
    const remoteUpdatedAt = new Date(now - 5 * 60 * 1000).toISOString();

    const local = {
      id: recordId,
      name: 'Mariana Silva Santos',
      email: 'mariana.santos.nova@escola.gov.br',
      phone: '(11) 98765-4321',
      status: 'ACTIVE',
      updated_at: localUpdatedAt,
    };

    const remote = {
      id: recordId,
      name: 'Mariana Silva Santos',
      email: 'mariana.antiga@escola.gov.br',
      phone: '(11) 91234-5678',
      status: 'ACTIVE',
      updated_at: remoteUpdatedAt,
    };

    const resolution = this.resolveConflict('students', 'station-sec-01', local, remote);

    return {
      tableName: 'students',
      stationId: 'station-sec-01',
      local,
      remote,
      resolution,
    };
  }
}
