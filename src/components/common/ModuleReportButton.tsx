import React, { useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import {
  ConfigurablePrintModal,
  PrintColumnConfig,
  AppliedFilterItem,
  SummaryMetricItem,
} from './ConfigurablePrintModal';

/**
 * Botão "Relatório / Exportar" padrão dos módulos de dados.
 *
 * Abre o mesmo painel usado nos relatórios de Alunos e Matrículas: escolha de colunas,
 * pré-visualização, impressão com o timbre, Excel formatado, Word e CSV.
 * As linhas chegam prontas (texto) e já filtradas pela tela do módulo.
 */
export interface ModuleReportButtonProps {
  title: string;
  subtitle?: string;
  columns: PrintColumnConfig[];
  /** Linhas do relatório: objetos com uma chave por coluna (id). */
  rows: Record<string, any>[];
  fileName: string;
  appliedFilters?: AppliedFilterItem[];
  summaryMetrics?: SummaryMetricItem[];
  orientation?: 'portrait' | 'landscape';
  /** Separa por escola (cada escola em página própria, com o timbre dela). Usa row.schoolUnitId / row.schoolName. */
  groupBySchool?: boolean;
  /** Filtros extras mostrados dentro do painel. */
  filterControls?: React.ReactNode;
  countLabel?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export const ModuleReportButton: React.FC<ModuleReportButtonProps> = ({
  title,
  subtitle,
  columns,
  rows,
  fileName,
  appliedFilters,
  summaryMetrics,
  orientation = 'portrait',
  groupBySchool,
  filterControls,
  countLabel = 'Total de registros',
  label = 'Relatório / Exportar',
  className,
  disabled,
}) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        title="Filtrar colunas, pré-visualizar, imprimir ou exportar (PDF, Excel, Word, CSV)"
        className={
          className ||
          'no-print inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-50 cursor-pointer'
        }
      >
        <FileSpreadsheet className="w-4 h-4" />
        <span>{label}</span>
      </button>
      {open && (
        <ConfigurablePrintModal
          isOpen={open}
          onClose={() => setOpen(false)}
          title={title}
          subtitle={subtitle}
          columns={columns}
          data={rows}
          appliedFilters={appliedFilters}
          summaryMetrics={summaryMetrics}
          defaultOrientation={orientation}
          fileName={fileName}
          countLabel={countLabel}
          filterControls={filterControls}
          renderCell={(row: any, colId: string, i: number) =>
            colId === 'index' ? String(i + 1) : row?.[colId] === null || row?.[colId] === undefined ? '' : String(row[colId])
          }
          groupBy={
            groupBySchool
              ? (row: any) => ({
                  key: String(row.schoolUnitId || row.schoolName || '-'),
                  schoolUnitId: row.schoolUnitId || undefined,
                  lines: [['Escola', String(row.schoolName || 'Não informada')]],
                })
              : undefined
          }
        />
      )}
    </>
  );
};

export default ModuleReportButton;

/** Data (aaaa-mm-dd ou ISO) em dd/mm/aaaa, e com hora quando houver (dd/mm/aaaa hh:mm). */
export function reportDate(value: unknown, withTime = false): string {
  const raw = String(value ?? '').trim();
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (!m) return raw;
  const d = `${m[3]}/${m[2]}/${m[1]}`;
  return withTime && m[4] ? `${d} ${m[4]}:${m[5]}` : d;
}
