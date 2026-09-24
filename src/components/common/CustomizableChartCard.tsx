import React, { useState, useMemo, useRef } from 'react';
import {
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Activity,
  Sliders,
  Palette,
  Maximize2,
  Printer,
  FileSpreadsheet,
  BarChart2,
  Sparkles,
  TrendingUp,
  Target,
  Award,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
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
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  LabelList,
} from 'recharts';
import { ChartType, ColorPaletteKey, ChartDataItem } from './CustomizableChartModal';
import { triggerPrint } from '../../utils/printHelper';
import { arrangeChartData, downloadCsv } from './FlexChart';
import {
  InteractiveChartTooltip,
  DynamicInteractiveLegend,
  getScalableXAxisProps,
  getScalableYAxisProps,
  getScalableGridProps,
} from './RechartsThemeHelper';

interface CustomizableChartCardProps {
  title: string;
  subtitle?: string;
  data: ChartDataItem[];
  defaultChartType?: ChartType;
  defaultPalette?: ColorPaletteKey;
  valueLabel?: string;
  secondaryValueLabel?: string;
  unit?: string;
  benchmarkValue?: number;
  benchmarkLabel?: string;
  onOpenFullCustomizer?: () => void;
  height?: number;
}

const PALETTE_COLORS: Record<ColorPaletteKey, string[]> = {
  INDIGO: ['#4f46e5', '#6366f1', '#818cf8', '#38bdf8', '#0ea5e9', '#2563eb', '#1d4ed8', '#7c3aed'],
  EMERALD: ['#059669', '#10b981', '#34d399', '#0d9488', '#14b8a6', '#047857', '#84cc16', '#65a30d'],
  OCEAN: ['#0284c7', '#0ea5e9', '#38bdf8', '#06b6d4', '#22d3ee', '#2563eb', '#60a5fa', '#3b82f6'],
  SUNSET: ['#ea580c', '#f97316', '#fb923c', '#e11d48', '#f43f5e', '#d97706', '#f59e0b', '#be123c'],
  TRAFFIC_LIGHT: ['#10b981', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'],
  PURPLE_PINK: ['#9333ea', '#c026d3', '#db2777', '#7c3aed', '#e879f9', '#f472b6', '#a21caf', '#be185d'],
  MONOCHROME: ['#0f172a', '#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0'],
};

// Rich Custom Tooltip Component forwarding to InteractiveChartTooltip
const CustomChartTooltip: React.FC<{
  active?: boolean;
  payload?: any[];
  label?: string;
  unit?: string;
  valueLabel?: string;
  secondaryValueLabel?: string;
  benchmarkValue?: number;
  benchmarkLabel?: string;
}> = (props) => {
  return <InteractiveChartTooltip {...props} />;
};

export const CustomizableChartCard: React.FC<CustomizableChartCardProps> = ({
  title,
  subtitle,
  data: rawData,
  defaultChartType = 'BAR_VERTICAL',
  defaultPalette = 'INDIGO',
  valueLabel = 'Rendimento',
  secondaryValueLabel = 'Meta / Referência',
  unit = '%',
  benchmarkValue,
  benchmarkLabel,
  onOpenFullCustomizer,
  height = 320,
}) => {
  // Preferências deste gráfico (modelo, cores, ordem, itens) ficam gravadas neste computador.
  const prefsKey = `sucessoedu_chartcard_${title}`;
  const savedPrefs = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(prefsKey) || '{}') || {};
    } catch {
      return {};
    }
  }, [prefsKey]);
  const [chartType, setChartTypeState] = useState<ChartType>(savedPrefs.chartType || defaultChartType);
  const [palette, setPaletteState] = useState<ColorPaletteKey>(savedPrefs.palette || defaultPalette);
  const [showDataLabels, setShowDataLabelsState] = useState<boolean>(savedPrefs.showDataLabels ?? true);
  const [showGrid, setShowGridState] = useState<boolean>(savedPrefs.showGrid ?? true);
  const [sortMode, setSortModeState] = useState<'original' | 'desc' | 'asc' | 'az'>(savedPrefs.sortMode || 'original');
  const [itemLimit, setItemLimitState] = useState<number>(Number(savedPrefs.itemLimit) || 0);
  const [showOptions, setShowOptions] = useState(false);
  const persist = (patch: Record<string, any>) => {
    try {
      const cur = JSON.parse(localStorage.getItem(prefsKey) || '{}') || {};
      localStorage.setItem(prefsKey, JSON.stringify({ ...cur, ...patch }));
    } catch {
      /* sem armazenamento: vale só nesta sessão */
    }
  };
  const setChartType = (v: ChartType) => { setChartTypeState(v); persist({ chartType: v }); };
  const setPalette = (v: ColorPaletteKey) => { setPaletteState(v); persist({ palette: v }); };
  const setShowDataLabels = (v: boolean) => { setShowDataLabelsState(v); persist({ showDataLabels: v }); };
  const setShowGrid = (v: boolean) => { setShowGridState(v); persist({ showGrid: v }); };
  const setSortMode = (v: 'original' | 'desc' | 'asc' | 'az') => { setSortModeState(v); persist({ sortMode: v }); };
  const setItemLimit = (v: number) => { setItemLimitState(v); persist({ itemLimit: v }); };

  const data = useMemo(() => arrangeChartData(rawData || [], 'value', 'name', sortMode, itemLimit), [rawData, sortMode, itemLimit]);

  const handleExportCsv = () =>
    downloadCsv(title, data, [
      { key: 'name', label: 'Item' },
      { key: 'value', label: valueLabel },
      ...(data.some((d) => d.secondaryValue !== undefined) ? [{ key: 'secondaryValue', label: secondaryValueLabel }] : []),
    ]);
  const [hiddenSeries, setHiddenSeries] = useState<string[]>([]);

  const handleToggleSeries = (key: string) => {
    setHiddenSeries((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const cardPrintRef = useRef<HTMLDivElement>(null);
  const colors = PALETTE_COLORS[palette] || PALETTE_COLORS.INDIGO;

  // Filtered data for Pie/Donut when categories are toggled via legend
  const visibleData = useMemo(() => {
    if (chartType === 'PIE' || chartType === 'DONUT') {
      return data.filter((d) => !hiddenSeries.includes(d.name));
    }
    return data;
  }, [data, hiddenSeries, chartType]);

  // Check if dataset has secondary values for comparative dual-series rendering
  const hasSecondaryValues = useMemo(() => {
    return data.some((d) => d.secondaryValue !== undefined && d.secondaryValue !== null);
  }, [data]);

  // Compute key summary statistics for instant comprehension
  const summaryStats = useMemo(() => {
    if (!data || data.length === 0) return { avg: 0, max: 0, min: 0, count: 0, total: 0 };
    const values = data.map((d) => d.value).filter((v) => !isNaN(v));
    const total = values.reduce((a, b) => a + b, 0);
    const avg = values.length > 0 ? total / values.length : 0;
    const max = values.length > 0 ? Math.max(...values) : 0;
    const min = values.length > 0 ? Math.min(...values) : 0;
    const aboveBenchmark = benchmarkValue !== undefined ? values.filter((v) => v >= benchmarkValue).length : 0;
    return { avg, max, min, count: values.length, total, aboveBenchmark };
  }, [data, benchmarkValue]);

  const handlePrintCard = () => {
    if (cardPrintRef.current) {
      triggerPrint(cardPrintRef.current, {
        title,
        documentCategory: 'GRÁFICO ANALÍTICO OFICIAL',
      });
    }
  };

  const gradientId = useMemo(() => `area-grad-${Math.random().toString(36).substr(2, 9)}`, []);

  return (
    <div
      ref={cardPrintRef}
      className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3.5 hover:shadow-xs transition-all relative overflow-hidden min-w-0"
    >
      {/* Top Header with Title, Insights & Quick Customizer Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="h-2 w-2 rounded-full bg-indigo-600 shrink-0" />
            <h3 className="text-sm font-black text-slate-900 tracking-tight truncate">
              {title}
            </h3>
            {benchmarkValue !== undefined && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                <Target className="h-3 w-3" />
                Meta: {benchmarkValue} {unit}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed truncate">{subtitle}</p>}
        </div>

        {/* Action Controls & Interactive Selectors (Hidden when printing) */}
        <div className="no-print flex items-center gap-1.5 flex-wrap shrink-0">
          {/* Chart Type Quick Selector */}
          <div className="flex items-center gap-0.5 bg-slate-100 p-1 rounded-xl border border-slate-200/60">
            <button
              type="button"
              onClick={() => setChartType('BAR_VERTICAL')}
              title="Colunas Verticais"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                chartType === 'BAR_VERTICAL' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setChartType('BAR_HORIZONTAL')}
              title="Barras Horizontais"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                chartType === 'BAR_HORIZONTAL' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart2 className="h-3.5 w-3.5 rotate-90" />
            </button>

            <button
              type="button"
              onClick={() => setChartType('LINE')}
              title="Linhas"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                chartType === 'LINE' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LineChartIcon className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setChartType('AREA')}
              title="Área com Gradiente"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                chartType === 'AREA' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setChartType('DONUT')}
              title="Donut / Pizza"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                chartType === 'DONUT' || chartType === 'PIE' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <PieChartIcon className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setChartType('RADAR')}
              title="Radar Multidimensional"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                chartType === 'RADAR' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Quick Palette Selector */}
          <select
            value={palette}
            onChange={(e) => setPalette(e.target.value as ColorPaletteKey)}
            className="text-[11px] font-bold px-2 py-1 rounded-xl border border-slate-200 bg-white text-slate-700 cursor-pointer shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden max-w-[120px] sm:max-w-none truncate"
            title="Escolher Paleta de Cores"
          >
            <option value="INDIGO">🎨 Índigo</option>
            <option value="EMERALD">🌿 Esmeralda</option>
            <option value="OCEAN">🌊 Oceano</option>
            <option value="SUNSET">🌅 Sunset</option>
            <option value="TRAFFIC_LIGHT">🎯 Semáforo</option>
            <option value="PURPLE_PINK">🔮 Púrpura</option>
            <option value="MONOCHROME">🖤 Grafite</option>
          </select>

          {/* Filtros do gráfico: ordem, itens, rótulos, grade */}
          <button
            type="button"
            onClick={() => setShowOptions((v) => !v)}
            title="Filtros e opções do gráfico"
            className={`p-1.5 rounded-xl transition-colors cursor-pointer shrink-0 ${showOptions ? 'bg-indigo-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
          >
            <Sliders className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            title="Exportar dados do gráfico (CSV / Excel)"
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
          </button>

          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrintCard}
            title="Imprimir este gráfico oficial"
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <Printer className="h-3.5 w-3.5" />
          </button>

          {/* Full Customizer Modal Trigger */}
          {onOpenFullCustomizer && (
            <button
              type="button"
              onClick={onOpenFullCustomizer}
              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0"
              title="Abrir estúdio de personalização completo"
            >
              <Sliders className="h-3.5 w-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Personalizar</span>
            </button>
          )}
        </div>
      </div>

      {showOptions && (
        <div className="no-print flex flex-wrap items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
          <label className="flex items-center gap-1.5">
            Ordem
            <select value={sortMode} onChange={(e) => setSortMode(e.target.value as any)} className="px-1.5 py-1 rounded-lg border border-slate-200 bg-white cursor-pointer">
              <option value="original">Original</option>
              <option value="desc">Maior → menor</option>
              <option value="asc">Menor → maior</option>
              <option value="az">A → Z</option>
            </select>
          </label>
          <label className="flex items-center gap-1.5">
            Itens
            <select value={itemLimit} onChange={(e) => setItemLimit(Number(e.target.value))} className="px-1.5 py-1 rounded-lg border border-slate-200 bg-white cursor-pointer">
              <option value={0}>Todos</option>
              <option value={5}>5 primeiros</option>
              <option value={10}>10 primeiros</option>
              <option value={20}>20 primeiros</option>
            </select>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={showDataLabels} onChange={(e) => setShowDataLabels(e.target.checked)} /> Mostrar valores
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} /> Linhas de grade
          </label>
          <span className="text-slate-400">As escolhas ficam salvas neste computador.</span>
        </div>
      )}

      {/* Summary Stat Pills Bar for Instant Context & High Clarity */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs min-w-0">
        <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between min-w-0">
          <span className="text-slate-500 text-[10px] sm:text-[11px] font-medium truncate">Média Global:</span>
          <span className="font-mono font-black text-slate-900 shrink-0 ml-1">
            {summaryStats.avg.toFixed(1)} {unit}
          </span>
        </div>
        <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between min-w-0">
          <span className="text-slate-500 text-[10px] sm:text-[11px] font-medium truncate">Pico / Máx:</span>
          <span className="font-mono font-black text-emerald-600 shrink-0 ml-1">
            {summaryStats.max.toFixed(1)} {unit}
          </span>
        </div>
        <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between min-w-0">
          <span className="text-slate-500 text-[10px] sm:text-[11px] font-medium truncate">Menor Reg.:</span>
          <span className="font-mono font-black text-slate-700 shrink-0 ml-1">
            {summaryStats.min.toFixed(1)} {unit}
          </span>
        </div>
        <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between min-w-0">
          <span className="text-slate-500 text-[10px] sm:text-[11px] font-medium truncate">
            {benchmarkValue !== undefined ? 'Na Meta:' : 'Total:'}
          </span>
          <span className="font-mono font-black text-indigo-600 shrink-0 ml-1">
            {benchmarkValue !== undefined
              ? `${summaryStats.aboveBenchmark}/${summaryStats.count}`
              : `${summaryStats.count}`}
          </span>
        </div>
      </div>

      {/* Render Chart Stage */}
      <div style={{ height }} className="w-full pt-1 relative min-w-0 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'BAR_VERTICAL' ? (
            <BarChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 44 }}>
              {showGrid && <CartesianGrid {...getScalableGridProps('LIGHT', false)} />}
              <XAxis {...getScalableXAxisProps({ angle: -20, height: 44, maxLength: 22 })} />
              <YAxis {...getScalableYAxisProps({ unit })} />
              <Tooltip
                content={
                  <CustomChartTooltip
                    unit={unit}
                    valueLabel={valueLabel}
                    secondaryValueLabel={secondaryValueLabel}
                    benchmarkValue={benchmarkValue}
                    benchmarkLabel={benchmarkLabel}
                  />
                }
              />
              {benchmarkValue !== undefined && (
                <ReferenceLine
                  y={benchmarkValue}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: benchmarkLabel || `Meta (${benchmarkValue}${unit})`,
                    fill: '#dc2626',
                    fontSize: 10,
                    fontWeight: 'bold',
                    position: 'top',
                  }}
                />
              )}
              {hasSecondaryValues && (
                <Bar
                  dataKey="secondaryValue"
                  name={secondaryValueLabel}
                  fill="#94a3b8"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={45}
                  hide={hiddenSeries.includes('secondaryValue')}
                />
              )}
              <Bar
                dataKey="value"
                name={valueLabel}
                radius={[6, 6, 0, 0]}
                maxBarSize={45}
                hide={hiddenSeries.includes('value')}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || colors[index % colors.length]}
                  />
                ))}
                {showDataLabels && (
                  <LabelList
                    dataKey="value"
                    position="top"
                    formatter={(v: any) => `${v}${unit}`}
                    style={{ fontSize: 10, fontWeight: 800, fill: '#1e293b' }}
                  />
                )}
              </Bar>
              {hasSecondaryValues && (
                <Legend
                  verticalAlign="top"
                  height={36}
                  content={(props) => (
                    <DynamicInteractiveLegend
                      payload={props.payload}
                      hiddenKeys={hiddenSeries}
                      onToggleKey={handleToggleSeries}
                    />
                  )}
                />
              )}
            </BarChart>
          ) : chartType === 'BAR_HORIZONTAL' ? (
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 10, right: 45, left: 10, bottom: 10 }}
            >
              {showGrid && <CartesianGrid {...getScalableGridProps('LIGHT', true)} />}
              <XAxis
                type="number"
                unit={unit === '%' ? '%' : ''}
                tick={{ fontSize: 10.5, fill: '#475569', fontWeight: 600 }}
                tickLine={{ stroke: '#94a3b8' }}
                axisLine={{ stroke: '#cbd5e1', strokeWidth: 1.5 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={135}
                tick={{ fontSize: 10.5, fill: '#334155', fontWeight: 600 }}
                tickLine={{ stroke: '#94a3b8' }}
                axisLine={{ stroke: '#cbd5e1', strokeWidth: 1.5 }}
                tickFormatter={(val: string) =>
                  val.length > 20 ? val.substring(0, 19) + '…' : val
                }
              />
              <Tooltip
                content={
                  <CustomChartTooltip
                    unit={unit}
                    valueLabel={valueLabel}
                    secondaryValueLabel={secondaryValueLabel}
                    benchmarkValue={benchmarkValue}
                    benchmarkLabel={benchmarkLabel}
                  />
                }
              />
              {benchmarkValue !== undefined && (
                <ReferenceLine
                  x={benchmarkValue}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: benchmarkLabel || `Meta (${benchmarkValue}${unit})`,
                    fill: '#dc2626',
                    fontSize: 10,
                    fontWeight: 'bold',
                  }}
                />
              )}
              {hasSecondaryValues && (
                <Bar
                  dataKey="secondaryValue"
                  name={secondaryValueLabel}
                  fill="#94a3b8"
                  radius={[0, 6, 6, 0]}
                  maxBarSize={24}
                  hide={hiddenSeries.includes('secondaryValue')}
                />
              )}
              <Bar
                dataKey="value"
                name={valueLabel}
                radius={[0, 6, 6, 0]}
                maxBarSize={24}
                hide={hiddenSeries.includes('value')}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || colors[index % colors.length]}
                  />
                ))}
                {showDataLabels && (
                  <LabelList
                    dataKey="value"
                    position="right"
                    formatter={(v: any) => `${v}${unit}`}
                    style={{ fontSize: 10, fontWeight: 800, fill: '#1e293b' }}
                  />
                )}
              </Bar>
              {hasSecondaryValues && (
                <Legend
                  verticalAlign="top"
                  height={36}
                  content={(props) => (
                    <DynamicInteractiveLegend
                      payload={props.payload}
                      hiddenKeys={hiddenSeries}
                      onToggleKey={handleToggleSeries}
                    />
                  )}
                />
              )}
            </BarChart>
          ) : chartType === 'LINE' ? (
            <LineChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 44 }}>
              {showGrid && <CartesianGrid {...getScalableGridProps('LIGHT', false)} />}
              <XAxis {...getScalableXAxisProps({ angle: -20, height: 44, maxLength: 22 })} />
              <YAxis {...getScalableYAxisProps({ unit })} />
              <Tooltip
                content={
                  <CustomChartTooltip
                    unit={unit}
                    valueLabel={valueLabel}
                    secondaryValueLabel={secondaryValueLabel}
                    benchmarkValue={benchmarkValue}
                    benchmarkLabel={benchmarkLabel}
                  />
                }
              />
              {benchmarkValue !== undefined && (
                <ReferenceLine
                  y={benchmarkValue}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: benchmarkLabel || `Meta (${benchmarkValue}${unit})`,
                    fill: '#dc2626',
                    fontSize: 10,
                    fontWeight: 'bold',
                  }}
                />
              )}
              {hasSecondaryValues && (
                <Line
                  type="monotone"
                  dataKey="secondaryValue"
                  name={secondaryValueLabel}
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#94a3b8' }}
                  hide={hiddenSeries.includes('secondaryValue')}
                />
              )}
              <Line
                type="monotone"
                dataKey="value"
                name={valueLabel}
                stroke={colors[0]}
                strokeWidth={3}
                dot={{ r: 4, fill: colors[0], strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: colors[0] }}
                hide={hiddenSeries.includes('value')}
              >
                {showDataLabels && (
                  <LabelList
                    dataKey="value"
                    position="top"
                    formatter={(v: any) => `${v}${unit}`}
                    style={{ fontSize: 10, fontWeight: 800, fill: colors[0] }}
                  />
                )}
              </Line>
              {hasSecondaryValues && (
                <Legend
                  verticalAlign="top"
                  height={36}
                  content={(props) => (
                    <DynamicInteractiveLegend
                      payload={props.payload}
                      hiddenKeys={hiddenSeries}
                      onToggleKey={handleToggleSeries}
                    />
                  )}
                />
              )}
            </LineChart>
          ) : chartType === 'AREA' ? (
            <AreaChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 44 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[0]} stopOpacity={0.45} />
                  <stop offset="95%" stopColor={colors[0]} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              {showGrid && <CartesianGrid {...getScalableGridProps('LIGHT', false)} />}
              <XAxis {...getScalableXAxisProps({ angle: -20, height: 44, maxLength: 22 })} />
              <YAxis {...getScalableYAxisProps({ unit })} />
              <Tooltip
                content={
                  <CustomChartTooltip
                    unit={unit}
                    valueLabel={valueLabel}
                    secondaryValueLabel={secondaryValueLabel}
                    benchmarkValue={benchmarkValue}
                    benchmarkLabel={benchmarkLabel}
                  />
                }
              />
              {benchmarkValue !== undefined && (
                <ReferenceLine
                  y={benchmarkValue}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: benchmarkLabel || `Meta (${benchmarkValue}${unit})`,
                    fill: '#dc2626',
                    fontSize: 10,
                    fontWeight: 'bold',
                  }}
                />
              )}
              {hasSecondaryValues && (
                <Area
                  type="monotone"
                  dataKey="secondaryValue"
                  name={secondaryValueLabel}
                  stroke="#94a3b8"
                  strokeDasharray="3 3"
                  fill="none"
                  strokeWidth={2}
                  hide={hiddenSeries.includes('secondaryValue')}
                />
              )}
              <Area
                type="monotone"
                dataKey="value"
                name={valueLabel}
                stroke={colors[0]}
                strokeWidth={3}
                fillOpacity={1}
                fill={`url(#${gradientId})`}
                hide={hiddenSeries.includes('value')}
              >
                {showDataLabels && (
                  <LabelList
                    dataKey="value"
                    position="top"
                    formatter={(v: any) => `${v}${unit}`}
                    style={{ fontSize: 10, fontWeight: 800, fill: colors[0] }}
                  />
                )}
              </Area>
              {hasSecondaryValues && (
                <Legend
                  verticalAlign="top"
                  height={36}
                  content={(props) => (
                    <DynamicInteractiveLegend
                      payload={props.payload}
                      hiddenKeys={hiddenSeries}
                      onToggleKey={handleToggleSeries}
                    />
                  )}
                />
              )}
            </AreaChart>
          ) : chartType === 'PIE' || chartType === 'DONUT' ? (
            <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <Tooltip
                content={
                  <CustomChartTooltip
                    unit={unit}
                    valueLabel={valueLabel}
                    secondaryValueLabel={secondaryValueLabel}
                    benchmarkValue={benchmarkValue}
                    benchmarkLabel={benchmarkLabel}
                  />
                }
              />
              <Pie
                data={visibleData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={chartType === 'DONUT' ? 52 : 0}
                outerRadius={88}
                paddingAngle={chartType === 'DONUT' ? 3 : 1}
                stroke="#ffffff"
                strokeWidth={2}
              >
                {visibleData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || colors[index % colors.length]}
                  />
                ))}
                {showDataLabels && (
                  <LabelList
                    dataKey="value"
                    position="inside"
                    formatter={(v: any) => (Number(v) > 0 ? `${v}` : '')}
                    style={{ fontSize: 10, fontWeight: 800, fill: '#ffffff' }}
                  />
                )}
              </Pie>
            </PieChart>
          ) : (
            <RadarChart cx="50%" cy="50%" outerRadius={85} data={data}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 9.5, fill: '#334155', fontWeight: 600 }} />
              <PolarRadiusAxis angle={30} stroke="#cbd5e1" />
              <Tooltip
                content={
                  <CustomChartTooltip
                    unit={unit}
                    valueLabel={valueLabel}
                    secondaryValueLabel={secondaryValueLabel}
                    benchmarkValue={benchmarkValue}
                    benchmarkLabel={benchmarkLabel}
                  />
                }
              />
              <Radar
                name={valueLabel}
                dataKey="value"
                stroke={colors[0]}
                fill={colors[0]}
                fillOpacity={0.4}
                strokeWidth={2}
                hide={hiddenSeries.includes('value')}
              />
              {hasSecondaryValues && (
                <Radar
                  name={secondaryValueLabel}
                  dataKey="secondaryValue"
                  stroke="#94a3b8"
                  fill="#94a3b8"
                  fillOpacity={0.2}
                  strokeWidth={1.5}
                  hide={hiddenSeries.includes('secondaryValue')}
                />
              )}
              {hasSecondaryValues && (
                <Legend
                  verticalAlign="bottom"
                  height={32}
                  content={(props) => (
                    <DynamicInteractiveLegend
                      payload={props.payload}
                      hiddenKeys={hiddenSeries}
                      onToggleKey={handleToggleSeries}
                    />
                  )}
                />
              )}
            </RadarChart>
          )}
        </ResponsiveContainer>

        {/* Center overlay badge for DONUT */}
        {chartType === 'DONUT' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Total</span>
            <span className="text-sm sm:text-base font-black text-slate-900 font-mono leading-none">
              {summaryStats.total.toFixed(0)}{unit === '%' ? '%' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Structured & Legible Framed Legend Panel for PIE and DONUT charts */}
      {(chartType === 'PIE' || chartType === 'DONUT') && (
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <span>Enquadramento de Legenda</span>
            <span>{data.length} Categorias</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {data.map((item, idx) => {
              const itemColor = item.color || colors[idx % colors.length];
              const totalVal = summaryStats.total || 1;
              const percent = ((item.value / totalVal) * 100).toFixed(1);
              const isHidden = hiddenSeries.includes(item.name);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleToggleSeries(item.name)}
                  className={`flex items-center justify-between gap-2 p-2 rounded-xl transition-all text-xs cursor-pointer border text-left ${
                    isHidden
                      ? 'bg-slate-100/70 border-dashed border-slate-300 opacity-50'
                      : 'bg-slate-50 hover:bg-indigo-50/50 border-slate-200/80 hover:border-indigo-200'
                  }`}
                  title={isHidden ? `Reativar ${item.name}` : `Ocultar ${item.name}`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className={`h-3 w-3 rounded-md shrink-0 border border-black/10 shadow-2xs ${
                        isHidden ? 'grayscale' : ''
                      }`}
                      style={{ backgroundColor: itemColor }}
                    />
                    <span
                      className={`font-semibold truncate ${
                        isHidden ? 'line-through text-slate-400' : 'text-slate-800'
                      }`}
                      title={item.name}
                    >
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono font-bold text-slate-900 text-xs px-1.5 py-0.5 rounded bg-white border border-slate-200 shadow-2xs">
                      {item.value} {unit}
                    </span>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/70 px-1.5 py-0.5 rounded">
                      {percent}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
