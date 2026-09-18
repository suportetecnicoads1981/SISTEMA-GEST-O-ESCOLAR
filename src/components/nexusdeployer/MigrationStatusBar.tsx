import React from 'react';
import { Database, Clock, RefreshCw, Layers } from 'lucide-react';
import { NexusCoreMigrationProgress } from '../../types/nexusCore';

interface MigrationStatusBarProps {
  progress: NexusCoreMigrationProgress;
}

export const MigrationStatusBar: React.FC<MigrationStatusBarProps> = ({ progress }) => {
  if (!progress.isActive && progress.phase === 'idle') return null;

  const formatSeconds = (secs: number) => {
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}m ${remaining}s`;
  };

  return (
    <div className="bg-white border border-indigo-100 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            {progress.phase === 'completed' ? (
              <Layers className="w-5 h-5 text-emerald-600" />
            ) : (
              <RefreshCw className="w-5 h-5 animate-spin" />
            )}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              {progress.phase === 'snapshot_backup' && 'Fase 1/4: Snapshot Preventivo no Cloud Storage'}
              {progress.phase === 'schema_refactor' && 'Fase 2/4: Migração Contínua de Schema (Sem Timeout)'}
              {progress.phase === 'drive_sync' && 'Fase 3/4: Sincronização com Google Drive'}
              {progress.phase === 'smoke_test' && 'Fase 4/4: Smoke Test Automatizado de Produção'}
              {progress.phase === 'completed' && 'Migração e Deploy Concluídos com Sucesso'}
              {progress.phase === 'failed' && 'Processo Abortado por Falha'}
            </h4>
            <p className="text-xs text-slate-500">
              {progress.currentCollection ? (
                <span>Coleção ativa: <code className="text-indigo-600 font-mono font-medium">{progress.currentCollection}</code></span>
              ) : (
                'Processamento atômico resiliente com isolamento de dados'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-600">
            <Database className="w-4 h-4 text-indigo-500" />
            <span>
              <strong className="text-slate-900 font-semibold">{progress.processedDocs.toLocaleString()}</strong> de{' '}
              {progress.totalDocs.toLocaleString()} docs
            </span>
          </div>

          {progress.phase === 'schema_refactor' && progress.estimatedRemainingSecs > 0 && (
            <div className="flex items-center space-x-1.5 text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Tempo restante: {formatSeconds(progress.estimatedRemainingSecs)}</span>
            </div>
          )}

          <div className="text-right">
            <span className="text-sm font-bold text-indigo-600">{progress.percent}%</span>
          </div>
        </div>
      </div>

      {/* Barra de Progresso Visual */}
      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            progress.phase === 'completed'
              ? 'bg-emerald-500'
              : progress.phase === 'failed'
              ? 'bg-rose-500'
              : 'bg-indigo-600'
          }`}
          style={{ width: `${Math.max(4, progress.percent)}%` }}
        />
      </div>

      {/* Últimos logs de processamento */}
      {progress.logs.length > 0 && (
        <div className="bg-slate-900 rounded-lg p-3 text-2xs font-mono text-slate-300 max-h-24 overflow-y-auto space-y-1">
          {progress.logs.map((log, index) => (
            <div key={index} className="leading-relaxed">
              <span className="text-indigo-400">&gt;</span> {log}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
