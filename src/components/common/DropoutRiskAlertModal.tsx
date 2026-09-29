import React from 'react';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';
import type { DropoutRiskStudent } from '../../utils/dropoutRiskEngine';

interface DropoutRiskAlertModalProps {
  isOpen: boolean;
  students: DropoutRiskStudent[];
  criterion: string;
  unitLabel: string;
  onOpenCensus: () => void;
  onAcknowledge: () => void;
}

const fmtDate = (iso?: string) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '—');

/**
 * Janela de aviso na tela do usuário: alunos que atingiram o limite de faltas sem justificativa.
 * Volta a aparecer quando outro aluno atinge o limite ou quando um aluno já avisado soma novas faltas.
 */
export const DropoutRiskAlertModal: React.FC<DropoutRiskAlertModalProps> = ({
  isOpen,
  students,
  criterion,
  unitLabel,
  onOpenCensus,
  onAcknowledge,
}) => {
  if (!isOpen || !students.length) return null;
  const shown = students.slice(0, 8);
  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-labelledby="dropout-risk-title">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border-2 border-rose-400 overflow-hidden">
        <div className="px-5 py-4 bg-rose-600 text-white flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-6 w-6 shrink-0 mt-0.5" />
            <div>
              <h2 id="dropout-risk-title" className="text-base font-black">Atenção: risco de evasão</h2>
              <p className="text-xs text-rose-50 mt-0.5">
                {students.length === 1 ? '1 aluno atingiu' : `${students.length} alunos atingiram`} o limite de {criterion}.
              </p>
            </div>
          </div>
          <button type="button" onClick={onAcknowledge} className="p-1 rounded-lg hover:bg-rose-500 cursor-pointer" title="Fechar (marcar como ciente)">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <ul className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
            {shown.map((s) => (
              <li key={s.studentId} className="px-3 py-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 truncate">{s.studentName}</div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {s.className || 'Sem turma'} • última falta {fmtDate(s.lastAbsenceDate)}
                    {s.inActiveSearch ? ' • já em busca ativa' : ''}
                  </div>
                </div>
                <span className="shrink-0 px-2 py-0.5 rounded-full bg-rose-600 text-white text-xs font-black">
                  {s.absences} {unitLabel}
                </span>
              </li>
            ))}
          </ul>
          {students.length > shown.length && (
            <p className="text-xs text-slate-500">E mais {students.length - shown.length} aluno(s). A lista completa está no painel de risco.</p>
          )}
          <p className="text-xs text-slate-600 flex items-start gap-1.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            Procure a família e abra a busca ativa antes que a evasão aconteça.
          </p>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
            <button type="button" onClick={onAcknowledge} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 cursor-pointer">
              Ciente
            </button>
            <button type="button" onClick={onOpenCensus} className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold cursor-pointer">
              Ver alunos e abrir busca ativa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
