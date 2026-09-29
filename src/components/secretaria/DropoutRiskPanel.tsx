import React, { useEffect, useState } from 'react';
import { AlertTriangle, BellRing, ChevronDown, ChevronUp, Save, Settings2, ShieldAlert, UserCheck } from 'lucide-react';
import type { DropoutAlertConfig } from '../../types';
import {
  DropoutRiskResult,
  DropoutRiskStudent,
  describeDropoutCriterion,
  normalizeDropoutConfig,
} from '../../utils/dropoutRiskEngine';

interface DropoutRiskPanelProps {
  result: DropoutRiskResult;
  /** Quem pode alterar o critério (permissão de edição em Secretaria & Alunos). */
  canConfigure: boolean;
  onSaveConfig?: (config: DropoutAlertConfig) => void;
  /** Abre a ficha de busca ativa do aluno. */
  onOpenStudent: (studentId: string) => void;
}

const fmtDate = (iso?: string) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '—');

/**
 * Painel de risco de evasão por infrequência (Censo de Evasão & Busca Ativa):
 * lista os alunos que atingiram (ou estão perto de atingir) o limite de faltas sem justificativa
 * e permite ajustar o critério do alerta.
 */
export const DropoutRiskPanel: React.FC<DropoutRiskPanelProps> = ({ result, canConfigure, onSaveConfig, onOpenStudent }) => {
  const { config, atLimit, nearLimit, warnFrom } = result;
  const [editing, setEditing] = useState(false);
  const [showNear, setShowNear] = useState(false);
  const [draft, setDraft] = useState<DropoutAlertConfig>(config);

  useEffect(() => {
    if (!editing) setDraft(config);
  }, [config, editing]);

  const save = () => {
    onSaveConfig?.(normalizeDropoutConfig(draft));
    setEditing(false);
  };

  const unit = config.countMode === 'AULAS' ? 'faltas' : 'dias';

  const row = (s: DropoutRiskStudent) => (
    <tr key={s.studentId} className="border-t border-slate-100">
      <td className="py-2 px-3">
        <div className="font-bold text-slate-900 text-xs">{s.studentName}</div>
        <div className="text-[10px] text-slate-500">{s.enrollmentNumber || 'Sem RA'}</div>
      </td>
      <td className="py-2 px-3 text-xs text-slate-700">{s.className || '—'}</td>
      <td className="py-2 px-3 text-center">
        <span
          className={`inline-flex min-w-[2.5rem] justify-center px-2 py-0.5 rounded-full text-xs font-black ${
            s.level === 'LIMITE' ? 'bg-rose-600 text-white' : 'bg-amber-100 text-amber-800'
          }`}
        >
          {s.absences}
        </span>
      </td>
      <td className="py-2 px-3 text-center text-xs text-slate-500">{s.justified}</td>
      <td className="py-2 px-3 text-xs text-slate-700">{fmtDate(s.lastAbsenceDate)}</td>
      <td className="py-2 px-3 text-right no-print">
        {s.inActiveSearch ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
            <UserCheck className="h-3.5 w-3.5" /> Em busca ativa
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onOpenStudent(s.studentId)}
            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[11px] font-bold cursor-pointer"
          >
            Abrir busca ativa
          </button>
        )}
      </td>
    </tr>
  );

  return (
    <div
      id="painel-risco-evasao"
      className={`rounded-2xl border shadow-2xs overflow-hidden ${atLimit.length ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200 bg-white'}`}
    >
      <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200/70">
        <div className="flex items-start gap-3">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${atLimit.length ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">Risco de evasão por faltas sem justificativa</h2>
            <p className="text-xs text-slate-600 mt-0.5">
              {config.enabled ? (
                <>
                  Alerta quando o aluno atinge <strong>{describeDropoutCriterion(config)}</strong>. Aparece aqui, no Início, na Central de Notificações e numa janela de aviso.
                </>
              ) : (
                <strong className="text-slate-700">Alerta desligado.</strong>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-center px-3 py-1.5 rounded-xl bg-rose-600 text-white">
            <div className="text-xl font-black leading-none">{atLimit.length}</div>
            <div className="text-[10px] font-bold uppercase">no limite</div>
          </div>
          <div className="text-center px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900">
            <div className="text-xl font-black leading-none">{nearLimit.length}</div>
            <div className="text-[10px] font-bold uppercase">em atenção</div>
          </div>
          {canConfigure && (
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className="no-print px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              title="Definir o limite de faltas sem justificativa"
            >
              <Settings2 className="h-4 w-4" /> Critério do alerta
            </button>
          )}
        </div>
      </div>

      {editing && canConfigure && (
        <div className="no-print p-4 bg-white border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <label className="flex items-center gap-2 font-bold text-slate-700 sm:col-span-2 lg:col-span-4">
            <input
              type="checkbox"
              checked={draft.enabled}
              onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
              className="h-4 w-4 accent-rose-600"
            />
            Alerta de risco de evasão ligado
          </label>
          <label className="space-y-1">
            <span className="block font-bold text-slate-700">Limite de faltas sem justificativa</span>
            <input
              type="number"
              min={1}
              max={200}
              value={draft.maxUnjustifiedAbsences}
              onChange={(e) => setDraft({ ...draft, maxUnjustifiedAbsences: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="block font-bold text-slate-700">Contar</span>
            <select
              value={draft.countMode}
              onChange={(e) => setDraft({ ...draft, countMode: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
            >
              <option value="DIAS">Dias com falta (várias aulas no dia = 1)</option>
              <option value="AULAS">Cada aula com falta</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="block font-bold text-slate-700">Período</span>
            <select
              value={draft.period}
              onChange={(e) => setDraft({ ...draft, period: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
            >
              <option value="ANO_LETIVO">Ano letivo inteiro</option>
              <option value="ULTIMOS_DIAS">Últimos dias</option>
            </select>
          </label>
          {draft.period === 'ULTIMOS_DIAS' ? (
            <label className="space-y-1">
              <span className="block font-bold text-slate-700">Quantos dias</span>
              <input
                type="number"
                min={1}
                max={365}
                value={draft.windowDays}
                onChange={(e) => setDraft({ ...draft, windowDays: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </label>
          ) : (
            <div />
          )}
          <label className="space-y-1">
            <span className="block font-bold text-slate-700">"Em atenção" a partir de (% do limite)</span>
            <input
              type="number"
              min={10}
              max={100}
              value={draft.warnAtPercent}
              onChange={(e) => setDraft({ ...draft, warnAtPercent: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </label>
          <label className="flex items-center gap-2 font-bold text-slate-700 sm:col-span-2 lg:col-span-3">
            <input
              type="checkbox"
              checked={draft.showPopup}
              onChange={(e) => setDraft({ ...draft, showPopup: e.target.checked })}
              className="h-4 w-4 accent-rose-600"
            />
            Mostrar janela de aviso na tela dos usuários quando um aluno atingir o limite
          </label>
          <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-between gap-3 pt-1">
            <span className="text-slate-500">
              Vale para toda a rede. Falta justificada (com motivo no diário) não conta.
            </span>
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditing(false)} className="px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-bold cursor-pointer">
                Cancelar
              </button>
              <button type="button" onClick={save} className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer">
                <Save className="h-4 w-4" /> Salvar critério
              </button>
            </div>
          </div>
        </div>
      )}

      {config.enabled && (
        <div className="p-4 space-y-3">
          {atLimit.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <BellRing className="h-4 w-4" /> Nenhum aluno atingiu o limite de faltas sem justificativa.
            </div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-xl border border-rose-200">
              <table className="w-full text-left">
                <thead className="bg-rose-50 text-[10px] uppercase text-rose-900 font-bold">
                  <tr>
                    <th className="py-2 px-3">Aluno</th>
                    <th className="py-2 px-3">Turma</th>
                    <th className="py-2 px-3 text-center">Faltas s/ just. ({unit})</th>
                    <th className="py-2 px-3 text-center">Justificadas</th>
                    <th className="py-2 px-3">Última falta</th>
                    <th className="py-2 px-3 text-right no-print">Ação</th>
                  </tr>
                </thead>
                <tbody>{atLimit.map(row)}</tbody>
              </table>
            </div>
          )}

          {nearLimit.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowNear((v) => !v)}
                className="no-print inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:underline cursor-pointer"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                {nearLimit.length} aluno(s) em atenção (a partir de {warnFrom} {unit} sem justificativa)
                {showNear ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
              {showNear && (
                <div className="overflow-x-auto bg-white rounded-xl border border-amber-200 mt-2">
                  <table className="w-full text-left">
                    <thead className="bg-amber-50 text-[10px] uppercase text-amber-900 font-bold">
                      <tr>
                        <th className="py-2 px-3">Aluno</th>
                        <th className="py-2 px-3">Turma</th>
                        <th className="py-2 px-3 text-center">Faltas s/ just. ({unit})</th>
                        <th className="py-2 px-3 text-center">Justificadas</th>
                        <th className="py-2 px-3">Última falta</th>
                        <th className="py-2 px-3 text-right no-print">Ação</th>
                      </tr>
                    </thead>
                    <tbody>{nearLimit.map(row)}</tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
