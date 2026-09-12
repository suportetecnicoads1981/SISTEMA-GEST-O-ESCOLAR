import React from 'react';
import {
  CheckCircle2,
  RefreshCw,
  Zap,
  ShieldCheck,
  HardDrive,
  Cloud,
  Database,
  ArrowRightLeft,
  XCircle,
  Clock
} from 'lucide-react';

export interface BulkSyncProgressData {
  isActive: boolean;
  totalRecords: number;
  processedRecords: number;
  syncedRecords: number;
  conflictsResolved: number;
  percentage: number;
  currentBatch: number;
  totalBatches: number;
  currentTable: string;
  speedRecordsPerSec: number;
  estimatedTimeRemainingSec: number;
  status: 'IDLE' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  startedAt?: string;
  finishedAt?: string;
}

interface BulkUpsertProgressBarProps {
  progress: BulkSyncProgressData;
  onCancel?: () => void;
  onDismiss?: () => void;
}

export const BulkUpsertProgressBar: React.FC<BulkUpsertProgressBarProps> = ({
  progress,
  onCancel,
  onDismiss,
}) => {
  if (!progress.isActive && progress.status === 'IDLE') {
    return null;
  }

  const isCompleted = progress.status === 'COMPLETED';
  const isProcessing = progress.status === 'PROCESSING';

  return (
    <div
      id="bulk-upsert-progress-container"
      className="bg-white border-2 border-blue-500/80 rounded-lg p-5 shadow-md space-y-4 transition-all animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {/* Cabeçalho da Barra de Progresso */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-xs ${
              isCompleted
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 text-white'
            }`}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <RefreshCw className="w-5 h-5 animate-spin" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                {isCompleted
                  ? 'Upsert em Massa Concluído com Sucesso'
                  : 'Processando Upsert em Massa: SQLite ➔ Supabase'}
              </h3>
              <span
                className={`text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full ${
                  isCompleted
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {progress.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isCompleted
                ? `${progress.totalRecords} registros unificados no Supabase PostgreSQL com regra Last Write Wins (LWW).`
                : `Transmitindo lotes com onConflict: 'id'. Tabela ativa: ${progress.currentTable}`}
            </p>
          </div>
        </div>

        {/* Porcentagem em Destaque */}
        <div className="flex items-baseline gap-2 self-start sm:self-center">
          <span className="text-2xl font-black text-blue-600 tracking-tight font-mono">
            {progress.percentage}%
          </span>
          <span className="text-xs text-slate-500 font-semibold">
            ({progress.processedRecords}/{progress.totalRecords} reg)
          </span>
        </div>
      </div>

      {/* Barra Visual de Progresso com Transição Suave e Shimmer */}
      <div className="space-y-1.5">
        <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-200">
          <div
            className={`h-full rounded-full transition-all duration-300 ease-out relative overflow-hidden ${
              isCompleted
                ? 'bg-emerald-500'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, progress.percentage))}%` }}
          >
            {/* Efeito de brilho/pulso contínuo enquanto estiver processando */}
            {isProcessing && (
              <div className="absolute inset-0 bg-white/25 animate-pulse" />
            )}
          </div>
        </div>

        {/* Marcadores de início e fim da barra */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span className="flex items-center gap-1">
            <HardDrive className="w-3 h-3 text-slate-400" />
            0% (SQLite Local)
          </span>
          <span className="font-semibold text-slate-700">
            Lote {progress.currentBatch} de {progress.totalBatches}
          </span>
          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
            <Cloud className="w-3 h-3" />
            100% (Supabase Cloud)
          </span>
        </div>
      </div>

      {/* Painel de Métricas e Telemetria em Tempo Real */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        {/* Tabela Atual */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Database className="w-3 h-3 text-blue-500" />
            Tabela em Trânsito
          </div>
          <div className="font-mono font-bold text-slate-800 text-[11px] mt-0.5 truncate">
            {progress.currentTable}
          </div>
        </div>

        {/* Taxa de Transferência */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500" />
            Velocidade
          </div>
          <div className="font-mono font-bold text-slate-800 text-[11px] mt-0.5">
            ~{progress.speedRecordsPerSec} reg/s
          </div>
        </div>

        {/* Conflitos LWW Resolvidos */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <ArrowRightLeft className="w-3 h-3 text-indigo-500" />
            Conflitos LWW
          </div>
          <div className="font-mono font-bold text-indigo-700 text-[11px] mt-0.5">
            {progress.conflictsResolved} auditados
          </div>
        </div>

        {/* Tempo Estimado */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-emerald-500" />
            Tempo Restante
          </div>
          <div className="font-mono font-bold text-slate-800 text-[11px] mt-0.5">
            {isCompleted ? 'Concluído' : `${progress.estimatedTimeRemainingSec}s`}
          </div>
        </div>
      </div>

      {/* Botões de Ação Auxiliares */}
      {isCompleted && onDismiss && (
        <div className="flex justify-end pt-1">
          <button
            onClick={onDismiss}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            Fechar Relatório de Progresso
          </button>
        </div>
      )}

      {isProcessing && onCancel && (
        <div className="flex justify-end pt-1">
          <button
            onClick={onCancel}
            className="text-xs font-semibold text-rose-700 hover:text-rose-900 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
          >
            <XCircle className="w-3.5 h-3.5" />
            Interromper Transmissão
          </button>
        </div>
      )}
    </div>
  );
};
