import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  Printer,
  FileSpreadsheet,
  FileText,
  FileCode,
  CheckSquare,
  Square,
  Sliders,
  Eye,
  Download,
  Building,
  Check,
  Calendar,
  Sparkles,
  Award,
  Maximize2,
  FileDown,
} from 'lucide-react';
import { SchoolSettings } from '../../types';
import { triggerPrint, downloadPrintableHtml } from '../../utils/printHelper';
import * as XLSX from 'xlsx';

export interface ColumnDefinition<T> {
  key: string;
  label: string;
  render?: (item: T, index: number) => React.ReactNode;
  getValue?: (item: T, index: number) => string | number;
  defaultSelected?: boolean;
}

interface PrintExportModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  documentCategory?: string;
  items: T[];
  columns: ColumnDefinition<T>[];
  settings?: SchoolSettings;
  extraHeaderInfo?: { label: string; value: string }[];
  summaryMetrics?: { label: string; value: string | number; colorClass?: string }[];
  defaultFileName?: string;
}

export function PrintExportModal<T>({
  isOpen,
  onClose,
  title,
  subtitle,
  documentCategory = 'RELATÓRIO OFICIAL DE SECRETARIA',
  items,
  columns,
  settings,
  extraHeaderInfo,
  summaryMetrics,
  defaultFileName = 'relatorio_escolar',
}: PrintExportModalProps<T>) {
  const [selectedColumnKeys, setSelectedColumnKeys] = useState<string[]>(() =>
    columns.filter((c) => c.defaultSelected !== false).map((c) => c.key)
  );

  const [includeOfficialHeader, setIncludeOfficialHeader] = useState(true);
  const [includeSignatures, setIncludeSignatures] = useState(true);
  const [includeDateStamp, setIncludeDateStamp] = useState(true);
  const [activeFormat, setActiveFormat] = useState<'PRINT' | 'XLSX' | 'CSV' | 'JSON' | 'TXT'>('PRINT');
  const [pageOrientation, setPageOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [fontSizeOption, setFontSizeOption] = useState<'compact' | 'normal' | 'large'>('normal');
  const [customReportNotes, setCustomReportNotes] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);
  const printSheetRef = useRef<HTMLDivElement>(null);

  const handleExportXLSX = () => {
    try {
      const exportRows = items.map((item, idx) => {
        const row: Record<string, any> = { '#': idx + 1 };
        visibleColumns.forEach((col) => {
          if (col.getValue) {
            row[col.label] = col.getValue(item, idx);
          } else {
            row[col.label] = (item as any)[col.key] || '';
          }
        });
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório');
      XLSX.writeFile(
        workbook,
        `${defaultFileName}_${new Date().toISOString().split('T')[0]}.xlsx`
      );
    } catch (err) {
      console.error('Erro ao gerar XLSX:', err);
      handleExportCSV();
    }
  };

  const toggleColumn = (key: string) => {
    setSelectedColumnKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const selectAllColumns = () => {
    setSelectedColumnKeys(columns.map((c) => c.key));
  };

  const clearAllColumns = () => {
    setSelectedColumnKeys([]);
  };

  const visibleColumns = useMemo(
    () => columns.filter((c) => selectedColumnKeys.includes(c.key)),
    [columns, selectedColumnKeys]
  );

  if (!isOpen) return null;

  const handlePrint = () => {
    if (printSheetRef.current) {
      triggerPrint(printSheetRef.current, {
        title: `${title} - ${settings?.name || 'SucessoEdu'}`,
        schoolName: settings?.name,
        documentCategory,
      });
    } else {
      triggerPrint(null, {
        title: `${title} - ${settings?.name || 'SucessoEdu'}`,
      });
    }
  };

  const handleDownloadHtml = () => {
    if (printSheetRef.current) {
      downloadPrintableHtml(
        printSheetRef.current.innerHTML,
        defaultFileName,
        title
      );
    }
  };

  const handleExportCSV = () => {
    const headers = visibleColumns.map((c) => `"${c.label}"`);
    const rows = items.map((item, idx) => {
      return visibleColumns.map((col) => {
        let val = '';
        if (col.getValue) {
          val = String(col.getValue(item, idx));
        } else {
          val = String((item as any)[col.key] || '');
        }
        return `"${val.replace(/"/g, '""')}"`;
      });
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `${defaultFileName}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const exportData = items.map((item, idx) => {
      const row: Record<string, any> = {};
      visibleColumns.forEach((col) => {
        if (col.getValue) {
          row[col.label] = col.getValue(item, idx);
        } else {
          row[col.label] = (item as any)[col.key];
        }
      });
      return row;
    });

    const jsonStr = JSON.stringify(
      {
        titulo: title,
        categoria: documentCategory,
        geradoEm: new Date().toISOString(),
        totalRegistros: exportData.length,
        dados: exportData,
      },
      null,
      2
    );

    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${defaultFileName}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportTXT = () => {
    let txt = `========================================================================\n`;
    txt += `${settings?.name || 'SISTEMA DE GESTÃO EDUCACIONAL MUNICIPAL'}\n`;
    txt += `${title.toUpperCase()}\n`;
    if (subtitle) txt += `${subtitle}\n`;
    txt += `Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}\n`;
    txt += `========================================================================\n\n`;

    if (extraHeaderInfo && extraHeaderInfo.length > 0) {
      extraHeaderInfo.forEach((info) => {
        txt += `${info.label}: ${info.value}\n`;
      });
      txt += `\n------------------------------------------------------------------------\n`;
    }

    // Tabular representation
    const colLabels = visibleColumns.map((c) => c.label);
    txt += colLabels.join(' | ') + '\n';
    txt += '-'.repeat(80) + '\n';

    items.forEach((item, idx) => {
      const vals = visibleColumns.map((col) => {
        if (col.getValue) return String(col.getValue(item, idx));
        return String((item as any)[col.key] || '');
      });
      txt += vals.join(' | ') + '\n';
    });

    txt += `\nTotal de registros listados: ${items.length}\n`;
    if (customReportNotes) {
      txt += `\nObservações: ${customReportNotes}\n`;
    }
    txt += `\n========================================================================\n`;

    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${defaultFileName}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl max-w-6xl w-full shadow-2xl border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none print:m-0">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between no-print border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                <span>Central de Impressão & Exportação Oficial</span>
                <span className="text-[10px] bg-indigo-500/30 text-indigo-300 font-semibold px-2 py-0.5 rounded-full border border-indigo-400/30">
                  Prévia A4
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Personalize as colunas, filtros institucionais e selecione o formato desejado
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>

            <button
              onClick={onClose}
              className="h-8 w-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Sidebar Config + Print Paper Preview */}
        <div className="flex flex-1 overflow-hidden print:overflow-visible">
          {/* Left Panel: Configuration & Export Formats (Hidden on Print) */}
          <div className="w-80 bg-slate-50 border-r border-slate-200 p-5 overflow-y-auto space-y-5 no-print shrink-0">
            {/* Export Format Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                1. Formato de Saída
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveFormat('PRINT')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    activeFormat === 'PRINT'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Printer className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span>Impressão / PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveFormat('XLSX');
                    handleExportXLSX();
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    activeFormat === 'XLSX'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Excel (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveFormat('CSV');
                    handleExportCSV();
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    activeFormat === 'CSV'
                      ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="h-4 w-4 text-teal-600 shrink-0" />
                  <span>Planilha CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveFormat('JSON');
                    handleExportJSON();
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    activeFormat === 'JSON'
                      ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FileCode className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Dados JSON</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveFormat('TXT');
                    handleExportTXT();
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    activeFormat === 'TXT'
                      ? 'bg-sky-50 border-sky-500 text-sky-700 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="h-4 w-4 text-sky-600 shrink-0" />
                  <span>Texto TXT</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveFormat('PRINT');
                    handleDownloadHtml();
                  }}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer col-span-2"
                >
                  <FileDown className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span>Baixar Arquivo HTML / Word (Doc)</span>
                </button>
              </div>
            </div>

            {/* Column Customization Filter */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  2. Colunas a Exibir ({visibleColumns.length}/{columns.length})
                </label>
                <div className="flex items-center gap-2 text-[10px]">
                  <button
                    type="button"
                    onClick={selectAllColumns}
                    className="text-indigo-600 hover:underline font-semibold cursor-pointer"
                  >
                    Todas
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={clearAllColumns}
                    className="text-slate-500 hover:underline font-semibold cursor-pointer"
                  >
                    Nenhuma
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto bg-white p-2.5 rounded-xl border border-slate-200">
                {columns.map((col) => {
                  const isChecked = selectedColumnKeys.includes(col.key);
                  return (
                    <label
                      key={col.key}
                      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 text-xs text-slate-700 cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleColumn(col.key)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                      />
                      <span className={isChecked ? 'font-semibold text-slate-900' : 'text-slate-500'}>
                        {col.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Document Layout Elements */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                3. Elementos do Documento
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeOfficialHeader}
                  onChange={(e) => setIncludeOfficialHeader(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                />
                <span>Cabeçalho Oficial & Brasão da Escola</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSignatures}
                  onChange={(e) => setIncludeSignatures(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                />
                <span>Campos de Assinatura (Direção/Secretaria)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeDateStamp}
                  onChange={(e) => setIncludeDateStamp(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                />
                <span>Data e Hora de Autenticidade</span>
              </label>
            </div>

            {/* Page Orientation & Typography Scale */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                4. Orientação & Tipografia
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setPageOrientation('portrait')}
                  className={`py-1.5 px-2 rounded-lg border text-xs font-semibold text-center cursor-pointer transition-all ${
                    pageOrientation === 'portrait'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  📄 Retrato (Vertical)
                </button>
                <button
                  type="button"
                  onClick={() => setPageOrientation('landscape')}
                  className={`py-1.5 px-2 rounded-lg border text-xs font-semibold text-center cursor-pointer transition-all ${
                    pageOrientation === 'landscape'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  📑 Paisagem (Horizontal)
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setFontSizeOption('compact')}
                  className={`py-1 px-1.5 rounded-lg border text-[11px] text-center cursor-pointer transition-all ${
                    fontSizeOption === 'compact'
                      ? 'bg-slate-900 text-white font-bold border-slate-900'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Compacto
                </button>
                <button
                  type="button"
                  onClick={() => setFontSizeOption('normal')}
                  className={`py-1 px-1.5 rounded-lg border text-[11px] text-center cursor-pointer transition-all ${
                    fontSizeOption === 'normal'
                      ? 'bg-slate-900 text-white font-bold border-slate-900'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Padrão
                </button>
                <button
                  type="button"
                  onClick={() => setFontSizeOption('large')}
                  className={`py-1 px-1.5 rounded-lg border text-[11px] text-center cursor-pointer transition-all ${
                    fontSizeOption === 'large'
                      ? 'bg-slate-900 text-white font-bold border-slate-900'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Legível (+)
                </button>
              </div>
            </div>

            {/* Custom Notes on Document */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                5. Observação Adicional
              </label>
              <textarea
                value={customReportNotes}
                onChange={(e) => setCustomReportNotes(e.target.value)}
                placeholder="Ex: Documento emitido para fins de conferência municipal..."
                rows={2}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Right Panel: Official Document Sheet Preview (A4 Formatted) */}
          <div className="flex-1 bg-slate-100 p-6 overflow-y-auto flex justify-center print:p-0 print:bg-white print:overflow-visible">
            <div
              ref={printSheetRef}
              className={`bg-white rounded-xl shadow-lg border border-slate-200 w-full p-8 print:p-0 print:shadow-none print:border-none print:max-w-none print:w-full space-y-6 text-slate-800 min-h-[700px] flex flex-col justify-between transition-all ${
                pageOrientation === 'landscape' ? 'max-w-6xl' : 'max-w-4xl'
              } ${
                fontSizeOption === 'compact' ? 'text-[11px]' : fontSizeOption === 'large' ? 'text-sm' : 'text-xs'
              }`}
            >
              <style dangerouslySetInnerHTML={{ __html: `@media print { @page { size: ${pageOrientation}; margin: 10mm; } }` }} />
              <div>
                {/* Official Institutional Header */}
                {includeOfficialHeader && (
                  <div className="border-b-2 border-slate-900 pb-4 mb-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-2xl shrink-0">
                        🏛️
                      </div>
                      <div>
                        <h1 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                          {settings?.name || 'PREFEITURA MUNICIPAL DE EDUCAÇÃO'}
                        </h1>
                        <p className="text-xs font-semibold text-slate-700">
                          {settings?.tradeName || 'Secretaria Municipal de Educação & Gestão Escolar'}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {settings?.address} • {settings?.city} - {settings?.state} • Tel: {settings?.phone} • Cód. INEP: {settings?.inepCode || '35128490'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-800 text-[10px] font-black uppercase rounded-md tracking-wider border border-slate-300">
                        {documentCategory}
                      </span>
                      {includeDateStamp && (
                        <p className="text-[10px] text-slate-400 mt-1 font-mono">
                          Emissão: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Report Title */}
                <div className="mb-4 text-center">
                  <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
                    {title}
                  </h2>
                  {subtitle && <p className="text-xs text-slate-600 mt-0.5">{subtitle}</p>}
                </div>

                {/* Extra Header Parameters (e.g. Turma, Turno, Escola, Bimestre) */}
                {extraHeaderInfo && extraHeaderInfo.length > 0 && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {extraHeaderInfo.map((info, idx) => (
                      <div key={idx}>
                        <span className="text-slate-500 font-medium block text-[10px] uppercase">
                          {info.label}:
                        </span>
                        <span className="font-bold text-slate-800">{info.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Summary Metrics Bar if provided */}
                {summaryMetrics && summaryMetrics.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    {summaryMetrics.map((met, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center"
                      >
                        <span className="text-[10px] text-slate-500 font-semibold block uppercase">
                          {met.label}
                        </span>
                        <span className={`text-sm font-black ${met.colorClass || 'text-slate-900'}`}>
                          {met.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Main Data Table */}
                <div className="overflow-x-auto border border-slate-300 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                      <tr>
                        <th className="p-2 border-r border-slate-300 w-10 text-center">#</th>
                        {visibleColumns.map((col) => (
                          <th key={col.key} className="p-2 border-r border-slate-300 last:border-r-0">
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {items.length === 0 ? (
                        <tr>
                          <td
                            colSpan={visibleColumns.length + 1}
                            className="p-4 text-center text-slate-400 text-xs italic"
                          >
                            Nenhum registro encontrado para os critérios selecionados.
                          </td>
                        </tr>
                      ) : (
                        items.map((item, idx) => (
                          <tr
                            key={idx}
                            className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}
                          >
                            <td className="p-2 border-r border-slate-200 text-center font-mono text-[10px] text-slate-500">
                              {idx + 1}
                            </td>
                            {visibleColumns.map((col) => (
                              <td
                                key={col.key}
                                className="p-2 border-r border-slate-200 last:border-r-0 text-slate-800"
                              >
                                {col.render
                                  ? col.render(item, idx)
                                  : col.getValue
                                  ? col.getValue(item, idx)
                                  : (item as any)[col.key] || '—'}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Additional Notes */}
                {customReportNotes && (
                  <div className="mt-4 p-3 bg-amber-50/60 border border-amber-200/80 rounded-lg text-xs text-amber-900">
                    <span className="font-bold">Observações: </span>
                    {customReportNotes}
                  </div>
                )}
              </div>

              {/* Signatures & Footer Section */}
              <div className="mt-8 pt-4">
                {includeSignatures && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 pt-6 border-t border-slate-200 text-center text-xs">
                    <div>
                      <div className="border-t border-slate-400 pt-1 mx-4">
                        <p className="font-bold text-slate-900">{settings?.secretaryName || 'Carlos Eduardo Nogueira'}</p>
                        <p className="text-[10px] text-slate-500">Secretaria Escolar / Registro</p>
                      </div>
                    </div>

                    <div>
                      <div className="border-t border-slate-400 pt-1 mx-4">
                        <p className="font-bold text-slate-900">Coordenação Pedagógica</p>
                        <p className="text-[10px] text-slate-500">Homologação SME</p>
                      </div>
                    </div>

                    <div className="sm:col-span-1 col-span-2">
                      <div className="border-t border-slate-400 pt-1 mx-4">
                        <p className="font-bold text-slate-900">{settings?.principalName || 'Direção Geral'}</p>
                        <p className="text-[10px] text-slate-500">{settings?.principalTitle || 'Diretora Pedagógica Geral'}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-center text-[9px] text-slate-400 mt-6 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span>SucessoEdu Gestão Educacional v5.0 • Documento Oficial Autenticado</span>
                  <span>Total de Registros: {items.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
