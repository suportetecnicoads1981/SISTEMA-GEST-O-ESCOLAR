/**
 * Lançar respostas de prova aplicada no papel.
 * O professor digita a letra marcada por cada aluno (A, B, C...) e, nas discursivas, os pontos.
 * O sistema corrige na hora e grava uma correção por aluno (lançar de novo substitui a anterior).
 * Linha em branco = aluno sem prova (faltou).
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Save, ClipboardCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Exam, ExamSubmission, Question, SchoolClass, SchoolUnit, Student } from '../../types';
import {
  gradePaperSubmission,
  marksAreEmpty,
  marksFromSubmission,
  optionLetter,
  questionPoints,
  questionSkillCodes,
  classesForExam,
  PaperMarks,
} from '../../services/bncc/examSkillService';
import { classLabelWithSchool } from '../../utils/schoolDataNormalizer';

interface Props {
  exam: Exam;
  questions: Question[];
  classes: SchoolClass[];
  students: Student[];
  submissions: ExamSubmission[];
  onSave: (examId: string, upserts: ExamSubmission[], removeStudentIds: string[]) => void;
  onClose: () => void;
  schoolUnits?: SchoolUnit[];
}

export const PaperAnswersModal: React.FC<Props> = ({ exam, questions, classes, students, submissions, onSave, onClose, schoolUnits = [] }) => {
  const [classId, setClassId] = useState<string>(exam.classId || '');
  const [marks, setMarks] = useState<Record<string, PaperMarks>>({});
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const cellRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // A prova vale para as turmas da mesma série da turma escolhida na prova.
  const examClasses = useMemo(() => classesForExam(exam, classes), [exam, classes]);
  const qMap = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions]);
  const items = useMemo(
    () =>
      exam.questions.map((cfg, idx) => {
        const q = qMap.get(cfg.questionId);
        const objective = !!q && (q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_FALSE');
        const correctIdx = q?.options?.findIndex((o) => o.isCorrect) ?? -1;
        return {
          cfg,
          idx,
          q,
          objective,
          letters: objective ? (q?.options || []).map((_, i) => optionLetter(i)) : [],
          correct: correctIdx >= 0 ? optionLetter(correctIdx) : '',
          points: questionPoints(exam, idx),
          skills: questionSkillCodes(q),
        };
      }),
    [exam, qMap]
  );

  const classStudents = useMemo(
    () => students.filter((s) => s.classId === classId && s.status !== 'TRANSFERRED' && s.status !== 'EVADIDO').sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [students, classId]
  );

  // Reabre com o que já foi lançado (papel ou computador).
  useEffect(() => {
    const init: Record<string, PaperMarks> = {};
    for (const st of classStudents) {
      const sub = submissions
        .filter((s) => s.examId === exam.id && s.studentId === st.id)
        .sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt)))[0];
      init[st.id] = marksFromSubmission(exam, questions, sub);
    }
    setMarks(init);
    setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, exam.id]);

  const setMark = (studentId: string, qid: string, value: { letter?: string; score?: number | null }) => {
    setMarks((prev) => ({ ...prev, [studentId]: { ...(prev[studentId] || {}), [qid]: value } }));
    setDirty(true);
  };

  const focusCell = (row: number, col: number) => {
    const st = classStudents[row];
    const it = items[col];
    if (!st || !it) return;
    const el = cellRefs.current[`${st.id}|${it.cfg.questionId}`];
    if (el) {
      el.focus();
      el.select?.();
    }
  };

  const nextCell = (row: number, col: number) => {
    if (col + 1 < items.length) focusCell(row, col + 1);
    else focusCell(row + 1, 0);
  };

  const preview = (st: Student) => {
    const m = marks[st.id];
    if (marksAreEmpty(m)) return null;
    return gradePaperSubmission(exam, questions, st, m || {});
  };

  const handleSave = () => {
    const upserts: ExamSubmission[] = [];
    const removeIds: string[] = [];
    const now = new Date().toISOString();
    for (const st of classStudents) {
      const m = marks[st.id];
      const had = submissions.some((s) => s.examId === exam.id && s.studentId === st.id);
      if (marksAreEmpty(m)) {
        if (had) removeIds.push(st.id);
        continue;
      }
      upserts.push(gradePaperSubmission(exam, questions, st, m || {}, now));
    }
    onSave(exam.id, upserts, removeIds);
    setDirty(false);
    setMsg({
      ok: true,
      text: `Respostas salvas: ${upserts.length} aluno(s) corrigido(s)${removeIds.length ? `, ${removeIds.length} correção(ões) apagada(s) (linha em branco)` : ''}.`,
    });
  };

  const missingQuestions = items.filter((it) => !it.q).length;
  const withoutSkill = items.filter((it) => it.q && !it.skills.length).length;
  const noKey = items.filter((it) => it.objective && !it.correct).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-[98vw] xl:max-w-7xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        <div className="px-5 py-3 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Lançar respostas da prova (aplicada no papel)</h3>
              <p className="text-xs text-slate-300">
                {exam.title} • {exam.subject} • {exam.term}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-slate-300 flex items-center gap-2">
              Turma
              <select
                value={classId}
                onChange={(e) => {
                  if (dirty && !window.confirm('Há respostas não salvas nesta turma. Trocar mesmo assim?')) return;
                  setClassId(e.target.value);
                }}
                className="px-2 py-1.5 rounded-lg text-slate-900 text-xs min-w-[180px]"
              >
                <option value="">Selecione a turma</option>
                {examClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {classLabelWithSchool(c, schoolUnits)}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={handleSave}
              disabled={!classId || !classStudents.length}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> Salvar respostas
            </button>
            <button
              onClick={() => {
                if (dirty && !window.confirm('Há respostas não salvas. Fechar mesmo assim?')) return;
                onClose();
              }}
              className="p-2 rounded-lg hover:bg-slate-800 cursor-pointer"
              title="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="px-5 py-2 bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600 space-y-1">
          <p>
            Digite a <strong>letra marcada</strong> pelo aluno em cada questão (o cursor pula sozinho para a próxima). Nas discursivas, digite os{' '}
            <strong>pontos</strong>. Deixe a linha toda em branco para o aluno que <strong>faltou</strong>. As letras seguem a ordem do caderno impresso.
          </p>
          {(missingQuestions > 0 || withoutSkill > 0 || noKey > 0) && (
            <p className="flex items-start gap-1.5 text-amber-800">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                {missingQuestions > 0 && `${missingQuestions} questão(ões) não encontrada(s) no banco. `}
                {noKey > 0 && `${noKey} questão(ões) objetiva(s) sem gabarito marcado. `}
                {withoutSkill > 0 && `${withoutSkill} questão(ões) sem habilidade BNCC: não entram no relatório por habilidade.`}
              </span>
            </p>
          )}
          {msg && (
            <p className={`flex items-center gap-1.5 font-semibold ${msg.ok ? 'text-emerald-700' : 'text-rose-700'}`}>
              <CheckCircle2 className="h-3.5 w-3.5" /> {msg.text}
            </p>
          )}
        </div>

        <div className="overflow-auto flex-1">
          {!classId ? (
            <p className="p-10 text-center text-sm text-slate-500">Escolha a turma que fez a prova.</p>
          ) : !classStudents.length ? (
            <p className="p-10 text-center text-sm text-slate-500">Nenhum aluno nesta turma.</p>
          ) : (
            <table className="text-xs border-collapse min-w-full">
              <thead className="sticky top-0 z-10 bg-white shadow-sm">
                <tr>
                  <th className="sticky left-0 bg-white text-left px-3 py-2 border-b border-slate-200 min-w-[220px]">Aluno</th>
                  {items.map((it) => (
                    <th key={it.cfg.questionId} className="px-1 py-1 border-b border-slate-200 text-center min-w-[52px]" title={it.q?.stem?.slice(0, 200)}>
                      <div className="font-black text-slate-800">Q{it.idx + 1}</div>
                      <div className="text-[10px] font-semibold text-emerald-700">{it.objective ? `Gab. ${it.correct || '?'}` : `0–${it.points}`}</div>
                      <div className="text-[9px] font-mono text-slate-500 leading-tight">{it.skills.join(' ') || 'sem hab.'}</div>
                    </th>
                  ))}
                  <th className="px-3 py-2 border-b border-slate-200 text-center">Nota</th>
                  <th className="px-3 py-2 border-b border-slate-200 text-center">%</th>
                </tr>
              </thead>
              <tbody>
                {classStudents.map((st, row) => {
                  const res = preview(st);
                  return (
                    <tr key={st.id} className="odd:bg-slate-50/60">
                      <td className="sticky left-0 bg-inherit px-3 py-1 border-b border-slate-100 font-semibold text-slate-800 whitespace-nowrap">
                        {row + 1}. {st.name}
                      </td>
                      {items.map((it, col) => {
                        const key = `${st.id}|${it.cfg.questionId}`;
                        const m = marks[st.id]?.[it.cfg.questionId] || {};
                        const ans = res?.answers.find((a) => a.questionId === it.cfg.questionId);
                        const filled = it.objective ? !!m.letter : m.score !== undefined && m.score !== null && (m.score as any) !== '';
                        const color = !filled ? 'border-slate-300 bg-white' : ans?.isCorrect ? 'border-emerald-400 bg-emerald-50 text-emerald-800' : 'border-rose-300 bg-rose-50 text-rose-800';
                        return (
                          <td key={key} className="px-1 py-1 border-b border-slate-100 text-center">
                            {it.objective ? (
                              <input
                                ref={(el) => {
                                  cellRefs.current[key] = el;
                                }}
                                value={m.letter || ''}
                                maxLength={1}
                                onChange={(e) => {
                                  const v = e.target.value.trim().toUpperCase();
                                  if (v && !it.letters.includes(v)) return;
                                  setMark(st.id, it.cfg.questionId, { letter: v });
                                  if (v) nextCell(row, col);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'ArrowRight') nextCell(row, col);
                                  else if (e.key === 'ArrowLeft') focusCell(row, Math.max(0, col - 1));
                                  else if (e.key === 'ArrowDown' || e.key === 'Enter') focusCell(row + 1, col);
                                  else if (e.key === 'ArrowUp') focusCell(row - 1, col);
                                }}
                                className={`w-10 h-8 text-center font-black uppercase rounded-md border ${color}`}
                                title={`Alternativas: ${it.letters.join(', ')}`}
                              />
                            ) : (
                              <input
                                ref={(el) => {
                                  cellRefs.current[key] = el;
                                }}
                                type="number"
                                min={0}
                                max={it.points}
                                step={0.1}
                                value={m.score ?? ''}
                                onChange={(e) =>
                                  setMark(st.id, it.cfg.questionId, { score: e.target.value === '' ? null : Math.min(it.points, Math.max(0, Number(e.target.value))) })
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') focusCell(row + 1, col);
                                }}
                                className={`w-14 h-8 text-center font-bold rounded-md border ${color}`}
                              />
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-1 border-b border-slate-100 text-center font-bold">
                        {res ? `${res.totalScore.toFixed(1)}/${res.maxScore}` : <span className="text-slate-400">faltou</span>}
                      </td>
                      <td className="px-3 py-1 border-b border-slate-100 text-center font-bold">{res ? `${res.percentage}%` : ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
