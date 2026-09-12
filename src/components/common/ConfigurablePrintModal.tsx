import React, { useState, useMemo } from 'react';
import {
  Printer,
  X,
  Eye,
  EyeOff,
  Sliders,
  FileText,
  Building2,
  Calendar,
  CheckSquare,
  Square,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  LayoutTemplate,
  Filter,
} from 'lucide-react';
import { SchoolSettings } from '../../types';

export interface PrintColumnConfig {
  id: string;
  label: string;
  defaultVisible?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface AppliedFilterItem {
  label: string;
  value: string;
}

export interface SummaryMetricItem {
  label: string;
  value: string | number;
  color?: string;
}

export interface ConfigurablePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  schoolSettings?: SchoolSettings;
  columns: PrintColumnConfig[];
  data: any[];
  appliedFilters?: AppliedFilterItem[];
  summaryMetrics?: SummaryMetricItem[];
  defaultOrientation?: 'portrait' | 'landscape';
  renderCell?: (item: any, columnId: string, rowIndex: number) => React.ReactNode | string;
}

export const ConfigurablePrintModal: React.FC<ConfigurablePrintModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  schoolSettings,
  columns,
  data,
  appliedFilters = [],
  summaryMetrics = [],
  defaultOrientation = 'portrait',
  renderCell,
}) => {
  // Estado das colunas visíveis
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    columns.forEach((col) => {
      initial[col.id] = col.defaultVisible !== false;
    });
    return initial;
  });

  // Opções de cabeçalho e metadados
  const [showHeader, setShowHeader] = useState(true);
  const [showSchoolDetails, setShowSchoolDetails] = useState(true);
  const [showAppliedFilters, setShowAppliedFilters] = useState(true);
  const [showSummaryMetrics, setShowSummaryMetrics] = useState(summaryMetrics.length > 0);
  const [showSignatures, setShowSignatures] = useState(true);
  const [showTimestamp, setShowTimestamp] = useState(true);
  const [showZebraStripes, setShowZebraStripes] = useState(true);

  // Opções de layout da página
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(defaultOrientation);
  const [density, setDensity] = useState<'compact' | 'comfortable' | 'spacious'>('compact');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('small');

  // Estado de feedback de cópia
  const [copied, setCopied] = useState(false);

  // Colunas ativas ordenadas
  const activeColumns = useMemo(() => {
    return columns.filter((c) => visibleColumns[c.id]);
  }, [columns, visibleColumns]);

  // Totalizadores
  const totalCols = columns.length;
  const activeColsCount = activeColumns.length;

  // Toggle de coluna individual
  const toggleColumn = (colId: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [colId]: !prev[colId],
    }));
  };

  // Marcar/desmarcar todas
  const handleSelectAll = (select: boolean) => {
    const next: Record<string, boolean> = {};
    columns.forEach((c) => {
      next[c.id] = select;
    });
    setVisibleColumns(next);
  };

  // Restaura padrão
  const handleReset = () => {
    const initial: Record<string, boolean> = {};
    columns.forEach((col) => {
      initial[col.id] = col.defaultVisible !== false;
    });
    setVisibleColumns(initial);
    setShowHeader(true);
    setShowSchoolDetails(true);
    setShowAppliedFilters(true);
    setShowSummaryMetrics(summaryMetrics.length > 0);
    setShowSignatures(true);
    setShowTimestamp(true);
    setShowZebraStripes(true);
    setOrientation(defaultOrientation);
    setDensity('compact');
    setFontSize('small');
  };

  // Disparo da impressão nativa
  const handlePrint = () => {
    window.print();
  };

  // Cópia em formato TSV para colar no Excel/Word
  const handleCopyTable = () => {
    if (activeColumns.length === 0) return;

    const headers = activeColumns.map((c) => c.label).join('\t');
    const rows = data.map((item, idx) => {
      return activeColumns
        .map((col) => {
          if (renderCell) {
            const rendered = renderCell(item, col.id, idx);
            if (typeof rendered === 'string' || typeof rendered === 'number') {
              return String(rendered);
            }
          }
          return String(item[col.id] ?? '');
        })
        .join('\t');
    });

    const tsvContent = `${title}\n${headers}\n${rows.join('\n')}`;
    navigator.clipboard.writeText(tsvContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!isOpen) return null;

  const nowFormatted = new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      {/* Estilos específicos para impressão limpa da folha */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report-sheet, #printable-report-sheet * {
            visibility: visible;
          }
          #printable-report-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 10mm 12mm !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: A4 ${orientation};
            margin: 8mm 10mm 10mm 10mm;
          }
        }
      `}</style>

      <div className="relative w-full max-w-7xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[95vh] overflow-hidden">
        {/* Topo do Modal (Controles e Ações) */}
        <div className="no-print bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/80 rounded-xl text-white">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Painel de Impressão & Relatório Oficial
                </h2>
                <span className="px-2 py-0.5 bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-[10px] font-bold rounded-md uppercase">
                  A4 {orientation === 'landscape' ? 'Paisagem' : 'Retrato'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Personalize colunas, cabeçalhos institucionais e filtros antes de gerar o documento ou salvar em PDF.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyTable}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              title="Copiar dados formatados para colar no Excel ou Word"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar Tabela'}</span>
            </button>

            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              title="Restaurar configurações originais"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Restaurar</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir / Salvar em PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors ml-1 cursor-pointer"
              title="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Corpo: Painel de Configurações (Esquerda) + Pré-visualização Realista (Direita) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* PAINEL LATERAL: CONTROLES CONFIGURÁVEIS (Esquerda) */}
          <div className="no-print w-full lg:w-80 xl:w-96 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200 p-4 space-y-4 overflow-y-auto max-h-[35vh] lg:max-h-full">
            {/* Bloco 1: Seleção de Colunas */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Sliders className="h-4 w-4 text-indigo-600" />
                  Colunas do Relatório ({activeColsCount}/{totalCols})
                </span>
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    onClick={() => handleSelectAll(true)}
                    className="text-indigo-600 font-bold hover:underline cursor-pointer"
                  >
                    Todas
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    onClick={() => handleSelectAll(false)}
                    className="text-slate-500 font-medium hover:underline cursor-pointer"
                  >
                    Nenhuma
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {columns.map((col) => {
                  const isChecked = !!visibleColumns[col.id];
                  return (
                    <label
                      key={col.id}
                      className={`flex items-center justify-between p-2 rounded-lg text-xs font-medium cursor-pointer transition-all border ${
                        isChecked
                          ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950 font-semibold'
                          : 'bg-slate-50/50 border-slate-200 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleColumn(col.id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span>{col.label}</span>
                      </div>
                      {isChecked ? (
                        <Eye className="h-3.5 w-3.5 text-indigo-600" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Bloco 2: Cabeçalho & Elementos Institucionais */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-indigo-600" />
                Elementos e Cabeçalho
              </span>

              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={showHeader}
                    onChange={(e) => setShowHeader(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>Cabeçalho Oficial do Município / Escola</span>
                </label>

                {showHeader && (
                  <label className="flex items-center gap-2 pl-5 cursor-pointer text-slate-600 text-[11px]">
                    <input
                      type="checkbox"
                      checked={showSchoolDetails}
                      onChange={(e) => setShowSchoolDetails(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span>Exibir INEP, CNPJ e Ato de Criação</span>
                  </label>
                )}

                {appliedFilters.length > 0 && (
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={showAppliedFilters}
                      onChange={(e) => setShowAppliedFilters(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span>Exibir Filtros Aplicados ({appliedFilters.length})</span>
                  </label>
                )}

                {summaryMetrics.length > 0 && (
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={showSummaryMetrics}
                      onChange={(e) => setShowSummaryMetrics(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span>Exibir Métricas & Totais do Relatório</span>
                  </label>
                )}

                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={showZebraStripes}
                    onChange={(e) => setShowZebraStripes(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>Linhas zebradas alternadas (legibilidade)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={showSignatures}
                    onChange={(e) => setShowSignatures(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>Campo de Assinatura (Diretoria / Coordenação)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={showTimestamp}
                    onChange={(e) => setShowTimestamp(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>Data, hora e assinatura eletrônica no rodapé</span>
                </label>
              </div>
            </div>

            {/* Bloco 3: Formatação da Página A4 */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <LayoutTemplate className="h-4 w-4 text-indigo-600" />
                Formatação e Orientação A4
              </span>

              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Orientação da Página:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setOrientation('portrait')}
                      className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        orientation === 'portrait'
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-900 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-3 h-4 border-2 border-current rounded-2xs" />
                      <span>Retrato</span>
                    </button>
                    <button
                      onClick={() => setOrientation('landscape')}
                      className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        orientation === 'landscape'
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-900 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-4 h-3 border-2 border-current rounded-2xs" />
                      <span>Paisagem</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Espaçamento:
                    </label>
                    <select
                      value={density}
                      onChange={(e) => setDensity(e.target.value as any)}
                      className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium"
                    >
                      <option value="compact">Econômico</option>
                      <option value="comfortable">Confortável</option>
                      <option value="spacious">Amplo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Fonte:
                    </label>
                    <select
                      value={fontSize}
                      onChange={(e) => setFontSize(e.target.value as any)}
                      className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium"
                    >
                      <option value="small">Pequena (10px)</option>
                      <option value="medium">Média (11px)</option>
                      <option value="large">Padrão (12px)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PRÉ-VISUALIZAÇÃO DA FOLHA A4 (Direita) */}
          <div className="flex-1 bg-slate-200/80 p-4 sm:p-6 overflow-y-auto flex justify-center">
            {/* Folha A4 Simulação Visual */}
            <div
              id="printable-report-sheet"
              className={`bg-white text-slate-900 shadow-xl border border-slate-300 rounded-sm p-8 transition-all flex flex-col justify-between ${
                orientation === 'landscape' ? 'w-full max-w-[1000px]' : 'w-full max-w-[800px]'
              }`}
              style={{
                minHeight: orientation === 'landscape' ? '600px' : '900px',
                fontSize: fontSize === 'small' ? '10px' : fontSize === 'medium' ? '11px' : '12px',
              }}
            >
              {/* Topo do Documento */}
              <div className="space-y-4">
                {/* Cabeçalho Institucional Oficial */}
                {showHeader && (
                  <div className="border-b-2 border-slate-800 pb-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-xl shadow-xs">
                          SE
                        </div>
                        <div>
                          <h1 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                            {schoolSettings?.name || 'Prefeitura Municipal & Secretaria de Educação'}
                          </h1>
                          <p className="text-[10px] text-slate-600 font-semibold">
                            {schoolSettings?.tradeName || 'SucessoEdu Gestão Educacional Integrada'}
                          </p>
                          {showSchoolDetails && (
                            <p className="text-[9px] text-slate-500 mt-0.5">
                              {schoolSettings?.inepCode ? `INEP: ${schoolSettings.inepCode} • ` : ''}
                              {schoolSettings?.cnpj ? `CNPJ: ${schoolSettings.cnpj} • ` : ''}
                              {schoolSettings?.accreditationDecree || 'Sistema Oficial de Gestão Escolar'}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right text-[9px] text-slate-500 font-mono">
                        <div>VIA OFICIAL DE CONTROLE</div>
                        <div>EMISSÃO: {nowFormatted}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Título do Relatório */}
                <div className="text-center py-2 border-b border-slate-200">
                  <h2 className="text-base font-extrabold text-slate-900 tracking-tight uppercase">
                    {title}
                  </h2>
                  {subtitle && <p className="text-xs text-slate-600 mt-0.5">{subtitle}</p>}
                </div>

                {/* Filtros Aplicados */}
                {showAppliedFilters && appliedFilters.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex flex-wrap items-center gap-2 text-[10px]">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <Filter className="h-3 w-3 text-indigo-600" />
                      Filtros Selecionados:
                    </span>
                    {appliedFilters.map((f, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-800 font-medium"
                      >
                        <strong>{f.label}:</strong> {f.value}
                      </span>
                    ))}
                  </div>
                )}

                {/* Métricas / Cards de Resumo */}
                {showSummaryMetrics && summaryMetrics.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {summaryMetrics.map((m, i) => (
                      <div
                        key={i}
                        className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center"
                      >
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                          {m.label}
                        </div>
                        <div className={`text-base font-extrabold ${m.color || 'text-slate-900'}`}>
                          {m.value}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tabela de Dados Configurável */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-100 border-y-2 border-slate-300 text-[10px] font-extrabold text-slate-800 uppercase">
                        {activeColumns.map((col) => (
                          <th
                            key={col.id}
                            style={{
                              textAlign: col.align || 'left',
                              width: col.width,
                              padding:
                                density === 'compact'
                                  ? '4px 6px'
                                  : density === 'comfortable'
                                  ? '6px 8px'
                                  : '8px 10px',
                            }}
                            className="border-r border-slate-200 last:border-r-0"
                          >
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {data.length === 0 ? (
                        <tr>
                          <td
                            colSpan={activeColumns.length || 1}
                            className="text-center py-6 text-slate-400 italic"
                          >
                            Nenhum registro encontrado para emissão com os filtros atuais.
                          </td>
                        </tr>
                      ) : (
                        data.map((row, rowIdx) => (
                          <tr
                            key={rowIdx}
                            className={showZebraStripes && rowIdx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}
                          >
                            {activeColumns.map((col) => {
                              const content = renderCell
                                ? renderCell(row, col.id, rowIdx)
                                : row[col.id] ?? '-';

                              return (
                                <td
                                  key={col.id}
                                  style={{
                                    textAlign: col.align || 'left',
                                    padding:
                                      density === 'compact'
                                        ? '3px 6px'
                                        : density === 'comfortable'
                                        ? '5px 8px'
                                        : '7px 10px',
                                  }}
                                  className="border-r border-slate-200 last:border-r-0 text-slate-800"
                                >
                                  {content}
                                </td>
                              );
                            })}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Rodapé e Assinaturas */}
              <div className="mt-8 pt-4 space-y-6">
                {showSignatures && (
                  <div className="grid grid-cols-2 gap-8 pt-6">
                    <div className="text-center">
                      <div className="border-t border-slate-400 pt-1.5 w-3/4 mx-auto font-bold text-[10px]">
                        {schoolSettings?.principalName || 'Direção Geral da Unidade Escolar'}
                      </div>
                      <div className="text-[9px] text-slate-500">
                        {schoolSettings?.principalTitle || 'Diretora Pedagógica Geral'}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="border-t border-slate-400 pt-1.5 w-3/4 mx-auto font-bold text-[10px]">
                        {schoolSettings?.secretaryName || 'Secretaria Escolar Autorizada'}
                      </div>
                      <div className="text-[9px] text-slate-500">
                        {schoolSettings?.secretaryRegistration || 'Secretário(a) de Registro Acadêmico'}
                      </div>
                    </div>
                  </div>
                )}

                {showTimestamp && (
                  <div className="border-t border-slate-200 pt-2 flex flex-wrap items-center justify-between text-[9px] text-slate-400">
                    <div>
                      SucessoEdu Gestão Educacional • Documento com validade para conferência administrativa
                    </div>
                    <div>
                      Gerado em: {nowFormatted} • Total de Registros: {data.length}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
