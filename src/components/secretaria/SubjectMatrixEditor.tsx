import React, { useState } from 'react';
import { BookOpen, Edit2, Plus, Save, Trash2, X } from 'lucide-react';
import { Subject } from '../../types';
import { confirmDialog } from '../../utils/dialogs';

/**
 * Matriz de disciplinas com cadastro, alteração e exclusão.
 * Antes a matriz era somente leitura: não havia como incluir ou corrigir disciplinas.
 */
interface SubjectMatrixEditorProps {
  subjects: Subject[];
  onSaveSubject?: (subject: Subject) => void;
  onDeleteSubject?: (id: string) => void;
}

const SEGMENTS: { value: string; label: string }[] = [
  { value: 'EDUCACAO_INFANTIL', label: 'Educação Infantil' },
  { value: 'ENSINO_FUNDAMENTAL', label: 'Ensino Fundamental' },
  { value: 'ENSINO_FUNDAMENTAL_I', label: 'Ensino Fundamental I' },
  { value: 'ENSINO_FUNDAMENTAL_II', label: 'Ensino Fundamental II' },
  { value: 'ENSINO_MEDIO', label: 'Ensino Médio' },
  { value: 'EJA', label: 'EJA' },
];

const segmentLabel = (value: string) => SEGMENTS.find((s) => s.value === value)?.label || value || '—';

type Draft = { id?: string; name: string; code: string; segment: string; teacherName: string; workloadHours: string };

const emptyDraft: Draft = { name: '', code: '', segment: 'ENSINO_FUNDAMENTAL', teacherName: '', workloadHours: '80' };

export const SubjectMatrixEditor: React.FC<SubjectMatrixEditorProps> = ({ subjects, onSaveSubject, onDeleteSubject }) => {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState('');
  const canEdit = Boolean(onSaveSubject);

  const startNew = () => {
    setError('');
    setDraft({ ...emptyDraft });
  };

  const startEdit = (s: Subject) => {
    setError('');
    setDraft({
      id: s.id,
      name: s.name || '',
      code: s.code || '',
      segment: s.segment || 'ENSINO_FUNDAMENTAL',
      teacherName: s.teacherName || '',
      workloadHours: String(s.workloadHours ?? ''),
    });
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft || !onSaveSubject) return;
    const name = draft.name.trim();
    const code = draft.code.trim().toUpperCase();
    const hours = Number(draft.workloadHours);
    if (!name) return setError('Informe o nome da disciplina.');
    if (!code) return setError('Informe o código da disciplina (ex.: MAT-01).');
    if (!Number.isFinite(hours) || hours < 0 || hours > 2000) return setError('Carga horária inválida (0 a 2000 h/a).');
    const duplicated = subjects.some(
      (s) => s.id !== draft.id && ((s.code || '').toUpperCase() === code || (s.name || '').trim().toLowerCase() === name.toLowerCase())
    );
    if (duplicated) return setError('Já existe uma disciplina com esse nome ou código.');

    const existing = draft.id ? subjects.find((s) => s.id === draft.id) : undefined;
    onSaveSubject({
      ...(existing || {}),
      id: draft.id || `sub-${Date.now()}`,
      name,
      code,
      segment: draft.segment,
      teacherName: draft.teacherName.trim(),
      workloadHours: hours,
    });
    setDraft(null);
    setError('');
  };

  const remove = async (s: Subject) => {
    if (!onDeleteSubject) return;
    if (await confirmDialog(`Excluir a disciplina "${s.name}"?`)) onDeleteSubject(s.id);
  };

  const input =
    'w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-indigo-600" />
          Matriz de Disciplinas e Carga Horária (BNCC & Itinerários)
          <span className="text-xs font-semibold text-slate-400">({subjects.length})</span>
        </h3>
        {canEdit && !draft && (
          <button
            type="button"
            onClick={startNew}
            className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nova Disciplina</span>
          </button>
        )}
      </div>

      {draft && (
        <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3 rounded-xl bg-indigo-50/50 border border-indigo-100">
          <label className="md:col-span-2 text-[11px] font-semibold text-slate-600">
            Disciplina *
            <input className={input} value={draft.name} onChange={(e) => setDraft((d) => d && { ...d, name: e.target.value })} placeholder="Ex: Matemática" />
          </label>
          <label className="text-[11px] font-semibold text-slate-600">
            Código *
            <input className={input} value={draft.code} onChange={(e) => setDraft((d) => d && { ...d, code: e.target.value })} placeholder="Ex: MAT-01" />
          </label>
          <label className="text-[11px] font-semibold text-slate-600">
            Segmento
            <select className={input} value={draft.segment} onChange={(e) => setDraft((d) => d && { ...d, segment: e.target.value })}>
              {SEGMENTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[11px] font-semibold text-slate-600">
            Docente responsável
            <input className={input} value={draft.teacherName} onChange={(e) => setDraft((d) => d && { ...d, teacherName: e.target.value })} placeholder="Opcional" />
          </label>
          <label className="text-[11px] font-semibold text-slate-600">
            Carga horária (h/a)
            <input className={input} type="number" min={0} max={2000} value={draft.workloadHours} onChange={(e) => setDraft((d) => d && { ...d, workloadHours: e.target.value })} />
          </label>
          {error && <p role="alert" className="md:col-span-6 text-xs font-semibold text-rose-600">{error}</p>}
          <div className="md:col-span-6 flex justify-end gap-2">
            <button type="button" onClick={() => { setDraft(null); setError(''); }} className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg flex items-center gap-1 cursor-pointer">
              <X className="h-3.5 w-3.5" /> Cancelar
            </button>
            <button type="submit" className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1 cursor-pointer">
              <Save className="h-3.5 w-3.5" /> Salvar Disciplina
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-3">Código</th>
              <th className="py-2.5 px-3">Disciplina</th>
              <th className="py-2.5 px-3">Segmento</th>
              <th className="py-2.5 px-3">Docente Responsável</th>
              <th className="py-2.5 px-3 text-right">Carga Horária Anual</th>
              {canEdit && <th className="py-2.5 px-3 text-right">Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {subjects.length === 0 && (
              <tr>
                <td colSpan={canEdit ? 6 : 5} className="py-6 text-center text-slate-400">
                  Nenhuma disciplina cadastrada.
                </td>
              </tr>
            )}
            {subjects.map((sub) => (
              <tr key={sub.id} className="hover:bg-slate-50/60">
                <td className="py-2.5 px-3 font-mono font-semibold text-indigo-600">{sub.code}</td>
                <td className="py-2.5 px-3 font-bold text-slate-800">{sub.name}</td>
                <td className="py-2.5 px-3 text-slate-600">{segmentLabel(sub.segment)}</td>
                <td className="py-2.5 px-3 text-slate-600">{sub.teacherName || '—'}</td>
                <td className="py-2.5 px-3 text-right font-semibold text-slate-800">{sub.workloadHours} h/a</td>
                {canEdit && (
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <button type="button" onClick={() => startEdit(sub)} title="Editar disciplina" aria-label={`Editar disciplina ${sub.name}`} className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    {onDeleteSubject && (
                      <button type="button" onClick={() => remove(sub)} title="Excluir disciplina" aria-label={`Excluir disciplina ${sub.name}`} className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
