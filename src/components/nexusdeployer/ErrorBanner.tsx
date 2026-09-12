import React from 'react';
import { AlertTriangle, RotateCcw, ShieldAlert, Database, X, ExternalLink, HardDrive } from 'lucide-react';
import { NexusInstallErrorLogRecord } from '../../types';

interface ErrorBannerProps {
  error: NexusInstallErrorLogRecord | { message: string; code?: string; details?: string };
  onRetry?: () => void;
  onDismiss?: () => void;
  onViewAudit?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  error,
  onRetry,
  onDismiss,
  onViewAudit,
}) => {
  const errorMessage = 'errorMessage' in error ? error.errorMessage : error.message;
  const errorCode = 'errorCode' in error ? error.errorCode : error.code || 'FS_PERMISSION_ERROR';
  const targetDir = 'targetDir' in error ? error.targetDir : 'C:\\SucessoEdu';
  const temporaryBufferPreserved = 'temporaryBufferPreserved' in error ? error.temporaryBufferPreserved : true;
  const firestoreSynced = 'firestoreSynced' in error ? error.firestoreSynced : true;

  return (
    <div
      id="nexus_install_error_banner"
      className="bg-slate-950 border border-rose-900/60 rounded-md p-4 text-slate-200 shadow-xl space-y-3 font-mono text-xs transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-md bg-rose-950/60 border border-rose-800 text-rose-400 shrink-0 mt-0.5">
            <AlertTriangle className="h-5 w-5" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-rose-200 text-sm">
                Falha de Instalação: Diretório Raiz Inacessível ou Vazio
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-rose-950 border border-rose-800 text-rose-300">
                {errorCode}
              </span>
              {firestoreSynced && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-sky-400 flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  Auditado no Firestore
                </span>
              )}
            </div>

            <p className="text-slate-300 leading-relaxed">
              {errorMessage}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <HardDrive className="h-3.5 w-3.5 text-slate-500" />
                <span>Destino: <strong className="text-slate-200">{targetDir}</strong></span>
              </span>

              {temporaryBufferPreserved && (
                <span className="text-emerald-400 flex items-center gap-1">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Buffer temporário preservado intacto (sem perda de binários)
                </span>
              )}
            </div>
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-slate-500 hover:text-slate-300 p-1 rounded-md hover:bg-slate-900 transition-colors cursor-pointer"
            title="Fechar Notificação"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Ações Rápidas de Resolução */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <span className="text-[11px] text-slate-400">
          O pipeline impediu a conclusão prematura e ativou a proteção de diretório vazio.
        </span>

        <div className="flex items-center gap-2">
          {onViewAudit && (
            <button
              onClick={onViewAudit}
              className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-850 border border-slate-700 text-slate-300 hover:text-slate-100 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-mono"
            >
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
              <span>Ver Log de Auditoria</span>
            </button>
          )}

          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-1.5 rounded-md bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-mono shadow-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Tentar Novamente</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
