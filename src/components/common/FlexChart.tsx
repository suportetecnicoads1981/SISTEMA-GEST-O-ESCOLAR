/**
 * Gráfico com modelo escolhido pelo usuário (colunas, barras, linhas, área, pizza, radar),
 * ordenação e limite de itens. A escolha fica gravada neste computador por `storageKey`.
 *
 * Uso: <FlexChart storageKey="pedag-acertos" data={rows} xKey="name"
 *        series={[{ key: 'acerto', name: '% Acerto', color: '#10b981' }]} />
 */
import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
  ReferenceLine,
} from 'recharts';
import { BarChart3, BarChart2, LineChart as LineIcon, Activity, PieChart as PieIcon, Sparkles, SlidersHorizontal, Download } from 'lucide-react';

export type FlexChartType = 'bar' | 'barH' | 'line' | 'area' | 'pie' | 'radar';

export interface FlexSeries {
  key: string;
  name: string;
  color?: string;
  dashed?: boolean;
}

export interface FlexChartProps {
  data: Array<Record<string, any>>;
  xKey: string;
  series: FlexSeries[];
  storageKey: string;
  defaultType?: FlexChartType;
  allowedTypes?: FlexChartType[];
  yDomain?: [number, number];
  height?: number;
  dark?: boolean;
  unit?: string;
  referenceValue?: number;
  referenceLabel?: string;
  /** Cores por item (pizza). Se ausente usa a paleta. */
  colorKey?: string;
  title?: string;
}

export const FLEX_PALETTES: Record<string, string[]> = {
  Padrão: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9', '#8b5cf6', '#ec4899', '#14b8a6'],
  Oceano: ['#0284c7', '#0ea5e9', '#38bdf8', '#06b6d4', '#22d3ee', '#2563eb', '#60a5fa', '#3b82f6'],
  Floresta: ['#059669', '#10b981', '#34d399', '#0d9488', '#84cc16', '#65a30d', '#047857', '#14b8a6'],
  Pôr_do_sol: ['#ea580c', '#f97316', '#fb923c', '#e11d48', '#f43f5e', '#d97706', '#f59e0b', '#be123c'],
  Cinza: ['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8', '#1e293b', '#cbd5e1', '#e2e8f0'],
};

const TYPE_META: Record<FlexChartType, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  bar: { label: 'Colunas', icon: BarChart3 },
  barH: { label: 'Barras horizontais', icon: BarChart2 },
  line: { label: 'Linhas', icon: LineIcon },
  area: { label: 'Área', icon: Activity },
  pie: { label: 'Pizza / rosca', icon: PieIcon },
  radar: { label: 'Radar', icon: Sparkles },
};

type SortMode = 'original' | 'desc' | 'asc' | 'az';
interface Prefs {
  type: FlexChartType;
  sort: SortMode;
  limit: number;
  labels: boolean;
  grid: boolean;
  palette: string;
}

const PREFIX = 'sucessoedu_chart_prefs_';

function loadPrefs(key: string, fallback: Prefs): Prefs {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}
function savePrefs(key: string, p: Prefs) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(p));
  } catch {
    /* preferências só nesta sessão */
  }
}

/** Ordena e limita a lista pela 1ª série (função pura, usada também nos relatórios). */
export function arrangeChartData<T extends Record<string, any>>(data: T[], valueKey: string, labelKey: string, sort: SortMode, limit: number): T[] {
  let list = [...(data || [])];
  if (sort === 'desc') list.sort((a, b) => (Number(b[valueKey]) || 0) - (Number(a[valueKey]) || 0));
  else if (sort === 'asc') list.sort((a, b) => (Number(a[valueKey]) || 0) - (Number(b[valueKey]) || 0));
  else if (sort === 'az') list.sort((a, b) => String(a[labelKey]).localeCompare(String(b[labelKey]), 'pt-BR'));
  if (limit > 0) list = list.slice(0, limit);
  return list;
}

export function downloadCsv(filename: string, rows: Array<Record<string, any>>, columns: Array<{ key: string; label: string }>) {
  const esc = (v: any) => {
    const s = v === undefined || v === null ? '' : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [columns.map((c) => esc(c.label)).join(';'), ...rows.map((r) => columns.map((c) => esc(r[c.key])).join(';'))];
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const FlexChart: React.FC<FlexChartProps> = ({
  data,
  xKey,
  series,
  storageKey,
  defaultType = 'bar',
  allowedTypes = ['bar', 'barH', 'line', 'area', 'pie', 'radar'],
  yDomain,
  height = 220,
  dark = false,
  unit = '',
  referenceValue,
  referenceLabel,
  colorKey,
  title,
}) => {
  const [prefs, setPrefsState] = useState<Prefs>(() =>
    loadPrefs(storageKey, { type: defaultType, sort: 'original', limit: 0, labels: false, grid: true, palette: 'Padrão' })
  );
  const [showOptions, setShowOptions] = useState(false);
  const setPrefs = (patch: Partial<Prefs>) => {
    setPrefsState((prev) => {
      const next = { ...prev, ...patch };
      savePrefs(storageKey, next);
      return next;
    });
  };
  const type = allowedTypes.includes(prefs.type) ? prefs.type : allowedTypes[0];
  const palette = FLEX_PALETTES[prefs.palette] || FLEX_PALETTES['Padrão'];
  const colorOf = (i: number, s?: FlexSeries) => s?.color && prefs.palette === 'Padrão' ? s.color : palette[i % palette.length];

  const rows = useMemo(
    () => arrangeChartData(data, series[0]?.key || 'value', xKey, prefs.sort, prefs.limit),
    [data, series, xKey, prefs.sort, prefs.limit]
  );

  const axisColor = dark ? '#94a3b8' : '#64748b';
  const gridColor = dark ? '#334155' : '#f1f5f9';
  const tooltipStyle = {
    backgroundColor: dark ? '#0f172a' : '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '11px',
    color: dark ? '#f8fafc' : '#0f172a',
  };
  const fmt = (v: any) => (typeof v === 'number' ? `${Number.isInteger(v) ? v : v.toFixed(1)}${unit}` : v);

  const exportCsv = () =>
    downloadCsv(title || storageKey, rows, [{ key: xKey, label: 'Item' }, ...series.map((s) => ({ key: s.key, label: s.name }))]);

  const renderChart = () => {
    if (rows.length === 0) {
      return <div className="h-full flex items-center justify-center text-xs text-slate-400">Sem dados para exibir.</div>;
    }
    const grid = prefs.grid ? <CartesianGrid strokeDasharray="3 3" stroke={gridColor} /> : null;
    const ref =
      referenceValue !== undefined ? (
        <ReferenceLine y={referenceValue} stroke="#ef4444" strokeDasharray="4 4" label={{ value: referenceLabel || '', fontSize: 10, fill: '#ef4444' }} />
      ) : null;
    const legend = series.length > 1 ? <Legend wrapperStyle={{ fontSize: 11 }} /> : null;

    if (type === 'pie') {
      const s = series[0];
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey={s.key} nameKey={xKey} innerRadius="45%" outerRadius="80%" paddingAngle={3} label={prefs.labels ? (e: any) => fmt(e[s.key]) : undefined}>
              {rows.map((r, i) => (
                <Cell key={i} fill={(colorKey && r[colorKey]) || palette[i % palette.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={fmt as any} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      );
    }
    if (type === 'radar') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={rows} outerRadius="75%">
            <PolarGrid stroke={gridColor} />
            <PolarAngleAxis dataKey={xKey} tick={{ fontSize: 10, fill: axisColor }} />
            <PolarRadiusAxis domain={yDomain} tick={{ fontSize: 9, fill: axisColor }} />
            {series.map((s, i) => (
              <Radar key={s.key} name={s.name} dataKey={s.key} stroke={colorOf(i, s)} fill={colorOf(i, s)} fillOpacity={0.25} />
            ))}
            <Tooltip contentStyle={tooltipStyle} formatter={fmt as any} />
            {legend}
          </RadarChart>
        </ResponsiveContainer>
      );
    }
    const margin = { top: 12, right: 12, left: -18, bottom: 0 };
    const xAxis = <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: axisColor }} />;
    const yAxis = <YAxis domain={yDomain} tick={{ fontSize: 10, fill: axisColor }} />;
    if (type === 'barH') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
            {grid}
            <XAxis type="number" domain={yDomain} tick={{ fontSize: 10, fill: axisColor }} />
            <YAxis type="category" dataKey={xKey} width={110} tick={{ fontSize: 10, fill: axisColor }} />
            <Tooltip contentStyle={tooltipStyle} formatter={fmt as any} />
            {legend}
            {series.map((s, i) => (
              <Bar key={s.key} dataKey={s.key} name={s.name} fill={colorOf(i, s)} radius={[0, 4, 4, 0]}>
                {prefs.labels && <LabelList dataKey={s.key} position="right" formatter={fmt as any} style={{ fontSize: 10, fill: axisColor }} />}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }
    if (type === 'line') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={margin}>
            {grid}
            {xAxis}
            {yAxis}
            <Tooltip contentStyle={tooltipStyle} formatter={fmt as any} />
            {legend}
            {ref}
            {series.map((s, i) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={colorOf(i, s)}
                strokeWidth={s.dashed ? 2 : 3}
                strokeDasharray={s.dashed ? '4 4' : undefined}
                dot={{ r: 3 }}
              >
                {prefs.labels && <LabelList dataKey={s.key} position="top" formatter={fmt as any} style={{ fontSize: 10, fill: axisColor }} />}
              </Line>
            ))}
          </LineChart>
        </ResponsiveContainer>
      );
    }
    if (type === 'area') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={margin}>
            {grid}
            {xAxis}
            {yAxis}
            <Tooltip contentStyle={tooltipStyle} formatter={fmt as any} />
            {legend}
            {ref}
            {series.map((s, i) => (
              <Area key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={colorOf(i, s)} fill={colorOf(i, s)} fillOpacity={0.2} strokeWidth={2}>
                {prefs.labels && <LabelList dataKey={s.key} position="top" formatter={fmt as any} style={{ fontSize: 10, fill: axisColor }} />}
              </Area>
            ))}
          </AreaChart>
        </ResponsiveContainer>
      );
    }
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={margin}>
          {grid}
          {xAxis}
          {yAxis}
          <Tooltip contentStyle={tooltipStyle} formatter={fmt as any} />
          {legend}
          {ref}
          {series.map((s, i) => (
            <Bar key={s.key} dataKey={s.key} name={s.name} fill={colorOf(i, s)} radius={[4, 4, 0, 0]}>
              {prefs.labels && <LabelList dataKey={s.key} position="top" formatter={fmt as any} style={{ fontSize: 10, fill: axisColor }} />}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const btn = (active: boolean) =>
    `p-1 rounded-md transition-colors cursor-pointer ${
      active
        ? dark
          ? 'bg-slate-700 text-white'
          : 'bg-white text-indigo-700 shadow-2xs'
        : dark
          ? 'text-slate-400 hover:text-white'
          : 'text-slate-500 hover:text-slate-800'
    }`;
  const selectCls = `text-[11px] px-1.5 py-1 rounded-md border cursor-pointer ${
    dark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
  }`;

  return (
    <div className="w-full min-w-0">
      <div className="no-print flex items-center justify-end gap-1.5 flex-wrap mb-1.5">
        <div className={`flex items-center gap-0.5 p-0.5 rounded-lg border ${dark ? 'bg-slate-800/70 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
          {allowedTypes.map((t) => {
            const Icon = TYPE_META[t].icon;
            return (
              <button key={t} type="button" title={TYPE_META[t].label} onClick={() => setPrefs({ type: t })} className={btn(type === t)}>
                <Icon className={`h-3.5 w-3.5 ${t === 'barH' ? 'rotate-90' : ''}`} />
              </button>
            );
          })}
        </div>
        <button type="button" title="Mais opções do gráfico" onClick={() => setShowOptions((v) => !v)} className={btn(showOptions)}>
          <SlidersHorizontal className="h-3.5 w-3.5" />
        </button>
        <button type="button" title="Exportar os dados do gráfico (CSV/Excel)" onClick={exportCsv} className={btn(false)}>
          <Download className="h-3.5 w-3.5" />
        </button>
      </div>
      {showOptions && (
        <div className={`no-print flex flex-wrap items-center gap-2 mb-2 p-2 rounded-lg border text-[11px] ${dark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
          <label className="flex items-center gap-1">
            Ordem
            <select className={selectCls} value={prefs.sort} onChange={(e) => setPrefs({ sort: e.target.value as SortMode })}>
              <option value="original">Original</option>
              <option value="desc">Maior → menor</option>
              <option value="asc">Menor → maior</option>
              <option value="az">A → Z</option>
            </select>
          </label>
          <label className="flex items-center gap-1">
            Itens
            <select className={selectCls} value={prefs.limit} onChange={(e) => setPrefs({ limit: Number(e.target.value) })}>
              <option value={0}>Todos</option>
              <option value={5}>5 primeiros</option>
              <option value={10}>10 primeiros</option>
              <option value={20}>20 primeiros</option>
            </select>
          </label>
          <label className="flex items-center gap-1">
            Cores
            <select className={selectCls} value={prefs.palette} onChange={(e) => setPrefs({ palette: e.target.value })}>
              {Object.keys(FLEX_PALETTES).map((p) => (
                <option key={p} value={p}>
                  {p.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input type="checkbox" checked={prefs.labels} onChange={(e) => setPrefs({ labels: e.target.checked })} /> Valores
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input type="checkbox" checked={prefs.grid} onChange={(e) => setPrefs({ grid: e.target.checked })} /> Grade
          </label>
        </div>
      )}
      <div style={{ height }} className="w-full">
        {renderChart()}
      </div>
    </div>
  );
};

export default FlexChart;
