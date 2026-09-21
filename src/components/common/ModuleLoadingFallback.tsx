import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

interface ModuleLoadingFallbackProps {
  moduleName?: string;
}

export const ModuleLoadingFallback: React.FC<ModuleLoadingFallbackProps> = ({
  moduleName = 'Módulo',
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[420px] w-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-8 shadow-xs animate-in fade-in duration-300">
      <div className="relative flex items-center justify-center mb-5">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <Loader2 className="w-7 h-7 animate-spin text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
          <Sparkles className="w-3 h-3" />
        </div>
      </div>
      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">
        Carregando {moduleName}...
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-sm text-center">
        Otimizando recursos e inicializando componentes de alta performance sob demanda.
      </p>
    </div>
  );
};
