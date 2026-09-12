import React, { useState, useMemo, useRef } from 'react';
import {
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Activity,
  Sliders,
  Palette,
  Layers,
  Download,
  Printer,
  X,
  Check,
  TrendingUp,
  Sparkles,
  ArrowUpDown,
  FileSpreadsheet,
  Eye,
  Maximize2,
  Settings2,
  HelpCircle,
  Share2,
  Copy,
  Table as TableIcon,
  BarChart2,
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
import { SchoolSettings } from '../../types';
import { triggerPrint } from '../../utils/printHelper';
import {
  InteractiveChartTooltip,
  DynamicInteractiveLegend,
  getScalableXAxisProps,
  getScalableYAxisProps,
  getScalableGridProps,
} from './RechartsThemeHelper';

export type ChartType =
  | 'BAR_VERTICAL'
  | 'BAR_HORIZONTAL'
  | 'LINE'
  | 'AREA'
  | 'PIE'
  | 'DONUT'
  | 'RADAR'
  | 'COMPOSED'
  | 'STACKED_BAR';

export type ColorPaletteKey =
  | 'INDIGO'
  | 'EMERALD'
  | 'OCEAN'
  | 'SUNSET'
  | 'TRAFFIC_LIGHT'
  | 'PURPLE_PINK'
  | 'MONOCHROME';

export interface ChartDataItem {
  name: string;
  value: number;
  secondaryValue?: number;
  category?: string;
  color?: string;
  [key: string]: any;
}

export interface ChartDatasetOption {
  id: string;
  title: string;
  subtitle?: string;
  data: ChartDataItem[];
  valueLabel?: string;
  secondaryValueLabel?: string;
  unit?: string;
  defaultChartType?: ChartType;
  benchmarkValue?: number;
  benchmarkLabel?: string;
}

interface CustomizableChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  datasets?: ChartDatasetOption[];
  availableDatasets?: ChartDatasetOption[];
  initialDatasetId?: string;
  initialChartType?: ChartType;
  settings?: SchoolSettings;
  documentCategory?: string;
}

const DEFAULT_FALLBACK_DATASETS: ChartDatasetOption[] = [
  {
    id: 'dropout_reasons',
    title: 'Motivos de Evasão Escolar (Padrão MEC / INEP)',
    subtitle: 'Distribuição nominal e percentual de estudantes evadidos por fator determinante',
    unit: 'alunos',
    valueLabel: 'Qtd. Alunos',
    defaultChartType: 'BAR_HORIZONTAL',
    benchmarkValue: 5,
    benchmarkLabel: 'Alerta Municipal (5 alunos)',
    data: [
      { name: 'Mudança de Endereço / Município', value: 14, category: 'Territorial' },
      { name: 'Dificuldade de Transporte Escolar', value: 8, category: 'Acesso' },
      { name: 'Trabalho Infantil / Apoio Familiar', value: 6, category: 'Socioeconômico' },
      { name: 'Desinteresse / Desmotivação', value: 5, category: 'Pedagógico' },
      { name: 'Gravidez na Adolescência', value: 3, category: 'Saúde/Social' },
      { name: 'Doença / Problemas de Saúde', value: 2, category: 'Saúde' },
      { name: 'Vulnerabilidade Social / CRAS', value: 4, category: 'Proteção' },
    ],
  },
  {
    id: 'class_performance',
    title: 'Rendimento Médio por Turma',
    subtitle: 'Média de aproveitamento e proficiência geral das turmas ativas',
    unit: 'pts',
    valueLabel: 'Média de Notas',
    defaultChartType: 'BAR_VERTICAL',
    benchmarkValue: 7.0,
    benchmarkLabel: 'Meta Pedagógica (7.0 pts)',
    data: [
      { name: '1º Ano A', value: 8.2, secondaryValue: 7.0 },
      { name: '1º Ano B', value: 7.8, secondaryValue: 7.0 },
      { name: '2º Ano A', value: 8.5, secondaryValue: 7.0 },
      { name: '2º Ano B', value: 6.9, secondaryValue: 7.0 },
      { name: '3º Ano A', value: 7.4, secondaryValue: 7.0 },
      { name: '4º Ano A', value: 8.0, secondaryValue: 7.0 },
      { name: '5º Ano A', value: 8.7, secondaryValue: 7.0 },
    ],
  },
  {
    id: 'attendance_rate',
    title: 'Taxa de Presença e Frequência Escolar',
    subtitle: 'Percentual de presença apurado no diário eletrônico por ano/série',
    unit: '%',
    valueLabel: 'Taxa de Frequência',
    defaultChartType: 'AREA',
    benchmarkValue: 75,
    benchmarkLabel: 'Mínimo LDB (75%)',
    data: [
      { name: '1º Ano', value: 94.2 },
      { name: '2º Ano', value: 92.5 },
      { name: '3º Ano', value: 89.8 },
      { name: '4º Ano', value: 91.0 },
      { name: '5º Ano', value: 87.5 },
      { name: '6º Ano', value: 84.2 },
      { name: '7º Ano', value: 86.0 },
      { name: '8º Ano', value: 82.5 },
      { name: '9º Ano', value: 85.3 },
    ],
  },
];

const COLOR_PALETTES: Record<ColorPaletteKey, { name: string; colors: string[]; bgBadge: string }> = {
  INDIGO: {
    name: 'Índigo & Violeta (Oficial)',
    colors: ['#4f46e5', '#7c3aed', '#a855f7', '#6366f1', '#818cf8', '#c084fc', '#4338ca', '#3b82f6'],
    bgBadge: 'from-indigo-600 to-purple-600',
  },
  EMERALD: {
    name: 'Esmeralda & Sucesso',
    colors: ['#10b981', '#059669', '#34d399', '#047857', '#6ee7b7', '#14b8a6', '#0d9488', '#84cc16'],
    bgBadge: 'from-emerald-600 to-teal-600',
  },
  OCEAN: {
    name: 'Azul Oceano & Ciano',
    colors: ['#0284c7', '#0ea5e9', '#38bdf8', '#0369a1', '#06b6d4', '#22d3ee', '#1d4ed8', '#60a5fa'],
    bgBadge: 'from-blue-600 to-cyan-600',
  },
  SUNSET: {
    name: 'Pôr do Sol & Coral',
    colors: ['#f97316', '#ea580c', '#fb923c', '#e11d48', '#f43f5e', '#fbbf24', '#d97706', '#be123c'],
    bgBadge: 'from-orange-500 to-rose-600',
  },
  TRAFFIC_LIGHT: {
    name: 'Semáforo Pedagógico (Proficiência)',
    colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'],
    bgBadge: 'from-emerald-500 via-amber-500 to-rose-500',
  },
  PURPLE_PINK: {
    name: 'Roxo Criativo & Pink',
    colors: ['#9333ea', '#c026d3', '#db2777', '#7c3aed', '#e879f9', '#f472b6', '#a21caf', '#be185d'],
    bgBadge: 'from-purple-600 to-pink-600',
  },
  MONOCHROME: {
    name: 'Monocromático Sofisticado',
    colors: ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#0f172a', '#e2e8f0'],
    bgBadge: 'from-slate-700 to-slate-900',
  },
};

export const CustomizableChartModal: React.FC<CustomizableChartModalProps> = ({
  isOpen,
  onClose,
  title = 'Gerador e Personalizador de Gráficos',
  subtitle = 'Escolha o tipo de gráfico, temas de cores, métricas e gere impressões oficiais e exportações',
  datasets = [],
  availableDatasets = [],
  initialDatasetId,
  initialChartType = 'BAR_VERTICAL',
  settings,
  documentCategory = 'RELATÓRIO ESTATÍSTICO PEDAGÓGICO',
}) => {
  // Combina datasets fornecidos ou usa conjunto padrão completo
  const activeDatasets = useMemo(() => {
    if (datasets && datasets.length > 0) return datasets;
    if (availableDatasets && availableDatasets.length > 0) return availableDatasets;
    return DEFAULT_FALLBACK_DATASETS;
  }, [datasets, availableDatasets]);

  // Active dataset
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(
    initialDatasetId || activeDatasets[0]?.id || ''
  );

  // Sincroniza dataset inicial quando abrir
  React.useEffect(() => {
    if (initialDatasetId) {
      setSelectedDatasetId(initialDatasetId);
      const found = activeDatasets.find((d) => d.id === initialDatasetId);
      if (found?.defaultChartType) {
        setChartType(found.defaultChartType);
      }
      if (found?.benchmarkValue !== undefined) {
        setBenchmarkValue(found.benchmarkValue);
      }
      if (found?.benchmarkLabel) {
        setBenchmarkLabel(found.benchmarkLabel);
      }
    } else if (activeDatasets.length > 0 && !selectedDatasetId) {
      setSelectedDatasetId(activeDatasets[0].id);
    }
  }, [initialDatasetId, activeDatasets]);

  // Active chart type
  const [chartType, setChartType] = useState<ChartType>(initialChartType);

  // Active Color Palette
  const [selectedPalette, setSelectedPalette] = useState<ColorPaletteKey>('INDIGO');

  // Custom visual options
  const [showDataLabels, setShowDataLabels] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showLegend, setShowLegend] = useState<boolean>(true);
  const [showBenchmarkLine, setShowBenchmarkLine] = useState<boolean>(true);
  const [benchmarkValue, setBenchmarkValue] = useState<number>(70);
  const [benchmarkLabel, setBenchmarkLabel] = useState<string>('Meta Municipal (70%)');
  const [sortOrder, setSortOrder] = useState<'ORIGINAL' | 'DESC' | 'ASC'>('DESC');
  const [dataLimit, setDataLimit] = useState<number>(0); // 0 = all
  const [customChartTitle, setCustomChartTitle] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'PREVIEW' | 'CUSTOMIZE' | 'DATA_TABLE'>('PREVIEW');
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);
  const [hiddenSeries, setHiddenSeries] = useState<string[]>([]);

  const handleToggleSeries = (key: string) => {
    setHiddenSeries((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Current dataset
  const currentDataset = useMemo(() => {
    return activeDatasets.find((d) => d.id === selectedDatasetId) || activeDatasets[0];
  }, [activeDatasets, selectedDatasetId]);

  // Sync dataset defaults if changed
  const unit = currentDataset?.unit || '%';
  const primaryLabel = currentDataset?.valueLabel || 'Rendimento / Valor';
  const secondaryLabel = currentDataset?.secondaryValueLabel || 'Meta / Referência';

  // Processed data according to sort order and limits
  const processedData = useMemo(() => {
    if (!currentDataset || !currentDataset.data) return [];
    let list = [...currentDataset.data];

    if (sortOrder === 'DESC') {
      list.sort((a, b) => b.value - a.value);
    } else if (sortOrder === 'ASC') {
      list.sort((a, b) => a.value - b.value);
    }

    if (dataLimit > 0) {
      list = list.slice(0, dataLimit);
    }

    return list;
  }, [currentDataset, sortOrder, dataLimit]);

  // Filtered dataset for Pie / Donut when toggling categories
  const visibleData = useMemo(() => {
    if (chartType === 'PIE' || chartType === 'DONUT') {
      return processedData.filter((d) => !hiddenSeries.includes(d.name));
    }
    return processedData;
  }, [processedData, hiddenSeries, chartType]);

  const paletteColors = COLOR_PALETTES[selectedPalette].colors;

  // KPI Calculations
  const stats = useMemo(() => {
    if (!processedData.length) {
      return { total: 0, avg: 0, max: 0, min: 0, topName: '—' };
    }
    const sum = processedData.reduce((acc, curr) => acc + curr.value, 0);
    const avg = Math.round((sum / processedData.length) * 10) / 10;
    const maxItem = [...processedData].sort((a, b) => b.value - a.value)[0];
    const minItem = [...processedData].sort((a, b) => a.value - b.value)[0];

    return {
      total: processedData.length,
      avg,
      max: maxItem.value,
      min: minItem.value,
      topName: maxItem.name,
      minName: minItem.name,
    };
  }, [processedData]);

  if (!isOpen) return null;

  const displayTitle = customChartTitle || currentDataset?.title || title;

  const handlePrint = () => {
    if (printAreaRef.current) {
      triggerPrint(printAreaRef.current, {
        title: `${displayTitle} - ${settings?.name || 'SucessoEdu'}`,
        schoolName: settings?.name,
        documentCategory,
      });
    } else {
      triggerPrint(null, {
        title: displayTitle,
      });
    }
  };

  const handleExportCSV = () => {
    if (!processedData.length) return;
    const headers = ['Posição', 'Item / Dimensão', `Valor (${unit})`, 'Meta / Referência'];
    const rows = processedData.map((d, index) => [
      index + 1,
      `"${d.name}"`,
      d.value,
      d.secondaryValue || benchmarkValue || '—',
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grafico_personalizado_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyTable = () => {
    if (!processedData.length) return;
    const text = processedData
      .map((d, i) => `${i + 1}. ${d.name}: ${d.value}${unit}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* ========================================================================= */}
        {/* MODAL HEADER */}
        {/* ========================================================================= */}
        <div className="no-print p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shrink-0">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-wider uppercase bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-md border border-indigo-400/20">
                  {documentCategory}
                </span>
                <span className="text-xs text-indigo-300 hidden sm:inline">• Gerador Universal</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white mt-0.5">
                {title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* QUICK CONTROLS BAR: DATASET SELECTION & VIEW SWITCH */}
        {/* ========================================================================= */}
        <div className="no-print p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Dataset Selector */}
          {activeDatasets.length > 1 ? (
            <div className="flex items-center gap-2 flex-1 min-w-[260px]">
              <span className="text-xs font-bold text-slate-600 shrink-0 flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-indigo-600" />
                Dados do Relatório:
              </span>
              <select
                value={selectedDatasetId}
                onChange={(e) => {
                  setSelectedDatasetId(e.target.value);
                  const found = activeDatasets.find((d) => d.id === e.target.value);
                  if (found?.defaultChartType) {
                    setChartType(found.defaultChartType);
                  }
                  if (found?.benchmarkValue) {
                    setBenchmarkValue(found.benchmarkValue);
                  }
                  if (found?.benchmarkLabel) {
                    setBenchmarkLabel(found.benchmarkLabel);
                  }
                }}
                className="w-full text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-white shadow-2xs focus:ring-2 focus:ring-indigo-500"
              >
                {activeDatasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    📊 {d.title} ({d.data.length} registros)
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>{currentDataset?.title || 'Dados do Relatório Atual'}</span>
            </div>
          )}

          {/* Sub Tabs */}
          <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('PREVIEW')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'PREVIEW'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Visualizar Gráfico</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('CUSTOMIZE')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'CUSTOMIZE'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Personalizar Gráfico</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('DATA_TABLE')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'DATA_TABLE'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Tabela ({processedData.length})</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CHART TYPE PICKER TOOLBAR (ALWAYS ACCESSIBLE) */}
        {/* ========================================================================= */}
        <div className="no-print px-5 py-3 bg-white border-b border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-thin">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Tipo de Gráfico:
          </span>

          {/* Barras Verticais */}
          <button
            type="button"
            onClick={() => setChartType('BAR_VERTICAL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              chartType === 'BAR_VERTICAL'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Colunas (Vertical)</span>
          </button>

          {/* Barras Horizontais */}
          <button
            type="button"
            onClick={() => setChartType('BAR_HORIZONTAL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              chartType === 'BAR_HORIZONTAL'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <BarChart2 className="h-3.5 w-3.5 rotate-90" />
            <span>Barras (Horizontal)</span>
          </button>

          {/* Linha */}
          <button
            type="button"
            onClick={() => setChartType('LINE')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              chartType === 'LINE'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <LineChartIcon className="h-3.5 w-3.5" />
            <span>Linhas de Tendência</span>
          </button>

          {/* Área */}
          <button
            type="button"
            onClick={() => setChartType('AREA')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              chartType === 'AREA'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Área Sombreada</span>
          </button>

          {/* Pizza */}
          <button
            type="button"
            onClick={() => setChartType('PIE')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              chartType === 'PIE'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <PieChartIcon className="h-3.5 w-3.5" />
            <span>Pizza / Setores</span>
          </button>

          {/* Rosca / Donut */}
          <button
            type="button"
            onClick={() => setChartType('DONUT')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              chartType === 'DONUT'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className="h-3.5 w-3.5 rounded-full border-2 border-current inline-block" />
            <span>Rosca (Donut)</span>
          </button>

          {/* Radar */}
          <button
            type="button"
            onClick={() => setChartType('RADAR')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              chartType === 'RADAR'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Radar Pedagógico</span>
          </button>

          {/* Composto */}
          <button
            type="button"
            onClick={() => setChartType('COMPOSED')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              chartType === 'COMPOSED'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Composto (Barras + Meta)</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* MAIN BODY: ACTIVE TAB CONTENT */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: PREVIEW DO GRÁFICO */}
          {activeTab === 'PREVIEW' && (
            <div className="space-y-5">
              {/* Printable Wrapper */}
              <div
                ref={printAreaRef}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4"
              >
                {/* Header do Gráfico Impresso */}
                <div className="border-b border-slate-100 pb-3 flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight">
                      {displayTitle}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {currentDataset?.subtitle || subtitle} • Total de {processedData.length} amostras analisadas
                    </p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                      Média: {stats.avg}{unit}
                    </span>
                  </div>
                </div>

                {/* KPI Summary Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Média Geral</span>
                    <div className="text-base font-black text-slate-900">
                      {stats.avg} {unit}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Maior Desempenho</span>
                    <div className="text-base font-black text-emerald-600 truncate" title={stats.topName}>
                      {stats.max} {unit}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{stats.topName}</div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Menor Desempenho</span>
                    <div className="text-base font-black text-amber-600 truncate" title={stats.minName}>
                      {stats.min} {unit}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{stats.minName}</div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Meta Referencial</span>
                    <div className="text-base font-black text-indigo-600">
                      {benchmarkValue} {unit}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{benchmarkLabel}</div>
                  </div>
                </div>

                {/* The Chart Rendering Stage */}
                <div className="h-80 sm:h-96 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    {/* 1. BARRAS VERTICAIS */}
                    {chartType === 'BAR_VERTICAL' && (
                      <BarChart data={processedData} margin={{ top: 20, right: 20, left: 10, bottom: 44 }}>
                        {showGrid && <CartesianGrid {...getScalableGridProps('LIGHT', false)} />}
                        <XAxis {...getScalableXAxisProps({ angle: -25, height: 44, maxLength: 22 })} />
                        <YAxis {...getScalableYAxisProps({ unit })} />
                        <Tooltip
                          content={
                            <InteractiveChartTooltip
                              unit={unit}
                              valueLabel={primaryLabel}
                              secondaryValueLabel={secondaryLabel}
                              benchmarkValue={showBenchmarkLine ? benchmarkValue : undefined}
                              benchmarkLabel={benchmarkLabel}
                            />
                          }
                        />
                        {showLegend && (
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
                        {showBenchmarkLine && (
                          <ReferenceLine
                            y={benchmarkValue}
                            stroke="#ef4444"
                            strokeDasharray="4 4"
                            strokeWidth={1.5}
                            label={{ value: benchmarkLabel, fill: '#dc2626', fontSize: 10, position: 'top', fontWeight: 'bold' }}
                          />
                        )}
                        <Bar
                          dataKey="value"
                          name={primaryLabel}
                          radius={[8, 8, 0, 0]}
                          fill={paletteColors[0]}
                          hide={hiddenSeries.includes(primaryLabel) || hiddenSeries.includes('value')}
                        >
                          {processedData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color || paletteColors[index % paletteColors.length]}
                            />
                          ))}
                          {showDataLabels && (
                            <LabelList
                              dataKey="value"
                              position="top"
                              formatter={(v: any) => `${v}${unit}`}
                              style={{ fontSize: 10, fontWeight: 700, fill: '#334155' }}
                            />
                          )}
                        </Bar>
                      </BarChart>
                    )}

                    {/* 2. BARRAS HORIZONTAIS */}
                    {chartType === 'BAR_HORIZONTAL' && (
                      <BarChart
                        data={processedData}
                        layout="vertical"
                        margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
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
                          width={140}
                          tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                          tickLine={{ stroke: '#94a3b8' }}
                          axisLine={{ stroke: '#cbd5e1', strokeWidth: 1.5 }}
                          tickFormatter={(val: string) =>
                            val.length > 20 ? val.substring(0, 19) + '…' : val
                          }
                        />
                        <Tooltip
                          content={
                            <InteractiveChartTooltip
                              unit={unit}
                              valueLabel={primaryLabel}
                              secondaryValueLabel={secondaryLabel}
                              benchmarkValue={showBenchmarkLine ? benchmarkValue : undefined}
                              benchmarkLabel={benchmarkLabel}
                            />
                          }
                        />
                        {showLegend && (
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
                        {showBenchmarkLine && (
                          <ReferenceLine
                            x={benchmarkValue}
                            stroke="#ef4444"
                            strokeDasharray="4 4"
                            strokeWidth={1.5}
                            label={{ value: benchmarkLabel, fill: '#dc2626', fontSize: 10, position: 'insideTopRight', fontWeight: 'bold' }}
                          />
                        )}
                        <Bar
                          dataKey="value"
                          name={primaryLabel}
                          radius={[0, 8, 8, 0]}
                          fill={paletteColors[0]}
                          hide={hiddenSeries.includes(primaryLabel) || hiddenSeries.includes('value')}
                        >
                          {processedData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color || paletteColors[index % paletteColors.length]}
                            />
                          ))}
                          {showDataLabels && (
                            <LabelList
                              dataKey="value"
                              position="right"
                              formatter={(v: any) => `${v}${unit}`}
                              style={{ fontSize: 10, fontWeight: 700, fill: '#334155' }}
                            />
                          )}
                        </Bar>
                      </BarChart>
                    )}

                    {/* 3. LINHAS */}
                    {chartType === 'LINE' && (
                      <LineChart data={processedData} margin={{ top: 20, right: 20, left: 10, bottom: 44 }}>
                        {showGrid && <CartesianGrid {...getScalableGridProps('LIGHT', false)} />}
                        <XAxis {...getScalableXAxisProps({ angle: -25, height: 44, maxLength: 22 })} />
                        <YAxis {...getScalableYAxisProps({ unit })} />
                        <Tooltip
                          content={
                            <InteractiveChartTooltip
                              unit={unit}
                              valueLabel={primaryLabel}
                              secondaryValueLabel={secondaryLabel}
                              benchmarkValue={showBenchmarkLine ? benchmarkValue : undefined}
                              benchmarkLabel={benchmarkLabel}
                            />
                          }
                        />
                        {showLegend && (
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
                        {showBenchmarkLine && (
                          <ReferenceLine
                            y={benchmarkValue}
                            stroke="#ef4444"
                            strokeDasharray="4 4"
                            strokeWidth={1.5}
                            label={{ value: benchmarkLabel, fill: '#dc2626', fontSize: 10, fontWeight: 'bold' }}
                          />
                        )}
                        <Line
                          type="monotone"
                          dataKey="value"
                          name={primaryLabel}
                          stroke={paletteColors[0]}
                          strokeWidth={3}
                          dot={{ r: 5, fill: paletteColors[0], strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 7 }}
                          hide={hiddenSeries.includes(primaryLabel) || hiddenSeries.includes('value')}
                        >
                          {showDataLabels && (
                            <LabelList
                              dataKey="value"
                              position="top"
                              formatter={(v: any) => `${v}${unit}`}
                              style={{ fontSize: 10, fontWeight: 700, fill: paletteColors[0] }}
                            />
                          )}
                        </Line>
                      </LineChart>
                    )}

                    {/* 4. ÁREA */}
                    {chartType === 'AREA' && (
                      <AreaChart data={processedData} margin={{ top: 20, right: 20, left: 10, bottom: 44 }}>
                        <defs>
                          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={paletteColors[0]} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={paletteColors[0]} stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        {showGrid && <CartesianGrid {...getScalableGridProps('LIGHT', false)} />}
                        <XAxis {...getScalableXAxisProps({ angle: -25, height: 44, maxLength: 22 })} />
                        <YAxis {...getScalableYAxisProps({ unit })} />
                        <Tooltip
                          content={
                            <InteractiveChartTooltip
                              unit={unit}
                              valueLabel={primaryLabel}
                              secondaryValueLabel={secondaryLabel}
                              benchmarkValue={showBenchmarkLine ? benchmarkValue : undefined}
                              benchmarkLabel={benchmarkLabel}
                            />
                          }
                        />
                        {showLegend && (
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
                        {showBenchmarkLine && (
                          <ReferenceLine
                            y={benchmarkValue}
                            stroke="#ef4444"
                            strokeDasharray="4 4"
                            strokeWidth={1.5}
                            label={{ value: benchmarkLabel, fill: '#dc2626', fontSize: 10, fontWeight: 'bold' }}
                          />
                        )}
                        <Area
                          type="monotone"
                          dataKey="value"
                          name={primaryLabel}
                          stroke={paletteColors[0]}
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#areaGradient)"
                          hide={hiddenSeries.includes(primaryLabel) || hiddenSeries.includes('value')}
                        />
                      </AreaChart>
                    )}

                    {/* 5. PIZZA */}
                    {chartType === 'PIE' && (
                      <PieChart>
                        <Tooltip
                          content={
                            <InteractiveChartTooltip
                              unit={unit}
                              valueLabel={primaryLabel}
                              secondaryValueLabel={secondaryLabel}
                              benchmarkValue={showBenchmarkLine ? benchmarkValue : undefined}
                              benchmarkLabel={benchmarkLabel}
                            />
                          }
                        />
                        {showLegend && (
                          <Legend
                            verticalAlign="bottom"
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
                        <Pie
                          data={visibleData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={105}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          labelLine={true}
                        >
                          {visibleData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color || paletteColors[index % paletteColors.length]}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    )}

                    {/* 6. DONUT / ROSCA */}
                    {chartType === 'DONUT' && (
                      <PieChart>
                        <Tooltip
                          content={
                            <InteractiveChartTooltip
                              unit={unit}
                              valueLabel={primaryLabel}
                              secondaryValueLabel={secondaryLabel}
                              benchmarkValue={showBenchmarkLine ? benchmarkValue : undefined}
                              benchmarkLabel={benchmarkLabel}
                            />
                          }
                        />
                        {showLegend && (
                          <Legend
                            verticalAlign="bottom"
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
                        <Pie
                          data={visibleData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={105}
                          paddingAngle={3}
                          label={({ name, value }) => `${name}: ${value}${unit}`}
                        >
                          {visibleData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color || paletteColors[index % paletteColors.length]}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    )}

                    {/* 7. RADAR */}
                    {chartType === 'RADAR' && (
                      <RadarChart cx="50%" cy="50%" outerRadius={100} data={processedData}>
                        <PolarGrid stroke="#cbd5e1" />
                        <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: '#334155', fontWeight: 600 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94a3b8" />
                        <Tooltip
                          content={
                            <InteractiveChartTooltip
                              unit={unit}
                              valueLabel={primaryLabel}
                              secondaryValueLabel={secondaryLabel}
                              benchmarkValue={showBenchmarkLine ? benchmarkValue : undefined}
                              benchmarkLabel={benchmarkLabel}
                            />
                          }
                        />
                        {showLegend && (
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
                        <Radar
                          name={primaryLabel}
                          dataKey="value"
                          stroke={paletteColors[0]}
                          fill={paletteColors[0]}
                          fillOpacity={0.4}
                          hide={hiddenSeries.includes(primaryLabel) || hiddenSeries.includes('value')}
                        />
                      </RadarChart>
                    )}

                    {/* 8. COMPOSTO (COLUNAS + META) */}
                    {chartType === 'COMPOSED' && (
                      <ComposedChart data={processedData} margin={{ top: 20, right: 20, left: 10, bottom: 44 }}>
                        {showGrid && <CartesianGrid {...getScalableGridProps('LIGHT', false)} />}
                        <XAxis {...getScalableXAxisProps({ angle: -25, height: 44, maxLength: 22 })} />
                        <YAxis {...getScalableYAxisProps({ unit })} />
                        <Tooltip
                          content={
                            <InteractiveChartTooltip
                              unit={unit}
                              valueLabel={primaryLabel}
                              secondaryValueLabel={secondaryLabel}
                              benchmarkValue={showBenchmarkLine ? benchmarkValue : undefined}
                              benchmarkLabel={benchmarkLabel}
                            />
                          }
                        />
                        {showLegend && (
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
                        <Bar
                          dataKey="value"
                          name={primaryLabel}
                          fill={paletteColors[0]}
                          radius={[6, 6, 0, 0]}
                          hide={hiddenSeries.includes(primaryLabel) || hiddenSeries.includes('value')}
                        />
                        <Line
                          type="monotone"
                          dataKey="secondaryValue"
                          name={secondaryLabel}
                          stroke="#ef4444"
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: '#ef4444' }}
                          hide={hiddenSeries.includes(secondaryLabel) || hiddenSeries.includes('secondaryValue')}
                        />
                        {showBenchmarkLine && (
                          <ReferenceLine
                            y={benchmarkValue}
                            stroke="#f59e0b"
                            strokeDasharray="4 4"
                            strokeWidth={1.5}
                            label={{ value: benchmarkLabel, fill: '#d97706', fontSize: 10, fontWeight: 'bold' }}
                          />
                        )}
                      </ComposedChart>
                    )}
                  </ResponsiveContainer>
                </div>

                {/* Framed Legend Box in Preview */}
                {showLegend && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <span>Quadro de Legendas & Categorias</span>
                      <span>{processedData.length} Itens Amostrados</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                      {processedData.map((item, idx) => {
                        const itemColor = item.color || paletteColors[idx % paletteColors.length];
                        const totalVal = processedData.reduce((a, b) => a + (b.value || 0), 0) || 1;
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
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="font-mono font-bold text-slate-900 text-xs px-1.5 py-0.5 rounded bg-white border border-slate-200">
                                {item.value} {unit}
                              </span>
                              {(chartType === 'PIE' || chartType === 'DONUT') && (
                                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                                  {percent}%
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PAINEL DE PERSONALIZAÇÃO AVANÇADA */}
          {activeTab === 'CUSTOMIZE' && (
            <div className="space-y-6">
              {/* Título do Gráfico */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-indigo-600" />
                  <span>Configurações de Título & Rótulos</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Título Personalizado do Gráfico
                    </label>
                    <input
                      type="text"
                      value={customChartTitle}
                      onChange={(e) => setCustomChartTitle(e.target.value)}
                      placeholder={currentDataset?.title || 'Ex: Desempenho Geral de Matemática 2026'}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Rótulo da Meta / Linha de Referência
                    </label>
                    <input
                      type="text"
                      value={benchmarkLabel}
                      onChange={(e) => setBenchmarkLabel(e.target.value)}
                      placeholder="Ex: Meta Municipal (70%)"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Seletor de Paleta de Cores */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Palette className="h-4 w-4 text-indigo-600" />
                  <span>Tema & Paleta de Cores</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(Object.keys(COLOR_PALETTES) as ColorPaletteKey[]).map((key) => {
                    const pal = COLOR_PALETTES[key];
                    const isSelected = selectedPalette === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedPalette(key)}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="text-xs font-bold text-slate-800">{pal.name}</div>
                          <div className="flex items-center gap-1">
                            {pal.colors.slice(0, 5).map((c, i) => (
                              <span
                                key={i}
                                className="h-3 w-3 rounded-full inline-block border border-black/10"
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-indigo-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filtros e Ajustes Estruturais */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-indigo-600" />
                  <span>Opções de Exibição e Ordenação</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Ordenação */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ordenação dos Dados
                    </label>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="DESC">Maior para Menor (Decrescente)</option>
                      <option value="ASC">Menor para Maior (Crescente)</option>
                      <option value="ORIGINAL">Ordem Padrão da Tabela</option>
                    </select>
                  </div>

                  {/* Limite de Amostras */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Quantidade de Amostras
                    </label>
                    <select
                      value={dataLimit}
                      onChange={(e) => setDataLimit(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                    >
                      <option value={0}>Todos os Itens ({currentDataset?.data.length})</option>
                      <option value={5}>Top 5 Melhores</option>
                      <option value={10}>Top 10 Melhores</option>
                      <option value={15}>Top 15 Melhores</option>
                    </select>
                  </div>

                  {/* Valor da Meta */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Valor da Meta / Referência ({unit})
                    </label>
                    <input
                      type="number"
                      value={benchmarkValue}
                      onChange={(e) => setBenchmarkValue(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                {/* Toggles Visuais */}
                <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={showDataLabels}
                      onChange={(e) => setShowDataLabels(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Rótulos de Valores</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={showGrid}
                      onChange={(e) => setShowGrid(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Linhas de Grade</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={showLegend}
                      onChange={(e) => setShowLegend(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Exibir Legenda</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={showBenchmarkLine}
                      onChange={(e) => setShowBenchmarkLine(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Linha de Meta</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TABELA DE DADOS DO GRÁFICO */}
          {activeTab === 'DATA_TABLE' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Dados Tabulados ({processedData.length} itens)
                </h4>
                <button
                  type="button"
                  onClick={handleCopyTable}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>{copyFeedback ? 'Copiado!' : 'Copiar Texto'}</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Posição</th>
                      <th className="p-3">Item / Categoria</th>
                      <th className="p-3 text-center">Valor ({unit})</th>
                      <th className="p-3 text-center">Meta ({unit})</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {processedData.map((d, index) => {
                      const isAboveBenchmark = d.value >= benchmarkValue;
                      return (
                        <tr key={index} className="hover:bg-slate-50">
                          <td className="p-3 font-mono font-bold text-slate-400">#{index + 1}</td>
                          <td className="p-3 font-bold text-slate-900">{d.name}</td>
                          <td className="p-3 text-center font-black text-slate-800">
                            {d.value} {unit}
                          </td>
                          <td className="p-3 text-center text-slate-500">
                            {d.secondaryValue || benchmarkValue} {unit}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isAboveBenchmark
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {isAboveBenchmark ? 'Meta Atingida' : 'Abaixo da Meta'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* MODAL FOOTER: EXPORT & PRINT ACTIONS */}
        {/* ========================================================================= */}
        <div className="no-print p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span>Exportar Dados (CSV)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Fechar
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir Gráfico Oficial (A4)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
