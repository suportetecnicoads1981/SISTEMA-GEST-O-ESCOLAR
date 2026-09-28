import React, { useMemo, useState } from 'react';
import { Filter, X } from 'lucide-react';
import { SchoolClass, SchoolUnit } from '../../types';

/**
 * Filtro de escopo dos gráficos: Escola, Etapa/Série e Turno.
 *
 * Os gráficos dos módulos misturavam as 14 escolas da rede e, no caso "por turma",
 * tentavam desenhar as 90 turmas de uma vez. Este filtro fica acima dos gráficos e
 * deixa escolher o recorte; o módulo usa useChartScope() para filtrar alunos e turmas.
 */

export interface ChartScope {
  unitId: string;
  series: string;
  shift: string;
}

export const ALL_SCOPE: ChartScope = { unitId: 'ALL', series: 'ALL', shift: 'ALL' };

const SHIFT_OPTIONS: { id: string; label: string; re: RegExp }[] = [
  { id: 'MANHA', label: 'Manhã', re: /MANH|MATUT/ },
  { id: 'TARDE', label: 'Tarde', re: /TARDE|VESPERT/ },
  { id: 'NOITE', label: 'Noite', re: /NOIT|NOTURN/ },
  { id: 'INTEGRAL', label: 'Integral', re: /INTEGRAL/ },
];

const norm = (v: unknown) =>
  String(v ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .trim();

/** Estado do filtro + funções para saber se uma turma/aluno está no recorte. */
export function useChartScope(classes: SchoolClass[] = [], _schoolUnits: SchoolUnit[] = []) {
  const [scope, setScope] = useState<ChartScope>(ALL_SCOPE);
  const classById = useMemo(() => new Map((classes || []).map((c) => [c.id, c])), [classes]);
  const shiftRe = SHIFT_OPTIONS.find((s) => s.id === scope.shift)?.re;

  const classInScope = (c?: SchoolClass | null): boolean => {
    if (!c) return scope.unitId === 'ALL' && scope.series === 'ALL' && scope.shift === 'ALL';
    if (scope.unitId !== 'ALL' && (c as any).schoolUnitId !== scope.unitId) return false;
    if (scope.series !== 'ALL' && norm(c.gradeLevel) !== norm(scope.series)) return false;
    if (shiftRe && !shiftRe.test(norm(c.shift) + ' ' + norm(c.name))) return false;
    return true;
  };

  const studentInScope = (s: { schoolUnitId?: string; classId?: string; shift?: string; series?: string }): boolean => {
    const cls = s.classId ? classById.get(s.classId) : undefined;
    const unitId = s.schoolUnitId || (cls as any)?.schoolUnitId || '';
    if (scope.unitId !== 'ALL' && unitId !== scope.unitId) return false;
    if (scope.series !== 'ALL' && norm(cls?.gradeLevel || s.series) !== norm(scope.series)) return false;
    if (shiftRe && !shiftRe.test(norm(cls?.shift || s.shift) + ' ' + norm(cls?.name))) return false;
    return true;
  };

  const isFiltered = scope.unitId !== 'ALL' || scope.series !== 'ALL' || scope.shift !== 'ALL';
  return { scope, setScope, classInScope, studentInScope, isFiltered };
}

interface ChartScopeBarProps {
  scope: ChartScope;
  onChange: (next: ChartScope) => void;
  classes: SchoolClass[];
  schoolUnits: SchoolUnit[];
  /** Texto curto do que o filtro afeta (ex.: "gráficos e indicadores abaixo"). */
  appliesTo?: string;
  /** Quantidade no recorte, mostrada ao lado (ex.: "37 evadidos"). */
  countText?: string;
  showShift?: boolean;
}

export const ChartScopeBar: React.FC<ChartScopeBarProps> = ({
  scope,
  onChange,
  classes,
  schoolUnits,
  appliesTo = 'gráficos abaixo',
  countText,
  showShift = true,
}) => {
  const collator = useMemo(() => new Intl.Collator('pt-BR', { numeric: true }), []);
  const units = useMemo(
    () =>
      (schoolUnits || [])
        .filter((u) => (classes || []).some((c) => (c as any).schoolUnitId === u.id))
        .sort((a, b) => collator.compare(a.name, b.name)),
    [schoolUnits, classes, collator]
  );
  const seriesList = useMemo(() => {
    const set = new Map<string, string>();
    (classes || [])
      .filter((c) => scope.unitId === 'ALL' || (c as any).schoolUnitId === scope.unitId)
      .forEach((c) => {
        const g = String(c.gradeLevel || '').trim();
        if (g && !set.has(norm(g))) set.set(norm(g), g);
      });
    return Array.from(set.values()).sort(collator.compare);
  }, [classes, scope.unitId, collator]);

  const isFiltered = scope.unitId !== 'ALL' || scope.series !== 'ALL' || scope.shift !== 'ALL';
  const sel = 'px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-semibold text-slate-800 max-w-[260px]';

  return (
    <div className="no-print flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 pr-1">
        <Filter className="h-3.5 w-3.5 text-indigo-600" />
        Filtrar {appliesTo}:
      </span>
      <select
        aria-label="Escola"
        value={scope.unitId}
        onChange={(e) => onChange({ unitId: e.target.value, series: 'ALL', shift: scope.shift })}
        className={sel}
      >
        <option value="ALL">Todas as escolas ({units.length})</option>
        {units.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>
      <select aria-label="Etapa ou série" value={scope.series} onChange={(e) => onChange({ ...scope, series: e.target.value })} className={sel}>
        <option value="ALL">Todas as etapas/séries</option>
        {seriesList.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {showShift && (
        <select aria-label="Turno" value={scope.shift} onChange={(e) => onChange({ ...scope, shift: e.target.value })} className={sel}>
          <option value="ALL">Todos os turnos</option>
          {SHIFT_OPTIONS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      )}
      {isFiltered && (
        <button
          type="button"
          onClick={() => onChange(ALL_SCOPE)}
          className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-bold rounded-lg text-slate-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
          Limpar
        </button>
      )}
      {countText && <span className="ml-auto text-[11px] font-semibold text-slate-500">{countText}</span>}
    </div>
  );
};

export default ChartScopeBar;
