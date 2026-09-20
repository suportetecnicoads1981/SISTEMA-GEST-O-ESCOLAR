import React from 'react';
import { Target, TrendingUp, TrendingDown, Eye, EyeOff, Info } from 'lucide-react';

export interface InteractiveTooltipProps {
  active?: boolean;
  payload?: readonly any[] | any[];
  label?: string;
  unit?: string;
  valueLabel?: string;
  secondaryValueLabel?: string;
  benchmarkValue?: number;
  benchmarkLabel?: string;
  showTotal?: boolean;
  totalLabel?: string;
  customFormatter?: (value: any, name: string) => React.ReactNode;
}

/**
 * Tooltip Interativo Rico para Recharts.
 * Oferece indicador de cor vibrante, badge de categoria, cálculo automático
 * de desvio em relação à meta (benchmark) e formatação numérica refinada.
 */
export const InteractiveChartTooltip: React.FC<InteractiveTooltipProps> = ({
  active,
  payload,
  label,
  unit = '',
  valueLabel = 'Valor',
  secondaryValueLabel = 'Referência',
  benchmarkValue,
  benchmarkLabel = 'Meta',
  showTotal = false,
  totalLabel = 'Total Consolidado',
  customFormatter,
}) => {
  if (!active || !payload || payload.length === 0) return null;

  const firstItem = payload[0];
  const itemPayload = firstItem?.payload || {};
  const category = itemPayload.category || itemPayload.subject || itemPayload.tipo;

  // Calcula total se solicitado
  const total = payload.reduce((acc, curr) => acc + (Number(curr?.value) || 0), 0);

  // Valor principal para comparação com benchmark
  const primaryVal = Number(firstItem?.value ?? 0);
  const diffBenchmark = benchmarkValue !== undefined && !isNaN(primaryVal) ? primaryVal - benchmarkValue : null;

  return (
    <div
      className="bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/80 text-xs min-w-[210px] max-w-[320px] z-50 pointer-events-none select-none transition-transform duration-75 animate-in fade-in zoom-in-95"
      style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.3))' }}
    >
      {/* Cabeçalho do Tooltip */}
      <div className="border-b border-slate-800/90 pb-2 mb-2 flex items-center justify-between gap-2">
        <span className="font-extrabold text-slate-100 truncate text-[13px]">
          {label || firstItem?.name || itemPayload.name || 'Registro'}
        </span>
        {category && (
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30 truncate max-w-[120px]">
            {category}
          </span>
        )}
      </div>

      {/* Lista de Séries no Ponto Amostrado */}
      <div className="space-y-1.5">
        {payload.map((entry, idx) => {
          const val = Number(entry.value ?? 0);
          const color = entry.color || entry.fill || entry.stroke || '#6366f1';
          const name = entry.name || (idx === 0 ? valueLabel : secondaryValueLabel);
          const percentage = total > 0 ? ((val / total) * 100).toFixed(1) : null;

          return (
            <div key={`tooltip-item-${idx}`} className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: color }}
                />
                <span className="text-slate-300 truncate font-medium">{name}:</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="font-bold text-white font-mono text-sm">
                  {customFormatter ? customFormatter(val, name) : `${val.toLocaleString('pt-BR')}${unit ? ` ${unit}` : ''}`}
                </span>
                {payload.length > 1 && percentage && (
                  <span className="text-[10px] text-slate-400 font-mono">({percentage}%)</span>
                )}
              </div>
            </div>
          );
        })}

        {/* Total Consolidado (opcional para pilhas ou múltiplos) */}
        {showTotal && payload.length > 1 && (
          <div className="flex items-center justify-between gap-3 pt-1.5 border-t border-slate-800 text-[11px]">
            <span className="text-slate-400 font-semibold">{totalLabel}:</span>
            <span className="font-black text-white font-mono">
              {total.toLocaleString('pt-BR')} {unit}
            </span>
          </div>
        )}

        {/* Comparativo de Meta / Benchmark */}
        {diffBenchmark !== null && (
          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/80">
            <span className="text-slate-400 flex items-center gap-1">
              <Target className="h-3 w-3 text-slate-400" />
              <span>{benchmarkLabel} ({benchmarkValue}{unit}):</span>
            </span>
            <span
              className={`font-black font-mono flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] ${
                diffBenchmark >= 0
                  ? 'text-emerald-300 bg-emerald-950/60 border border-emerald-500/30'
                  : 'text-rose-300 bg-rose-950/60 border border-rose-500/30'
              }`}
            >
              {diffBenchmark >= 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 inline" />
                  +{diffBenchmark.toFixed(1)} {unit}
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 inline" />
                  {diffBenchmark.toFixed(1)} {unit}
                </>
              )}
            </span>
          </div>
        )}

        {/* Informações adicionais do payload se existirem */}
        {itemPayload.description && (
          <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800/80 leading-snug">
            {itemPayload.description}
          </p>
        )}
      </div>
    </div>
  );
};

export interface DynamicLegendProps {
  payload?: readonly any[] | any[];
  hiddenKeys?: string[];
  onToggleKey?: (dataKey: string) => void;
  className?: string;
  showToggleHint?: boolean;
}

/**
 * Legenda Dinâmica e Interativa para Recharts.
 * Permite clicar para alternar/filtrar séries visíveis dinamicamente.
 */
export const DynamicInteractiveLegend: React.FC<DynamicLegendProps> = ({
  payload = [],
  hiddenKeys = [],
  onToggleKey,
  className = '',
  showToggleHint = true,
}) => {
  if (!payload || payload.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center justify-center gap-2 pt-2 pb-1 no-print ${className}`}>
      {payload.map((entry: any, index: number) => {
        const key = entry.dataKey || entry.value || String(index);
        const isHidden = hiddenKeys.includes(key);
        const color = entry.color || '#6366f1';

        return (
          <button
            key={`legend-item-${index}`}
            type="button"
            onClick={() => onToggleKey && onToggleKey(key)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer select-none ${
              isHidden
                ? 'bg-slate-100 text-slate-400 border-slate-200 line-through opacity-60 hover:opacity-80'
                : 'bg-white text-slate-700 border-slate-200 shadow-2xs hover:border-slate-300 hover:bg-slate-50'
            }`}
            title={onToggleKey ? `Clique para ${isHidden ? 'exibir' : 'ocultar'} ${entry.value}` : undefined}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full shrink-0 transition-opacity ${isHidden ? 'opacity-40' : 'opacity-100'}`}
              style={{ backgroundColor: color }}
            />
            <span>{entry.value}</span>
            {onToggleKey && (
              <span className="text-slate-400 ml-0.5">
                {isHidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </span>
            )}
          </button>
        );
      })}

      {showToggleHint && onToggleKey && payload.length > 1 && (
        <span className="text-[10px] text-slate-400 hidden sm:inline ml-1 font-medium">
          (Clique nas séries para filtrar)
        </span>
      )}
    </div>
  );
};

/**
 * Propriedades Padronizadas e Escaláveis para o Eixo X (XAxis).
 * Garante alta legibilidade na tela e na impressão A4.
 */
export function getScalableXAxisProps(options?: {
  dataKey?: string;
  theme?: 'LIGHT' | 'DARK' | 'INDIGO';
  angle?: number;
  interval?: number | 'preserveStartEnd';
  height?: number;
  maxLength?: number;
}) {
  const isDark = options?.theme === 'DARK';
  const angle = options?.angle ?? -22;
  const height = options?.height ?? (angle !== 0 ? 44 : 28);
  const maxLength = options?.maxLength ?? 22;

  return {
    dataKey: options?.dataKey || 'name',
    tick: {
      fontSize: 10.5,
      fill: isDark ? '#cbd5e1' : '#334155',
      fontWeight: 600,
    },
    tickLine: { stroke: isDark ? '#475569' : '#94a3b8' },
    axisLine: { stroke: isDark ? '#475569' : '#cbd5e1', strokeWidth: 1.5 },
    interval: options?.interval ?? 0,
    angle,
    textAnchor: angle !== 0 ? ('end' as const) : ('middle' as const),
    height,
    dy: angle !== 0 ? 6 : 0,
    dx: angle !== 0 ? -4 : 0,
    tickFormatter: (val: any) => {
      if (typeof val !== 'string') return String(val ?? '');
      return val.length > maxLength ? `${val.substring(0, maxLength - 1)}…` : val;
    },
  };
}

/**
 * Propriedades Padronizadas e Escaláveis para o Eixo Y (YAxis).
 * Suporta sufixo de unidade, domínio dinâmico e legibilidade superior.
 */
export function getScalableYAxisProps(options?: {
  unit?: string;
  theme?: 'LIGHT' | 'DARK' | 'INDIGO';
  domain?: [any, any];
  width?: number;
}) {
  const isDark = options?.theme === 'DARK';
  const unit = options?.unit ?? '';

  return {
    unit: unit === '%' ? '%' : '',
    domain: options?.domain,
    width: options?.width ?? (unit ? 42 : 36),
    tick: {
      fontSize: 10.5,
      fill: isDark ? '#94a3b8' : '#475569',
      fontWeight: 600,
    },
    tickLine: { stroke: isDark ? '#475569' : '#94a3b8' },
    axisLine: { stroke: isDark ? '#475569' : '#cbd5e1', strokeWidth: 1.5 },
    tickFormatter: (v: any) => {
      if (typeof v !== 'number') return v;
      if (unit && unit !== '%') return `${v} ${unit}`;
      return `${v}`;
    },
  };
}

/**
 * Propriedades Padronizadas para Grade Cartesiana (CartesianGrid).
 */
export function getScalableGridProps(theme?: 'LIGHT' | 'DARK' | 'INDIGO', vertical = false) {
  const isDark = theme === 'DARK';
  return {
    strokeDasharray: '3 3',
    vertical,
    stroke: isDark ? '#334155' : '#e2e8f0',
    strokeOpacity: 0.85,
  };
}
