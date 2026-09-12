import React from 'react';
import { Zap } from 'lucide-react';

interface ShortcutToastProps {
  toast: {
    keyLabel: string;
    targetName: string;
  } | null;
}

export const ShortcutToast: React.FC<ShortcutToastProps> = ({ toast }) => {
  if (!toast) return null;

  return (
    <aside
      aria-label="Atalho Acionado"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900/95 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700/80 backdrop-blur-md animate-in slide-in-from-bottom-3 fade-in duration-150 select-none pointer-events-none"
    >
      <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0">
        <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
      </div>
      <div className="flex items-center gap-2 text-xs font-semibold">
        <kbd className="px-2 py-0.5 rounded-md bg-slate-800 text-indigo-300 font-mono font-bold text-[11px] border border-slate-700">
          {toast.keyLabel}
        </kbd>
        <span className="text-slate-200">{toast.targetName}</span>
      </div>
    </aside>
  );
};
