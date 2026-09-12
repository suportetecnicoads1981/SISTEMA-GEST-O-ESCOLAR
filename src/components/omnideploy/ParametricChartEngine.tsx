import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  BarChart3,
  LineChart as LineIcon,
  PieChart as PieIcon,
  AreaChart as AreaIcon,
  Sliders,
  Download,
  Sparkles,
  Printer,
  Layers,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';
import { OmniDeployChartParametricConfig } from '../../types';

interface ParametricChartEngineProps {
  initialData?: any[];
  onSendToPrintCanvas?: (chartConfig: OmniDeployChartParametricConfig, data: any[]) => void;
}

const DEFAULT_CHART_DATA = [
  { turma: '6º Ano A', alunos: 32, media: 7.8, frequencia: 94.2, aprovados: 30 },
  { turma: '6º Ano B', alunos: 30, media: 7.2, frequencia: 91.0, aprovados: 27 },
  { turma: '7º Ano A', alunos: 35, media: 6.9, frequencia: 88.5, aprovados: 29 },
  { turma: '7º Ano B', alunos: 33, media: 8.1, frequencia: 96.0, aprovados: 32 },
  { turma: '8º Ano A', alunos: 28, media: 6.5, frequencia: 86.4, aprovados: 24 },
  { turma: '8º Ano B', alunos: 31, media: 7.4, frequencia: 92.8, aprovados: 28 },
  { turma: '9º Ano A', alunos: 29, media: 8.4, frequencia: 95.1, aprovados: 28 },
  { turma: '9º Ano B', alunos: 27, media: 7.9, frequencia: 93.3, aprovados: 26 },
];

const GOOGLE_PALETTE = ['#1a73e8', '#34a853', '#fbbc04', '#ea4335', '#9334e8', '#00acc1', '#ff6d00', '#46bdc6'];

export const ParametricChartEngine: React.FC<ParametricChartEngineProps> = ({
  initialData = DEFAULT_CHART_DATA,
  onSendToPrintCanvas,
}) => {
  const [data, setData] = useState<any[]>(initialData);
  const [chartType, setChartType] = useState<'BAR' | 'LINE' | 'PIE' | 'AREA'>('BAR');
  const [xAxisKey, setXAxisKey] = useState<string>('turma');
  const [yAxisKey, setYAxisKey] = useState<string>('media');
  const [aggregation, setAggregation] = useState<'AVG' | 'SUM' | 'COUNT'>('AVG');
  const [chartTitle, setChartTitle] = useState<string>('Desempenho Médio por Turma');
  const [showGrid, setShowGrid] = useState(true);
  const [showLegend, setShowLegend] = useState(true);

  // Lista de chaves disponíveis nos dados
  const availableKeys = useMemo(() => {
    if (!data || data.length === 0) return { categorical: [], numeric: [] };
    const first = data[0];
    const categorical: string[] = [];
    const numeric: string[] = [];
    Object.keys(first).forEach((k) => {
      if (typeof first[k] === 'number') numeric.push(k);
      else categorical.push(k);
    });
    return { categorical, numeric };
  }, [data]);

  // Formatação de tooltip e valores
  const formatYValue = (val: any) => {
    if (typeof val === 'number') {
      return Number.isInteger(val) ? val : val.toFixed(1);
    }
    return val;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden space-y-4">
      {/* Top Header Material Design 3 */}
      <div className="bg-[#1a73e8] text-white p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/15 rounded-xl">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold">Engine de Gráficos Parametrizáveis (Recharts)</h3>
            <p className="text-xs text-blue-100">
              Seleção livre de Eixo X, Eixo Y, tipo de representação e exportação de alta resolução
            </p>
          </div>
        </div>

        {onSendToPrintCanvas && (
          <button
            onClick={() => {
              onSendToPrintCanvas(
                {
                  xAxisKey,
                  yAxisKey,
                  chartType,
                  aggregation,
                  sortBy: 'VALUE_DESC',
                  title: chartTitle,
                  showGrid,
                  showLegend,
                  colorScheme: 'GOOGLE_MD3',
                },
                data
              );
            }}
            className="px-3.5 py-2 bg-white text-[#1a73e8] hover:bg-blue-50 rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Enviar para PrintCanvas</span>
          </button>
        )}
      </div>

      {/* Barra de Parâmetros e Seleção */}
      <div className="px-5 py-3 bg-slate-50 border-y border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        {/* Seletor de Tipo de Gráfico */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">Tipo de Gráfico</label>
          <div className="grid grid-cols-4 gap-1 bg-white p-1 rounded-lg border border-slate-300">
            <button
              onClick={() => setChartType('BAR')}
              className={`p-1.5 rounded flex items-center justify-center ${
                chartType === 'BAR' ? 'bg-[#1a73e8] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Gráfico de Barras"
            >
              <BarChart3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setChartType('LINE')}
              className={`p-1.5 rounded flex items-center justify-center ${
                chartType === 'LINE' ? 'bg-[#1a73e8] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Gráfico de Linhas"
            >
              <LineIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setChartType('AREA')}
              className={`p-1.5 rounded flex items-center justify-center ${
                chartType === 'AREA' ? 'bg-[#1a73e8] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Gráfico de Área"
            >
              <AreaIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setChartType('PIE')}
              className={`p-1.5 rounded flex items-center justify-center ${
                chartType === 'PIE' ? 'bg-[#1a73e8] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Gráfico de Pizza"
            >
              <PieIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Eixo X */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">Eixo X (Agrupamento)</label>
          <select
            value={xAxisKey}
            onChange={(e) => setXAxisKey(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
          >
            {availableKeys.categorical.map((k) => (
              <option key={k} value={k}>
                {k.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Eixo Y */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">Eixo Y (Métrica / Valor)</label>
          <select
            value={yAxisKey}
            onChange={(e) => setYAxisKey(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
          >
            {availableKeys.numeric.map((k) => (
              <option key={k} value={k}>
                {k.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Título do Gráfico */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">Título do Relatório</label>
          <input
            type="text"
            value={chartTitle}
            onChange={(e) => setChartTitle(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
          />
        </div>
      </div>

      {/* Área de Renderização do Gráfico */}
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-800 text-sm">{chartTitle}</h4>
            <span className="text-[11px] text-slate-500 font-mono">
              Eixo X: {xAxisKey} | Métrica: {yAxisKey} ({chartType})
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-600">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className="rounded text-[#1a73e8]"
              />
              <span>Grade</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showLegend}
                onChange={(e) => setShowLegend(e.target.checked)}
                className="rounded text-[#1a73e8]"
              />
              <span>Legenda</span>
            </label>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'BAR' ? (
              <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
                <XAxis dataKey={xAxisKey} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [formatYValue(value), yAxisKey]} />
                {showLegend && <Legend wrapperStyle={{ fontSize: 11 }} />}
                <Bar dataKey={yAxisKey} fill="#1a73e8" radius={[6, 6, 0, 0]} name={yAxisKey.toUpperCase()}>
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={GOOGLE_PALETTE[index % GOOGLE_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            ) : chartType === 'LINE' ? (
              <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
                <XAxis dataKey={xAxisKey} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [formatYValue(value), yAxisKey]} />
                {showLegend && <Legend wrapperStyle={{ fontSize: 11 }} />}
                <Line
                  type="monotone"
                  dataKey={yAxisKey}
                  stroke="#1a73e8"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#1a73e8' }}
                  activeDot={{ r: 8 }}
                  name={yAxisKey.toUpperCase()}
                />
              </LineChart>
            ) : chartType === 'AREA' ? (
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
                <XAxis dataKey={xAxisKey} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [formatYValue(value), yAxisKey]} />
                {showLegend && <Legend wrapperStyle={{ fontSize: 11 }} />}
                <Area
                  type="monotone"
                  dataKey={yAxisKey}
                  stroke="#1a73e8"
                  fill="#1a73e8"
                  fillOpacity={0.25}
                  strokeWidth={2}
                  name={yAxisKey.toUpperCase()}
                />
              </AreaChart>
            ) : (
              <PieChart>
                <Tooltip formatter={(value) => [formatYValue(value), yAxisKey]} />
                {showLegend && <Legend wrapperStyle={{ fontSize: 11 }} />}
                <Pie
                  data={data}
                  dataKey={yAxisKey}
                  nameKey={xAxisKey}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry[xAxisKey]}: ${formatYValue(entry[yAxisKey])}`}
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={GOOGLE_PALETTE[index % GOOGLE_PALETTE.length]} />
                  ))}
                </Pie>
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
