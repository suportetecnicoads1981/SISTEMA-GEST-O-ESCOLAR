import React from 'react';
import { Lock, ShieldAlert, RefreshCw, AlertTriangle } from 'lucide-react';

interface IntegrityLockoutProps {
  isLocked: boolean;
  currentPhase: string;
  processedCount: number;
  totalCount: number;
}

export const IntegrityLockout: React.FC<IntegrityLockoutProps> = ({
  isLocked,
  currentPhase,
  processedCount,
  totalCount,
}) => {
  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 text-center space-y-5 animate-in fade-in zoom-in duration-200">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
          <Lock className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>IntegrityLockout Ativo</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            Bloqueio de Segurança para Migração Crítica
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Para evitar concorrência ou corrupção de dados entre desenvolvimento e produção,
            o acesso de escrita e leitura de usuários comuns está temporariamente suspenso.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Operação em Andamento:</span>
            <span className="font-semibold text-slate-800">{currentPhase}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Documentos Processados:</span>
            <span className="font-mono font-bold text-indigo-600">
              {processedCount.toLocaleString()} / {totalCount.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-2xs text-amber-700 bg-amber-50/80 p-2 rounded-lg border border-amber-200/60">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              Não feche a aba do navegador. A migração é resiliente e finalizará automaticamente.
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-2 text-xs text-slate-400">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
          <span>Sincronizando schemas atômicos com isolamento multi-tenant...</span>
        </div>
      </div>
    </div>
  );
};
