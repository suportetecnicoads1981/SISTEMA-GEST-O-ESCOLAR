import React from 'react';
import { HardDrive, ArrowRight, CheckCircle2, ShieldCheck, RefreshCw, Cpu, Layers } from 'lucide-react';
import { NexusFileTransferProgress } from '../../types';

interface FileTransferProgressBarProps {
  progress: NexusFileTransferProgress;
  onCancel?: () => void;
  onDismiss?: () => void;
}

export const FileTransferProgressBar: React.FC<FileTransferProgressBarProps> = ({
  progress,
  onCancel,
}) => {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getStageBadge = () => {
    switch (progress.stage) {
      case 'STAGING_BUFFER':
        return {
          label: '1. Buffer Temporário',
          color: 'bg-amber-950 border-amber-800 text-amber-300',
        };
      case 'PERMISSIONS_CHECK':
        return {
          label: '2. Checagem W_OK',
          color: 'bg-indigo-950 border-indigo-800 text-indigo-300',
        };
      case 'ATOMIC_COMMIT':
        return {
          label: '3. Commit Promise.all',
          color: 'bg-sky-950 border-sky-800 text-sky-300',
        };
      case 'POST_INSTALL_VERIFICATION':
        return {
          label: '4. Validação Post-Install',
          color: 'bg-emerald-950 border-emerald-800 text-emerald-300',
        };
      case 'TEMP_CLEANUP':
        return {
          label: '5. Limpeza de Buffer',
          color: 'bg-slate-900 border-slate-700 text-slate-300',
        };
      case 'COMPLETED':
        return {
          label: 'Instalação Concluída',
          color: 'bg-emerald-950 border-emerald-700 text-emerald-200',
        };
      case 'ROLLBACK':
        return {
          label: 'Rollback Ativo',
          color: 'bg-rose-950 border-rose-800 text-rose-300',
        };
      case 'ERROR':
        return {
          label: 'Falha no Pipeline',
          color: 'bg-rose-950 border-rose-800 text-rose-300',
        };
      default:
        return {
          label: 'Transferindo',
          color: 'bg-sky-950 border-sky-800 text-sky-300',
        };
    }
  };

  const stageBadge = getStageBadge();

  return (
    <div
      id="nexus_file_transfer_progress_bar"
      className="bg-slate-950 border border-slate-800 rounded-md p-4 text-slate-200 shadow-lg space-y-3 font-mono text-xs transition-all duration-300"
    >
      {/* Header com estágio e métricas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-sky-500/10 border border-sky-500/30 text-sky-400">
            {progress.stage === 'COMPLETED' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : progress.stage === 'PERMISSIONS_CHECK' ? (
              <ShieldCheck className="h-4 w-4 text-indigo-400" />
            ) : (
              <RefreshCw className="h-4 w-4 animate-spin text-sky-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-sm tracking-tight">
                Transferência de Binários e Configurações
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${stageBadge.color}`}
              >
                {stageBadge.label}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{progress.message}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {progress.speedFormatted && (
            <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
              Taxa: <strong className="text-sky-400">{progress.speedFormatted}</strong>
            </span>
          )}
          <span className="text-base font-black text-sky-400">
            {Math.min(100, Math.max(0, Math.round(progress.percent)))}%
          </span>
        </div>
      </div>

      {/* Barra de Progresso Animada com Primária sky-500 */}
      <div className="space-y-1.5">
        <div className="w-full bg-slate-900 border border-slate-800 rounded-md h-3 overflow-hidden p-0.5">
          <div
            className="bg-sky-500 h-full rounded-sm transition-all duration-300 ease-out shadow-[0_0_12px_rgba(14,165,233,0.6)]"
            style={{ width: `${Math.min(100, Math.max(2, progress.percent))}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1 truncate max-w-xs sm:max-w-md">
            <span className="text-slate-500">Arquivo atual:</span>
            <strong className="text-slate-200 font-mono truncate">{progress.currentFile || 'Iniciando...'}</strong>
          </span>

          <div className="flex items-center gap-3 shrink-0">
            <span>
              Arquivos: <strong className="text-slate-200">{progress.filesTransferred}</strong>/{progress.totalFiles}
            </span>
            <span>
              Bytes: <strong className="text-sky-400">{formatBytes(progress.bytesTransferred)}</strong> / {formatBytes(progress.totalBytes)}
            </span>
          </div>
        </div>
      </div>

      {/* Fluxo Visual dos Estágios (Pipeline Sequence) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        <div
          className={`p-2 rounded-md border ${
            progress.stage === 'STAGING_BUFFER'
              ? 'bg-sky-500/10 border-sky-500/40 text-sky-300'
              : progress.percent > 30
              ? 'bg-slate-900/60 border-slate-800 text-emerald-400'
              : 'bg-slate-950 border-slate-900 text-slate-500'
          }`}
        >
          <div className="flex items-center gap-1 text-[10px] uppercase font-bold">
            <Layers className="h-3 w-3" />
            <span>1. Buffer Staging</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">Gravação temporária</p>
        </div>

        <div
          className={`p-2 rounded-md border ${
            progress.stage === 'PERMISSIONS_CHECK'
              ? 'bg-sky-500/10 border-sky-500/40 text-sky-300'
              : progress.percent > 40
              ? 'bg-slate-900/60 border-slate-800 text-emerald-400'
              : 'bg-slate-950 border-slate-900 text-slate-500'
          }`}
        >
          <div className="flex items-center gap-1 text-[10px] uppercase font-bold">
            <ShieldCheck className="h-3 w-3" />
            <span>2. Checagem W_OK</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">Permissões de escrita</p>
        </div>

        <div
          className={`p-2 rounded-md border ${
            progress.stage === 'ATOMIC_COMMIT'
              ? 'bg-sky-500/10 border-sky-500/40 text-sky-300'
              : progress.percent > 80
              ? 'bg-slate-900/60 border-slate-800 text-emerald-400'
              : 'bg-slate-950 border-slate-900 text-slate-500'
          }`}
        >
          <div className="flex items-center gap-1 text-[10px] uppercase font-bold">
            <Cpu className="h-3 w-3" />
            <span>3. Commit Atômico</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">Promise.all para raiz</p>
        </div>

        <div
          className={`p-2 rounded-md border ${
            progress.stage === 'POST_INSTALL_VERIFICATION' || progress.stage === 'COMPLETED'
              ? 'bg-sky-500/10 border-sky-500/40 text-sky-300'
              : 'bg-slate-950 border-slate-900 text-slate-500'
          }`}
        >
          <div className="flex items-center gap-1 text-[10px] uppercase font-bold">
            <CheckCircle2 className="h-3 w-3" />
            <span>4. Post-Install</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">index.js, package.json, .env</p>
        </div>
      </div>
    </div>
  );
};
