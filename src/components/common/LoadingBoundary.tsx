import React from 'react';
import { Loader2, ShieldAlert, RefreshCw } from 'lucide-react';

interface LoadingBoundaryProps {
  isLoading: boolean;
  error?: string | null;
  loadingFallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  onRetry?: () => void;
  children: React.ReactNode;
}

export const LoadingBoundary: React.FC<LoadingBoundaryProps> = ({
  isLoading,
  error,
  loadingFallback,
  errorFallback,
  onRetry,
  children,
}) => {
  if (isLoading) {
    if (loadingFallback) {
      return <>{loadingFallback}</>;
    }
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 min-h-[220px] bg-slate-50/50 rounded-2xl border border-slate-200">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-800">Carregando permissões e perfil...</p>
          <p className="text-xs text-slate-500 mt-0.5">Validando privilégios e estado de sessão segura</p>
        </div>
      </div>
    );
  }

  if (error) {
    if (errorFallback) {
      return <>{errorFallback}</>;
    }
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
        <ShieldAlert className="h-8 w-8 text-rose-600" />
        <div>
          <h4 className="text-sm font-bold text-rose-900">Falha ao autenticar sessão</h4>
          <p className="text-xs text-rose-700 mt-1 max-w-md">{error}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Tentar Novamente</span>
          </button>
        )}
      </div>
    );
  }

  return <>{children}</>;
};
