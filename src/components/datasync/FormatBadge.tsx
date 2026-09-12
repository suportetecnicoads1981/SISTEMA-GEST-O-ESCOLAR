import React from 'react';
import { Sparkles, Film, ArrowRight, Zap, Image as ImageIcon } from 'lucide-react';

interface FormatBadgeProps {
  originalFormat: 'GIF' | 'JPEG' | 'PNG' | 'WEBP' | 'OTHER' | string;
  isAnimated?: boolean;
  savingsRatio?: number;
  savingsKb?: number;
  finalFormat?: string;
  className?: string;
}

export const FormatBadge: React.FC<FormatBadgeProps> = ({
  originalFormat,
  isAnimated = false,
  savingsRatio = 0,
  savingsKb,
  finalFormat = 'WEBP',
  className = '',
}) => {
  const isGif = originalFormat.toUpperCase() === 'GIF' || isAnimated;

  return (
    <div className={`inline-flex items-center gap-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs ${className}`}>
      {/* Formato Original */}
      <div
        className={`px-2 py-0.5 rounded-lg font-mono font-bold text-[11px] flex items-center gap-1 ${
          isGif
            ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
            : 'bg-slate-800 border border-slate-700 text-slate-300'
        }`}
      >
        {isGif ? (
          <>
            <Film className="w-3 h-3 text-amber-400 animate-pulse" />
            <span>GIF ANIMADO</span>
          </>
        ) : (
          <>
            <ImageIcon className="w-3 h-3 text-slate-400" />
            <span>{originalFormat.toUpperCase()}</span>
          </>
        )}
      </div>

      <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />

      {/* Formato Final WebP */}
      <div className="px-2 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 font-mono font-extrabold text-[11px] text-emerald-400 flex items-center gap-1">
        <Sparkles className="w-3 h-3 text-emerald-400" />
        <span>.{finalFormat.toLowerCase()}</span>
      </div>

      {/* Taxa de Compressão e Economia */}
      {savingsRatio > 0 && (
        <div className="px-2 py-0.5 rounded-lg bg-emerald-950 border border-emerald-500/30 text-emerald-300 font-mono font-extrabold text-[11px] flex items-center gap-1">
          <Zap className="w-3 h-3 text-emerald-400" />
          <span>-{savingsRatio}%</span>
          {savingsKb && savingsKb > 0 && (
            <span className="text-slate-400 font-normal">
              ({savingsKb > 1024 ? `${(savingsKb / 1024).toFixed(1)}MB` : `${savingsKb}KB`})
            </span>
          )}
        </div>
      )}
    </div>
  );
};
